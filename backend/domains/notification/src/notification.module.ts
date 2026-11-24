import { Module } from '@nestjs/common';
import { NotificationService } from './application/notification.service';
import { NotificationRepository } from './application/ports/notification.repository';
import { NoopRealtimePublisher, RealtimePublisher } from './application/ports/realtime.publisher';
import { PrismaNotificationRepository } from './infrastructure/prisma/prisma-notification.repository';
import {InternalEventsController} from './interfaces/http/internal-events.controller';
import { NotificationsController } from './interfaces/http/notifications.controller'; 

@Module({
  providers: [
    NotificationService,
    { provide: NotificationRepository, useClass: PrismaNotificationRepository },
    { provide: RealtimePublisher, useClass: NoopRealtimePublisher },
  ],
   controllers: [NotificationsController, InternalEventsController]
})
export class NotificationModule {}