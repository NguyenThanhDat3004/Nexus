import { Injectable } from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';
import { NotificationRepository } from '../../application/ports/notification.repository';
import type { NotificationCursor, NotificationEvent, NotificationItem } from '../../domain/notification';
import { PrismaService } from './prisma.service';

const toItem = (n: Notification, readAt: Date | null): NotificationItem => ({
  notification_id: n.notification_id,
  type: n.type,
  title: n.title,
  body: n.body,
  project_id: n.project_id,
  channel_id: n.channel_id,
  created_at: n.created_at.toISOString(),
  read_at: readAt?.toISOString() ?? null,
});

@Injectable()
export class PrismaNotificationRepository extends NotificationRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async saveFromEvent(event: NotificationEvent) {
    try {
      return await this.prisma.notification.create({
        data: {
          event_id: event.event_id,
          type: event.event_type,
          title: event.title,
          body: event.body,
          project_id: event.project_id ?? null,
          channel_id: event.channel_id ?? null,
          actor_user_id: event.actor_user_id ?? null,
          payload: event.data as Prisma.InputJsonValue | undefined,
          occurred_at: new Date(event.occurred_at),
          recipients: { createMany: { data: event.recipient_user_ids.map((user_id) => ({ user_id })) } },
        },
        select: { notification_id: true, created_at: true },
      });
    } catch (error) {
      // P2002 = vi phạm UNIQUE(event_id) → event đã xử lý rồi
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return null;
      throw error;
    }
  }

  async listForUser(userId: string, take: number, cursor: NotificationCursor | null) {
    const after = cursor && {
      notification: {
        OR: [
          { created_at: { lt: new Date(cursor.created_at) } },
          { created_at: new Date(cursor.created_at), notification_id: { lt: cursor.notification_id } },
        ],
      },
    };
    const rows = await this.prisma.notificationRecipient.findMany({
      where: { user_id: userId, ...after },
      include: { notification: true },
      orderBy: [{ notification: { created_at: 'desc' } }, { notification_id: 'desc' }],
      take,
    });
    return rows.map((r) => toItem(r.notification, r.read_at));
  }

  async markRead(userId: string, notificationId: string, at: Date) {
    // Điều kiện user_id nằm NGAY trong câu WHERE → không thể đánh dấu thông báo của người khác
    const updated = await this.prisma.notificationRecipient.updateMany({
      where: { notification_id: notificationId, user_id: userId, read_at: null },
      data: { read_at: at },
    });
    if (updated.count > 0) return true;
    return (await this.prisma.notificationRecipient.count({ where: { notification_id: notificationId, user_id: userId } })) > 0;
  }

  async markAllRead(userId: string, at: Date) {
    return (await this.prisma.notificationRecipient.updateMany({ where: { user_id: userId, read_at: null }, data: { read_at: at } })).count;
  }

  countUnread(userId: string) {
    return this.prisma.notificationRecipient.count({ where: { user_id: userId, read_at: null } });
  }
}