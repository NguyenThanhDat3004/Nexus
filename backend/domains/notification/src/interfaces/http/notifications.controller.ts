import { Controller, Get, HttpCode, MessageEvent, Param, ParseUUIDPipe, Patch, Post, Query, Sse, UseGuards } from '@nestjs/common';
import { Observable, interval, map, merge } from 'rxjs';
import { NotificationService } from '../../application/notification.service';
import type { AuthUser } from '../../common/auth/access-token.verifier';
import { CurrentUser, JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RealtimeHub } from '../../infrastructure/realtime/realtime.hub';
import { ListNotificationsQuery } from './dto/list-notifications.query';

@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationService,
    private readonly hub: RealtimeHub,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListNotificationsQuery) {
    return this.notifications.list(user.userId, query.limit, query.cursor);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthUser) {
    return { unread: await this.notifications.countUnread(user.userId) };
  }

  @Patch(':id/read')
  async markRead(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    await this.notifications.markRead(user.userId, id);
    return { notification_id: id, read: true };
  }

  @Post('read-all')
  @HttpCode(200)
  async markAllRead(@CurrentUser() user: AuthUser) {
    return { updated: await this.notifications.markAllRead(user.userId) };
  }

  /** FE dùng @microsoft/fetch-event-source để gửi header Authorization (EventSource gốc không gửi được) */
  @Sse('stream')
  stream(@CurrentUser() user: AuthUser): Observable<MessageEvent> {
    const events$ = this.hub.streamFor(user.userId).pipe(
      map((item): MessageEvent => ({ type: 'notification', id: item.notification_id, data: item })),
    );
    // heartbeat 25s để proxy/load balancer không cắt kết nối đang rảnh
    const heartbeat$ = interval(25_000).pipe(map((): MessageEvent => ({ type: 'ping', data: {} })));
    return merge(events$, heartbeat$);
  }
}
