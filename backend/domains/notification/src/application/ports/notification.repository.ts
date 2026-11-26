import type { NotificationEvent, NotificationItem } from '../../domain/notification';

export abstract class NotificationRepository {
  /** null nếu event_id đã tồn tại (idempotent) */
  abstract saveFromEvent(event: NotificationEvent): Promise<{ notification_id: string; created_at: Date } | null>;
  /** Thông báo của user, mới nhất trước. skip = bỏ qua bao nhiêu dòng, take = lấy bao nhiêu dòng */
  abstract listForUser(userId: string, skip: number, take: number): Promise<NotificationItem[]>;
  /** Tổng số thông báo user nhận được (cả đã đọc lẫn chưa đọc) */
  abstract countForUser(userId: string): Promise<number>;
  /** false nếu thông báo không tồn tại HOẶC không thuộc user này */
  abstract markRead(userId: string, notificationId: string, at: Date): Promise<boolean>;
  abstract markAllRead(userId: string, at: Date): Promise<number>;
  abstract countUnread(userId: string): Promise<number>;
}