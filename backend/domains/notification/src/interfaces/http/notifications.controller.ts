import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { NotificationService } from '../../application/notification.service';
import type { AuthUser } from '../../common/auth/access-token.verifier';
import { CurrentUser, JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { ListNotificationsQuery } from './dto/list-notifications.query';

@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationService) {}

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
}