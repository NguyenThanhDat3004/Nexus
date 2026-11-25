import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
} from '@nestjs/common';
import { JiraService } from './jira.service';
import { randomBytes } from 'node:crypto';

/**
 * Endpoints Jira — toàn bộ theo chuẩn REST của team.
 *
 * ⚠️ STUB: `state` chống CSRF hiện chỉ sinh ngẫu nhiên rồi trả về cho client
 * tự giữ; bản đầy đủ phải lưu state theo session ở Identity service và đối
 * chiếu ở callback. Chưa làm bước đối chiếu này.
 */
@Controller('integrations/jira')
export class JiraController {
  constructor(private readonly jira: JiraService) {}

  /** B1 OAuth 3LO: trả URL authorize — frontend redirect user sang Atlassian. */
  @Get('authorize')
  authorize() {
    const state = randomBytes(16).toString('hex');
    return {
      authorizeUrl: this.jira.buildAuthorizeUrl(state),
      state,
      note: 'Redirect user sang authorizeUrl. Sau khi user đồng ý, Atlassian gọi về /callback với ?code=...&state=...',
    };
  }

  /** B2 OAuth 3LO: Atlassian redirect về đây — đổi code lấy token + cloudId. */
  @Get('callback')
  async callback(@Query('code') code?: string, @Query('state') state?: string) {
    if (!code) throw new BadRequestException('Thiếu ?code= trong callback Jira.');
    // TODO: đối chiếu `state` với state đã lưu ở bước authorize (cần session).
    const { cloudId, siteUrl } = await this.jira.exchangeCodeForToken(code);
    const user = await this.jira.getCurrentUser();
    return {
      linked: true,
      provider: 'jira',
      accountId: user.accountId,
      displayName: user.displayName,
      emailAddress: user.emailAddress ?? null,
      cloudId,
      siteUrl,
      state,
    };
  }

  /** Thông tin user Jira đã liên kết. */
  @Get('user')
  async getUser() {
    return this.jira.getCurrentUser();
  }

  /** Danh sách project trên site Jira đã liên kết. */
  @Get('projects')
  async listProjects() {
    const projects = await this.jira.listProjects();
    return { total: projects.length, projects };
  }

  /**
   * Tìm issue bằng JQL. Mặc định: issue được giao cho user đã liên kết.
   * VD: ?jql=project=NEX%20AND%20status%20!=%20Done
   */
  @Get('issues')
  async searchIssues(@Query('jql') jql?: string) {
    const query = jql?.trim() ? jql : 'assignee = currentUser() ORDER BY updated DESC';
    const issues = await this.jira.searchIssues(query);
    return { total: issues.length, jql: query, issues };
  }

  /** Đăng ký webhook động (nhận event jira:issue_updated, sprint...). */
  @Post('webhooks/register')
  async registerWebhook(@Body() dto: { events?: string[] }) {
    const events = dto?.events?.length
      ? dto.events
      : ['jira:issue_updated', 'jira:sprint_updated', 'jira:sprint_started', 'jira:sprint_closed'];
    const hook = await this.jira.registerDynamicWebhook(events);
    return {
      registered: true,
      webhookId: hook.id,
      events,
      note: 'Webhook động Jira chỉ sống 30 ngày nếu không refresh — xem README.',
    };
  }

  /**
   * ⚠️ CẦN TEAM XÁC NHẬN — ghi trạng thái issue sang Jira.
   * Mặc định TẮT (JIRA_WRITEBACK_ENABLED=false). Khi tắt, endpoint trả 403
   * kèm lý do thay vì chạm vào Jira.
   */
  @Post('issues/:issueKey/status')
  async updateIssueStatus(
    @Param('issueKey') issueKey: string,
    @Body() dto: { status?: string },
  ) {
    if (!dto?.status) {
      throw new BadRequestException('Thiếu {"status": "..."} trong body. VD: {"status": "Done"}');
    }
    const result = await this.jira.transitionIssueToStatus(issueKey, dto.status);
    return { issueKey, targetStatus: dto.status, ...result };
  }
}
