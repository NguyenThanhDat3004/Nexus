import { Injectable } from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';
import { NotificationRepository } from '../../application/ports/notification.repository';
import type { NotificationEvent, NotificationItem } from '../../domain/notification';
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

  async listForUser(userId: string, skip: number, take: number) {
    const rows = await this.prisma.notificationRecipient.findMany({
      where: { user_id: userId },
      include: { notification: true },
      // notification_id là tiêu chí phụ: 2 thông báo cùng created_at luôn có thứ tự cố định,
      // nếu không chúng có thể đổi chỗ giữa 2 lần query → 1 dòng hiện ở cả trang 1 và trang 2
      orderBy: [{ notification: { created_at: 'desc' } }, { notification_id: 'desc' }],
      skip,
      take,
    });
    return rows.map((r) => toItem(r.notification, r.read_at));
  }

  countForUser(userId: string) {
    return this.prisma.notificationRecipient.count({ where: { user_id: userId } });
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

  deleteOlderThan(cutoff: Date, limit: number) {
    // Prisma deleteMany không hỗ trợ LIMIT → dùng SQL thô để xoá từng lô nhỏ.
    // Tagged template gửi ${x} thành tham số $1, $2 (KHÔNG ghép chuỗi) → không bị SQL injection.
    // notification_recipients có FK ON DELETE CASCADE → Postgres tự xoá người nhận theo.
    return this.prisma.$executeRaw`
      DELETE FROM notifications WHERE notification_id IN (
        SELECT notification_id FROM notifications
        WHERE created_at < ${cutoff}
        ORDER BY created_at
        LIMIT ${limit}
      )`;
  }
}