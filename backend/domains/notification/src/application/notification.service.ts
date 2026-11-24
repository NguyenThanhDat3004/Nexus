import { Injectable, NotFoundException } from '@nestjs/common';
import type { NotificationEvent, NotificationItem, NotificationPage } from '../domain/notification';
import { decodeCursor, encodeCursor } from './cursor';
import { NotificationRepository } from './ports/notification.repository';
import { RealtimePublisher } from './ports/realtime.publisher';

@Injectable()
export class NotificationService {
  constructor(
    private readonly repo: NotificationRepository,
    private readonly realtime: RealtimePublisher,
  ) {}

  async handleEvent(event: NotificationEvent): Promise<{ created: boolean; notification_id: string | null }> {
    const recipients = [...new Set(event.recipient_user_ids)];
    const saved = await this.repo.saveFromEvent({ ...event, recipient_user_ids: recipients });
    if (!saved) return { created: false, notification_id: null }; // event trùng → bỏ qua, không đẩy lại

    const item: NotificationItem = {
      notification_id: saved.notification_id,
      type: event.event_type,
      title: event.title,
      body: event.body,
      project_id: event.project_id ?? null,
      channel_id: event.channel_id ?? null,
      created_at: saved.created_at.toISOString(),
      read_at: null,
    };
    this.realtime.publish(recipients, item.channel_id, item);
    return { created: true, notification_id: saved.notification_id };
  }

  async list(userId: string, limit: number, rawCursor?: string): Promise<NotificationPage> {
    const cursor = decodeCursor(rawCursor);
    const rows = await this.repo.listForUser(userId, limit + 1, cursor); // lấy dư 1 để biết còn trang sau
    const items = rows.slice(0, limit);
    const last = items.at(-1);
    return {
      items,
      next_cursor: rows.length > limit && last ? encodeCursor({ created_at: last.created_at, notification_id: last.notification_id }) : null,
    };
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    // Không phân biệt "không tồn tại" và "của người khác" → cùng 404 (chống IDOR/dò id)
    if (!(await this.repo.markRead(userId, notificationId, new Date()))) throw new NotFoundException('NOTIFICATION_NOT_FOUND');
  }

  markAllRead(userId: string) {
    return this.repo.markAllRead(userId, new Date());
  }

  countUnread(userId: string) {
    return this.repo.countUnread(userId);
  }
}