import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import type { AppConfig } from '../config/configuration';
import { REDIS } from '../infrastructure/redis/redis.module';
import { MailLogRepository } from './ports/mail.ports';
import { NotificationRepository } from './ports/notification.repository';

const DAY_MS = 86_400_000;
const LOCK_KEY = 'retention:lock';
const LOCK_TTL_SECONDS = 15 * 60;

export interface PurgeResult { notifications: number; mail_logs: number }

/** Dọn dữ liệu cũ để DB không phình mãi. Xoá theo lô nhỏ để không khoá bảng lâu */
@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);
  private readonly cfg: AppConfig['retention'];

  constructor(
    private readonly notifications: NotificationRepository,
    private readonly mailLogs: MailLogRepository,
    @Inject(REDIS) private readonly redis: Redis,
    config: ConfigService<AppConfig, true>,
  ) {
    this.cfg = config.get('retention', { infer: true });
  }

  /** Trả null nếu instance khác đang chạy job này */
  async purge(now: Date = new Date()): Promise<PurgeResult | null> {
    // Nhiều instance cùng tới giờ cron → chỉ instance SET NX thành công mới chạy.
    // Không xoá khoá khi xong: để TTL tự hết, tránh xoá nhầm khoá của instance khác.
    const acquired = await this.redis.set(LOCK_KEY, '1', 'EX', LOCK_TTL_SECONDS, 'NX');
    if (acquired !== 'OK') return null;

    const result: PurgeResult = {
      notifications: await this.inBatches(
        (cutoff, limit) => this.notifications.deleteOlderThan(cutoff, limit),
        this.daysAgo(now, this.cfg.notificationDays),
      ),
      mail_logs: await this.inBatches(
        (cutoff, limit) => this.mailLogs.deleteOlderThan(cutoff, limit),
        this.daysAgo(now, this.cfg.mailLogDays),
      ),
    };
    this.logger.log(`Đã dọn ${result.notifications} thông báo, ${result.mail_logs} mail log`);
    return result;
  }

  /** Lặp đến khi một lô xoá được ít hơn batchSize → không còn gì cũ hơn cutoff */
  private async inBatches(deleteBatch: (cutoff: Date, limit: number) => Promise<number>, cutoff: Date): Promise<number> {
    let total = 0;
    for (;;) {
      const deleted = await deleteBatch(cutoff, this.cfg.batchSize);
      total += deleted;
      if (deleted < this.cfg.batchSize) return total;
    }
  }

  private daysAgo(now: Date, days: number): Date {
    return new Date(now.getTime() - days * DAY_MS);
  }
}
