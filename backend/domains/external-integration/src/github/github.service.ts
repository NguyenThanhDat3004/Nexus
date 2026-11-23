import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InMemoryTokenStore, TokenStore } from '../tokens/token-store';
import { TtlCache } from '../common/cache/ttl-cache';
import { throwUpstreamError } from '../common/http/upstream-error';

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_API_BASE = 'https://api.github.com';

export interface GithubUser {
  login: string;
  id: number;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
}

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
  updated_at: string;
}

/**
 * GitHub qua OAuth App (authorization-code flow). KHÔNG dùng PAT.
 *
 * Luồng:
 *  1. GET /integrations/github/authorize -> redirect user sang github.com/login/oauth/authorize
 *     với client_id, scope (repo, read:user), redirect_uri, state.
 *  2. User đồng ý -> GitHub redirect về /callback?code=...&state=...
 *  3. Callback đổi code lấy access_token ở POST /login/oauth/access_token
 *     (code chỉ sống 10 phút; client_secret KHÔNG bao giờ lộ ra frontend).
 *  4. Token lưu vào TokenStore (hiện là bộ nhớ — STUB, xem tokens/token-store.ts).
 */
@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly cache = new TtlCache<any>();

  /** STUB: userId tạm thời. Sau này lấy từ session/token của Identity service. */
  private readonly demoUserId = 'demo-user';

  /** Kho token — khởi tạo trực tiếp (không inject qua DI vì TokenStore là interface). */
  private readonly tokens: TokenStore = new InMemoryTokenStore();

  constructor(private readonly config: ConfigService) {}

  /** URL authorize GitHub — frontend redirect user sang đây. */
  buildAuthorizeUrl(state: string): string {
    const cfg = this.config.get('github') as {
      clientId: string;
      redirectUri: string;
      scopes: string[];
    };
    const params = new URLSearchParams({
      client_id: cfg.clientId,
      redirect_uri: cfg.redirectUri,
      scope: cfg.scopes.join(' '),
      state,
      allow_signup: 'true',
    });
    return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
  }

  /** Đổi authorization code lấy access token (server-to-server). */
  async exchangeCodeForToken(code: string): Promise<{ accessToken: string; scope: string }> {
    const cfg = this.config.get('github') as {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    };
    const res = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        code,
        redirect_uri: cfg.redirectUri,
      }),
    });
    if (!res.ok) {
      throw new UnauthorizedException(
        `Đổi code GitHub thất bại (HTTP ${res.status}). Code có thể đã hết hạn (10 phút) hoặc dùng rồi.`,
      );
    }
    const data = (await res.json()) as {
      access_token?: string;
      scope?: string;
      error?: string;
      error_description?: string;
    };
    if (!data.access_token) {
      throw new UnauthorizedException(
        `GitHub từ chối đổi code: ${data.error ?? 'không rõ lý do'} — ${data.error_description ?? ''}`,
      );
    }
    await this.tokens.save('github', this.demoUserId, {
      accessToken: data.access_token,
      scope: data.scope,
    });
    return { accessToken: data.access_token, scope: data.scope ?? '' };
  }

  /** Lấy token đã lưu — các endpoint API khác dùng chung. */
  async requireToken(): Promise<string> {
    const saved = await this.tokens.get('github', this.demoUserId);
    if (!saved) {
      throw new UnauthorizedException(
        'Chưa liên kết GitHub. Gọi GET /integrations/github/authorize trước.',
      );
    }
    return saved.accessToken;
  }

  async getCurrentUser(): Promise<GithubUser> {
    const cacheKey = `github:user:${this.demoUserId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger.log(`cache hit ${cacheKey}`);
      return cached as GithubUser;
    }

    const token = await this.requireToken();
    const res = await fetch(`${GITHUB_API_BASE}/user`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throwUpstreamError(res.status, `GitHub API lỗi HTTP ${res.status}`);
    const user = (await res.json()) as GithubUser;
    this.cache.set(cacheKey, user, 5 * 60 * 1000); // 5 phút
    return user;
  }

  /**
   * Lấy TẤT CẢ repo mà user có quyền (kể cả private — nhờ scope `repo`).
   * GitHub phân trang 100 repo/trang nên phải đi hết các trang.
   */
  async listAllRepos(): Promise<GithubRepo[]> {
    const cacheKey = `github:repos:${this.demoUserId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger.log(`cache hit ${cacheKey}`);
      return cached as GithubRepo[];
    }

    const token = await this.requireToken();
    const all: GithubRepo[] = [];
    let page = 1;
    for (;;) {
      const res = await fetch(
        `${GITHUB_API_BASE}/user/repos?per_page=100&page=${page}&sort=updated`,
        {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
        },
      );
      if (!res.ok) throwUpstreamError(res.status, `GitHub API lỗi HTTP ${res.status}`);
      const repos = (await res.json()) as GithubRepo[];
      all.push(...repos);
      if (repos.length < 100) break;
      page += 1;
    }
    this.cache.set(cacheKey, all, 60 * 1000); // 60s
    return all;
  }

  /**
   * Tạo webhook trên 1 repo qua REST API (cần scope `repo`).
   * GitHub sẽ gửi event về POST /integrations/github/webhooks.
   */
  async createRepoWebhook(
    owner: string,
    repo: string,
    events: string[],
  ): Promise<{ id: number; url: string }> {
    const token = await this.requireToken();
    const cfg = this.config.get('github') as { webhookSecret: string };
    const appBaseUrl = this.config.get('appBaseUrl') as string;
    const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/hooks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'web',
        active: true,
        events,
        config: {
          url: `${appBaseUrl}/integrations/github/webhooks`,
          content_type: 'json',
          secret: cfg.webhookSecret,
          insecure_ssl: '0',
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throwUpstreamError(
        res.status,
        `Tạo webhook GitHub thất bại (HTTP ${res.status}): ${text.slice(0, 300)}`,
      );
    }
    const data = (await res.json()) as { id: number; url: string };
    return { id: data.id, url: data.url };
  }

  /** User đã liên kết GitHub chưa (để /workspaces/{id}/integrations/status dùng). */
  async isLinked(): Promise<boolean> {
    const saved = await this.tokens.get('github', this.demoUserId);
    return saved !== null;
  }
}
