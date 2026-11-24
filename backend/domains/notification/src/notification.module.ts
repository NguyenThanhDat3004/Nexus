import { Module } from '@nestjs/common';
import { NotificationService } from './application/notification.service';
import { NotificationRepository } from './application/ports/notification.repository';
import { NoopRealtimePublisher, RealtimePublisher } from './application/ports/realtime.publisher';
import { PrismaNotificationRepository } from './infrastructure/prisma/prisma-notification.repository';

@Module({
  providers: [
    NotificationService,
    { provide: NotificationRepository, useClass: PrismaNotificationRepository },
    { provide: RealtimePublisher, useClass: NoopRealtimePublisher },
  ],
})
export class NotificationModule {}