import { BadRequestException, Controller, Headers, Logger, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { getRawBody, verifyHmacSha256 } from '../common/crypto/verify-signature';
import { WebhooksService } from './webhooks.service';
import { DeliveryDedup } from './delivery-dedup';
import { WebhookQueue } from './webhook-queue';

/**
 * Receiver webhook GitHub + Jira.
 *
 * XÁC THỰC — ĐỌC KĨ, VÌ 2 HỆ THỐNG KHÁC NHAU:
 *
 * GitHub (đã triển khai đầy đủ):
 *  - Mỗi delivery được ký HMAC-SHA256 bằng GITHUB_WEBHOOK_SECRET, gửi trong
 *    header `X-Hub-Signature-256` dạng `sha256=<hex>`, tính trên body gốc.
 *  - Không có header / sai chữ ký / thiếu secret => 401, KHÔNG xử lý tiếp.
 *  - Header `X-GitHub-Event` cho biết loại event (pull_request, push...),
 *    `X-GitHub-Delivery` là id duy nhất để chống xử lý trùng.
 *
 * Jira (đã triển khai 1 phần — xem README mục "Webhook Jira"):
 *  - Webhook ADMIN (tạo ở Jira System → WebHooks, hoặc POST
 *    /rest/webhooks/1.0/webhook kèm "secret"): ký HMAC-SHA256, header
 *    `X-Hub-Signature` dạng `sha256=<hex>` — code dưới xác thực đúng kiểu này.
 *  - Webhook ĐỘNG (đăng ký qua POST /rest/api/3/webhook bằng OAuth app):
 *    KHÔNG có secret, KHÔNG gửi X-Hub-Signature. Delivery mang JWT trong
 *    header `Authorization`, ký bằng client secret của app. Việc verify JWT
 *    này là STUB (xem WebhooksService) — hiện endpoint chỉ chấp nhận delivery
 *    có X-Hub-Signature hợp lệ, hoặc (khi chưa cấu hình secret) từ chối.
 *  - Webhook admin tạo KHÔNG kèm secret: KHÔNG được ký — KHÔNG CÓ cách nào
 *    chứng minh delivery thật sự từ Jira. Cách chống: đặt secret token trong
 *    URL webhook (vd /integrations/jira/webhooks?token=...) hoặc allowlist IP
 *    của Atlassian. Bản này KHÔNG tự nhận delivery không ký là tin được.
 */
@Controller('integrations')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly webhooks: WebhooksService,
    private readonly dedup: DeliveryDedup,
    private readonly queue: WebhookQueue,
  ) {}

  @Post('github/webhooks')
  async githubWebhook(
    @Req() req: Request,
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Headers('x-github-event') event: string | undefined,
    @Headers('x-github-delivery') deliveryId: string | undefined,
  ) {
    const secret = (this.config.get('github') as { webhookSecret: string }).webhookSecret;
    const rawBody = getRawBody(req);
    if (!rawBody || !verifyHmacSha256(rawBody, signature, secret)) {
      throw new UnauthorizedException(
        'Chữ ký webhook GitHub không hợp lệ (thiếu X-Hub-Signature-256, sai secret, hoặc secret chưa cấu hình).',
      );
    }

    const dedupKey = deliveryId
      ? `github:${deliveryId}`
      : `github:${createHash('sha256').update(rawBody).digest('hex')}`;

    if (this.dedup.isDuplicate(dedupKey)) {
      this.logger.warn(`Bỏ qua webhook GitHub trùng: ${dedupKey}`);
      return { received: true, duplicate: true, projectedCard: null };
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString('utf8')) as any;
    } catch {
      throw new BadRequestException('Body webhook GitHub không phải JSON hợp lệ.');
    }
    const action = payload?.action as string | undefined;

    this.queue.enqueue(
      dedupKey,
      () => {
        const card = this.webhooks.handleGithubEvent(event ?? '', action, payload);
        this.logger.log(`Projected card (GitHub): ${JSON.stringify(card)}`);
      },
      () => this.dedup.remove(dedupKey),
    );

    return {
      received: true,
      queued: true,
      deliveryId: deliveryId ?? null,
    };
  }

  @Post('jira/webhooks')
  async jiraWebhook(
    @Req() req: Request,
    @Headers('x-hub-signature') signature: string | undefined,
    @Headers('authorization') authorization: string | undefined,
  ) {
    const secret = (this.config.get('jira') as { webhookSecret: string }).webhookSecret;
    const rawBody = getRawBody(req);
    if (!rawBody) {
      throw new UnauthorizedException('Không đọc được body webhook Jira.');
    }

    // Đường 1 — webhook admin có secret: xác thực HMAC như GitHub.
    if (signature) {
      if (!verifyHmacSha256(rawBody, signature, secret)) {
        throw new UnauthorizedException('Chữ ký webhook Jira (X-Hub-Signature) không hợp lệ.');
      }
    } else if (authorization?.startsWith('Bearer ')) {
      // Đường 2 — webhook động (OAuth app): delivery mang JWT ký bằng client secret.
      // STUB: hiện chỉ ghi nhận có JWT, CHƯA verify chữ ký JWT (cần verify theo
      // Atlassian Connect/JWT — xem README). Không dùng đường này ở production
      // cho tới khi verify xong.
      throw new UnauthorizedException(
        'Webhook động Jira gửi JWT (Authorization) — verify JWT chưa triển khai xong. ' +
          'Dùng webhook admin kèm secret (X-Hub-Signature) cho tới khi xong.',
      );
    } else {
      // Không có chữ ký nào: KHÔNG tin được delivery này từ Jira.
      throw new UnauthorizedException(
        'Webhook Jira không có chữ ký (thiếu X-Hub-Signature và Authorization). ' +
          'Webhook admin không kèm secret là KHÔNG được ký — hãy tạo webhook kèm secret.',
      );
    }

    const dedupKey = `jira:${createHash('sha256').update(rawBody).digest('hex')}`;
    if (this.dedup.isDuplicate(dedupKey)) {
      this.logger.warn(`Bỏ qua webhook Jira trùng: ${dedupKey}`);
      return { received: true, duplicate: true, projectedCard: null };
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString('utf8')) as any;
    } catch {
      throw new BadRequestException('Body webhook Jira không phải JSON hợp lệ.');
    }
    const webhookEvent = payload?.webhookEvent as string | undefined;

    this.queue.enqueue(
      dedupKey,
      () => {
        const card = this.webhooks.handleJiraEvent(webhookEvent, payload);
        this.logger.log(`Projected card (Jira): ${JSON.stringify(card)}`);
      },
      () => this.dedup.remove(dedupKey),
    );

    return {
      received: true,
      queued: true,
      webhookEvent: webhookEvent ?? null,
    };
  }
}
