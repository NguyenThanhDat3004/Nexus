import { Module } from '@nestjs/common';
import { NotificationService } from './application/notification.service';
import { MembershipPort } from './application/ports/membership.port';
import { NotificationRepository } from './application/ports/notification.repository';
import { RealtimePublisher } from './application/ports/realtime.publisher';
import { StubMembershipAdapter } from './infrastructure/membership/stub-membership.adapter';
import { PrismaNotificationRepository } from './infrastructure/prisma/prisma-notification.repository';
import { RealtimeHub } from './infrastructure/realtime/realtime.hub';
import { InternalEventsController } from './interfaces/http/internal-events.controller';
import { NotificationsController } from './interfaces/http/notifications.controller';
import { RealtimeGateway } from './interfaces/ws/realtime.gateway';

@Module({
  controllers: [NotificationsController, InternalEventsController],
  providers: [
    NotificationService,
    RealtimeHub,
    RealtimeGateway,
    // useExisting: service, SSE và gateway dùng CHUNG một instance hub (useClass sẽ tạo instance thứ hai → mất event)
    { provide: RealtimePublisher, useExisting: RealtimeHub },
    { provide: NotificationRepository, useClass: PrismaNotificationRepository },
    { provide: MembershipPort, useClass: StubMembershipAdapter },
  ],
})
export class NotificationModule {}
