import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { NotificationService } from '../../application/notification.service';
import { InternalTokenGuard } from '../../common/auth/internal-token.guard';
import { NotificationEventDto } from './dto/notification-event.dto';

/** Service khác bắn event vào đây. Sau này đổi sang consumer của queue, gọi CÙNG handleEvent(). */
@Controller('internal/v1/events')
@UseGuards(InternalTokenGuard)
export class InternalEventsController {
  constructor(private readonly notifications: NotificationService) {}

  @Post()
  @HttpCode(202)
  publish(@Body() event: NotificationEventDto) {
    return this.notifications.handleEvent(event);
  }
}