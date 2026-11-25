import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InMemoryTokenStore, TokenStore } from '../tokens/token-store';
import { TtlCache } from '../common/cache/ttl-cache';
import { throwUpstreamError } from '../common/http/upstream-error';

const JIRA_AUTHORIZE_URL = 'https://auth.atlassian.com/authorize';
const JIRA_TOKEN_URL = 'https://auth.atlassian.com/oauth/token';
const JIRA_ACCESSIBLE_RESOURCES = 'https://api.atlassian.com/oauth/token/accessible-resources';

export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls?: Record<string, string>;
}

export interface JiraIssueSummary {
  key: string;
  summary: string;
  status: string;
  assignee: string | null;
  updated: string;
  url: string;
}

export interface JiraProjectSummary {
  id: string;
  key: string;
  name: string;
}

/**
 * Jira Cloud qua OAuth 2.0 (3LO). KHÔNG dùng PAT, KHÔNG dùng API token cá nhân.
 *
 * Luồng (khác GitHub ở 1 bước):
 *  1. GET /integrations/jira/authorize -> redirect user sang auth.atlassian.com/authorize
 *     với audience=api.atlassian.com, scope, redirect_uri, state, prompt=consent.
 *  2. User đồng ý -> Atlassian redirect về /callback?code=...&state=...
 *  3. Callback đổi code lấy access token ở POST /oauth/token.
 *  4. ⚠️ BƯỚC RIÊNG CỦA ATLASSIAN: gọi GET /oauth/token/accessible-resources
 *     để lấy `cloudId` của site (vd 3004nguyenthanhdat.atlassian.net).
 *     Không có cloudId thì có token cũng không biết gọi API vào site nào.
 *  5. Mọi API Jira sau đó gọi qua: https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/...
 *
 * App OAuth 2.0 (3LO) phải tạo THỦ CÔNG ở Atlassian Developer Console
 * (không có API tạo app) — xem README.
 */
@Injectable()
export class JiraService {
  private readonly logger = new Logger(JiraService.name);
  private readonly cache = new TtlCache<any>();

  /** STUB: userId tạm thời. Sau này lấy từ session/token của Identity service. */
  private readonly demoUserId = 'demo-user';

  /** Kho token — khởi tạo trực tiếp (không inject qua DI vì TokenStore là interface). */
  private readonly tokens: TokenStore = new InMemoryTokenStore();

  constructor(private readonly config: ConfigService) {}

