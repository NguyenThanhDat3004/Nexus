import type { NotificationCursor, NotificationEvent, NotificationItem } from '../../domain/notification';

export abstract class NotificationRepository {
  /** null nếu event_id đã tồn tại (idempotent) */
  abstract saveFromEvent(event: NotificationEvent): Promise<{ notification_id: string; created_at: Date } | null>;
  abstract listForUser(userId: string, take: number, cursor: NotificationCursor | null): Promise<NotificationItem[]>;
  /** false nếu thông báo không tồn tại HOẶC không thuộc user này */
  abstract markRead(userId: string, notificationId: string, at: Date): Promise<boolean>;
  abstract markAllRead(userId: string, at: Date): Promise<number>;
  abstract countUnread(userId: string): Promise<number>;
}