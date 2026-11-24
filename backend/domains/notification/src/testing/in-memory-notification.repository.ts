import { randomUUID } from 'node:crypto';
import { NotificationRepository } from '../application/ports/notification.repository';
import type { NotificationCursor, NotificationEvent, NotificationItem } from '../domain/notification';

export class InMemoryNotificationRepository extends NotificationRepository {
  private readonly items = new Map<string, { event_id: string; item: NotificationItem }>();
  private readonly reads = new Map<string, Date | null>(); // key = `${notification_id}|${user_id}`

  async saveFromEvent(e: NotificationEvent) {
    if ([...this.items.values()].some((n) => n.event_id === e.event_id)) return null;
    const notification_id = randomUUID();
    const created_at = new Date();
    this.items.set(notification_id, {
      event_id: e.event_id,
      item: { notification_id, type: e.event_type, title: e.title, body: e.body, project_id: e.project_id ?? null, channel_id: e.channel_id ?? null, created_at: created_at.toISOString(), read_at: null },
    });
    e.recipient_user_ids.forEach((u) => this.reads.set(`${notification_id}|${u}`, null));
    return { notification_id, created_at };
  }

  async listForUser(userId: string, take: number, cursor: NotificationCursor | null) {
    return [...this.reads.entries()]
      .filter(([key]) => key.split('|')[1] === userId)
      .map(([key, readAt]) => ({ ...this.items.get(key.split('|')[0])!.item, read_at: readAt?.toISOString() ?? null }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.notification_id.localeCompare(a.notification_id))
      .filter((i) => !cursor || i.created_at < cursor.created_at || (i.created_at === cursor.created_at && i.notification_id < cursor.notification_id))
      .slice(0, take);
  }

  async markRead(userId: string, id: string, at: Date) {
    const key = `${id}|${userId}`;
    if (!this.reads.has(key)) return false;
    if (!this.reads.get(key)) this.reads.set(key, at);
    return true;
  }

  async markAllRead(userId: string, at: Date) {
    let n = 0;
    for (const [key, value] of this.reads) if (key.split('|')[1] === userId && !value) { this.reads.set(key, at); n++; }
    return n;
  }

  async countUnread(userId: string) {
    return [...this.reads].filter(([key, value]) => key.split('|')[1] === userId && !value).length;
  }
}