  buildAuthorizeUrl(state: string): string {
    const cfg = this.config.get('jira') as {
      clientId: string;
      redirectUri: string;
      scopes: string[];
    };
    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: cfg.clientId,
      scope: cfg.scopes.join(' '),
      redirect_uri: cfg.redirectUri,
      state,
      response_type: 'code',
      prompt: 'consent',
    });
    return `${JIRA_AUTHORIZE_URL}?${params.toString()}`;
  }

  /** Đổi code lấy token, rồi lấy cloudId của site. */
  async exchangeCodeForToken(code: string): Promise<{ cloudId: string; siteUrl: string }> {
    const cfg = this.config.get('jira') as {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    };
    const res = await fetch(JIRA_TOKEN_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        code,
        redirect_uri: cfg.redirectUri,
      }),
    });
    if (!res.ok) {
      throw new UnauthorizedException(
        `Đổi code Jira thất bại (HTTP ${res.status}). Code có thể đã hết hạn hoặc dùng rồi.`,
      );
    }
    const data = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
      error?: string;
      error_description?: string;
    };
    if (!data.access_token) {
      throw new UnauthorizedException(
        `Atlassian từ chối đổi code: ${data.error ?? 'không rõ lý do'} — ${data.error_description ?? ''}`,
      );
    }

    // Bước riêng của Atlassian: lấy cloudId.
    const resourcesRes = await fetch(JIRA_ACCESSIBLE_RESOURCES, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (!resourcesRes.ok) {
      throw new UnauthorizedException(
        `Lấy accessible-resources thất bại (HTTP ${resourcesRes.status}).`,
      );
    }
    const resources = (await resourcesRes.json()) as Array<{
      id: string;
      name: string;
      url: string;
      scopes: string[];
    }>;
    if (resources.length === 0) {
      throw new UnauthorizedException(
        'Token Jira không truy cập được site nào. Kiểm tra lại scope và site đã cấp quyền.',
      );
    }
    // Nexus dùng 1 site của team; nếu token thấy nhiều site thì lấy site đầu tiên.
    const site = resources[0];
    await this.tokens.save('jira', this.demoUserId, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
      scope: data.scope,
      cloudId: site.id,
      siteUrl: site.url,
    });
    return { cloudId: site.id, siteUrl: site.url };
  }

  async requireTokens(): Promise<{ accessToken: string; cloudId: string; siteUrl: string }> {
    const saved = await this.tokens.get('jira', this.demoUserId);
    if (!saved?.cloudId) {
      throw new UnauthorizedException(
        'Chưa liên kết Jira. Gọi GET /integrations/jira/authorize trước.',
      );
    }
    return { accessToken: saved.accessToken, cloudId: saved.cloudId, siteUrl: saved.siteUrl ?? '' };
  }

  private jiraApiBase(cloudId: string): string {
    return `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3`;
  }

  private async jiraFetch<T>(
    cloudId: string,
    token: string,
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    const res = await fetch(`${this.jiraApiBase(cloudId)}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throwUpstreamError(res.status, `Jira API lỗi HTTP ${res.status}: ${text.slice(0, 300)}`);
    }
    return (await res.json()) as T;
  }

  async getCurrentUser(): Promise<JiraUser> {
    const cacheKey = `jira:user:${this.demoUserId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger.log(`cache hit ${cacheKey}`);
      return cached as JiraUser;
    }

    const { accessToken, cloudId } = await this.requireTokens();
    const user = await this.jiraFetch<JiraUser>(cloudId, accessToken, '/myself');
    this.cache.set(cacheKey, user, 5 * 60 * 1000); // 5 phút
    return user;
  }

  async listProjects(): Promise<JiraProjectSummary[]> {
    const cacheKey = 'jira:projects';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger.log(`cache hit ${cacheKey}`);
      return cached as JiraProjectSummary[];
    }

    const { accessToken, cloudId } = await this.requireTokens();
    const projects = await this.jiraFetch<JiraProjectSummary[]>(cloudId, accessToken, '/project');
    this.cache.set(cacheKey, projects, 5 * 60 * 1000); // 5 phút
    return projects;
  }

  /**
   * Tìm issue bằng JQL. Mặc định: issue được giao cho chính user đã liên kết.
   * Chọn /issues (JQL search) thay vì chỉ liệt kê project — vì Nexus chiếu
   * trạng thái theo từng issue (vd NEX-1024) lên thẻ tin nhắn.
   */
  async searchIssues(jql: string): Promise<JiraIssueSummary[]> {
    const cacheKey = `jira:issues:${jql}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger.log(`cache hit ${cacheKey}`);
      return cached as JiraIssueSummary[];
    }

    const { accessToken, cloudId, siteUrl } = await this.requireTokens();
    const data = await this.jiraFetch<{
      issues: Array<{
        key: string;
        fields: {
          summary: string;
          status: { name: string };
          assignee: { displayName: string } | null;
          updated: string;
        };
      }>;
    }>(cloudId, accessToken, '/search/jql', {
      method: 'POST',
      body: JSON.stringify({
        jql,
        fields: ['summary', 'status', 'assignee', 'updated'],
        maxResults: 50,
      }),
    });
    const result = data.issues.map((issue) => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      assignee: issue.fields.assignee?.displayName ?? null,
      updated: issue.fields.updated,
      url: `${siteUrl}/browse/${issue.key}`,
    }));
    this.cache.set(cacheKey, result, 30 * 1000); // 30s
    return result;
  }

  /**
   * Đăng ký webhook động qua REST API (cần scope manage:jira-webhook).
   * Webhook động chỉ sống 30 ngày nếu không refresh — xem README.
   */
  async registerDynamicWebhook(events: string[]): Promise<{ id: number }> {
    const { accessToken, cloudId } = await this.requireTokens();
    const appBaseUrl = this.config.get('appBaseUrl') as string;
    // Jira trả về { webhookRegistrationResult: [{ createdWebhookId, errors }] } —
    // KHÔNG phải { webhookId } hay { id }. Đọc đúng field, và kiểm tra errors
    // của từng entry: đăng ký có thể thất bại từng phần dù HTTP 200.
    const data = await this.jiraFetch<{
      webhookRegistrationResult?: Array<{
        createdWebhookId?: number;
        errors?: string[];
      }>;
    }>(
      cloudId,
      accessToken,
      '/webhook',
      {
        method: 'POST',
        body: JSON.stringify({
          webhooks: [
            {
              events,
              url: `${appBaseUrl}/integrations/jira/webhooks`,
            },
          ],
        }),
      },
    );
    const result = data.webhookRegistrationResult?.[0];
    if (result?.errors?.length) {
      throw new BadRequestException(
        `Jira từ chối đăng ký webhook: ${result.errors.join('; ')}`,
      );
    }
    if (!result?.createdWebhookId) {
      throw new BadRequestException(
        'Jira không trả về webhook id (webhookRegistrationResult rỗng hoặc thiếu createdWebhookId). Đăng ký chưa chắc đã thành công — kiểm tra lại trên Jira.',
      );
    }
    return { id: result.createdWebhookId };
  }

  /**
   * ⚠️ CẦN TEAM XÁC NHẬN — ghi ngược trạng thái sang Jira.
   * Endpoint này chạm tới phía Jira Automation của Đạt nên mặc định TẮT
   * (JIRA_WRITEBACK_ENABLED=false). Chỉ bật sau khi team đã chốt.
   * Cách làm: lấy danh sách transition của issue, tìm transition dẫn tới
   * trạng thái đích rồi gọi transition đó (không set status trực tiếp —
   * Jira không cho set status, chỉ cho đi qua transition).
   */
  async transitionIssueToStatus(
    issueKey: string,
    targetStatusName: string,
  ): Promise<{ transitioned: boolean; transitionName: string }> {
    const cfg = this.config.get('jira') as { writebackEnabled: boolean };
    if (!cfg.writebackEnabled) {
      throw new ForbiddenException(
        'Ghi trạng thái sang Jira đang TẮT (JIRA_WRITEBACK_ENABLED=false). ' +
          'Chức năng này chạm tới Jira Automation phía Đạt — CẦN TEAM XÁC NHẬN trước khi bật.',
      );
    }
    const { accessToken, cloudId } = await this.requireTokens();
    const transitions = await this.jiraFetch<{
      transitions: Array<{ id: string; name: string; to: { name: string } }>;
    }>(cloudId, accessToken, `/issue/${issueKey}/transitions`);
    const match = transitions.transitions.find(
      (t) => t.to.name.toLowerCase() === targetStatusName.toLowerCase(),
    );
    if (!match) {
      throw new ForbiddenException(
        `Không có transition nào từ trạng thái hiện tại tới "${targetStatusName}". ` +
          `Các transition khả thi: ${transitions.transitions.map((t) => `${t.name} → ${t.to.name}`).join(', ') || 'không có'}.`,
      );
    }
    await this.jiraFetch(cloudId, accessToken, `/issue/${issueKey}/transitions`, {
      method: 'POST',
      body: JSON.stringify({ transition: { id: match.id } }),
    });
    return { transitioned: true, transitionName: match.name };
  }

  /** User đã liên kết Jira chưa (để /workspaces/{id}/integrations/status dùng). */
  async isLinked(): Promise<boolean> {
    const saved = await this.tokens.get('jira', this.demoUserId);
    return saved !== null;
  }
}
