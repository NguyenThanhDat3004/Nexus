import { Injectable } from '@nestjs/common';
import type { NotificationItem } from '../../domain/notification';

export abstract class RealtimePublisher {
  abstract publish(userIds: string[], channelId: string | null, item: NotificationItem): void;
}

@Injectable()
export class NoopRealtimePublisher extends RealtimePublisher {
  publish(): void {}
}