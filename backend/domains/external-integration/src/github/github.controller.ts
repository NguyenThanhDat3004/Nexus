import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Body,
} from '@nestjs/common';
import { GithubService } from './github.service';
import { randomBytes } from 'node:crypto';

interface CreateWebhookDto {
  owner: string;
  repo: string;
  /** Mặc định: pull_request + push (đúng phạm vi Nexus cần). */
  events?: string[];
}

/**
 * Endpoints GitHub — toàn bộ theo chuẩn REST của team.
 *
 * ⚠️ STUB: `state` chống CSRF hiện chỉ sinh ngẫu nhiên rồi trả về cho client
 * tự giữ; bản đầy đủ phải lưu state theo session ở Identity service và đối
 * chiếu ở callback. Chưa làm bước đối chiếu này.
 */
@Controller('integrations/github')
export class GithubController {
  constructor(private readonly github: GithubService) {}

  /** B1 OAuth: trả URL authorize — frontend redirect user sang GitHub. */
  @Get('authorize')
  authorize() {
    const state = randomBytes(16).toString('hex');
    return {
      authorizeUrl: this.github.buildAuthorizeUrl(state),
      state,
      note: 'Redirect user sang authorizeUrl. Sau khi user đồng ý, GitHub gọi về /callback với ?code=...&state=...',
    };
  }

  /** B2 OAuth: GitHub redirect về đây với code — đổi code lấy access token. */
  @Get('callback')
  async callback(@Query('code') code?: string, @Query('state') state?: string) {
    if (!code) throw new BadRequestException('Thiếu ?code= trong callback GitHub.');
    // TODO: đối chiếu `state` với state đã lưu ở bước authorize (cần session).
    const { scope } = await this.github.exchangeCodeForToken(code);
    const user = await this.github.getCurrentUser();
    return {
      linked: true,
      provider: 'github',
      login: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
      profileUrl: user.html_url,
      scope,
      state,
    };
  }

  /** Thông tin user GitHub đã liên kết. */
  @Get('user')
  async getUser() {
    return this.github.getCurrentUser();
  }

  /** TẤT CẢ repo của user (kể cả private) — phân trang tự động. */
  @Get('repos')
  async listRepos() {
    const repos = await this.github.listAllRepos();
    return { total: repos.length, repos };
  }

  /** Tạo webhook trên 1 repo (đăng ký nhận event pull_request + push). */
  @Post('webhooks/register')
  async registerWebhook(@Body() dto: CreateWebhookDto) {
    if (!dto?.owner || !dto?.repo) {
      throw new BadRequestException('Thiếu owner hoặc repo. VD: {"owner":"NguyenThanhDat3004","repo":"Nexus"}');
    }
    const events = dto.events?.length ? dto.events : ['pull_request', 'push'];
    const hook = await this.github.createRepoWebhook(dto.owner, dto.repo, events);
    return { registered: true, hookId: hook.id, hookUrl: hook.url, events };
  }
}
