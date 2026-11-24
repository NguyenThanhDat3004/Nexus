import { Injectable } from '@nestjs/common';
import { Observable, Subject, filter, map } from 'rxjs';
import type { Namespace } from 'socket.io';
import { RealtimePublisher } from '../../application/ports/realtime.publisher';
import type { NotificationItem } from '../../domain/notification';

/** Một nơi phát duy nhất → đẩy đồng thời cho client SSE và client Socket.IO */
@Injectable()
export class RealtimeHub extends RealtimePublisher {
  private readonly events$ = new Subject<{ userIds: string[]; item: NotificationItem }>();
  private namespace: Namespace | null = null;

  attach(namespace: Namespace) {
    this.namespace = namespace;
  }

  publish(userIds: string[], channelId: string | null, item: NotificationItem): void {
    this.events$.next({ userIds, item });
    userIds.forEach((id) => this.namespace?.to(`user:${id}`).emit('notification', item));
    if (channelId) this.namespace?.to(`channel:${channelId}`).emit('channel.event', item);
  }

  streamFor(userId: string): Observable<NotificationItem> {
    return this.events$.pipe(filter((e) => e.userIds.includes(userId)), map((e) => e.item));
  }
}