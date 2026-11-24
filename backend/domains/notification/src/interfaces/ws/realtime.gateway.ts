import { Logger } from '@nestjs/common';
import {
  ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayInit, SubscribeMessage, WebSocketGateway,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { MembershipPort } from '../../application/ports/membership.port';
import { AccessTokenVerifier } from '../../common/auth/access-token.verifier';
import { fail, ok } from '../../common/http/api-response';
import { RealtimeHub } from '../../infrastructure/realtime/realtime.hub';

type ChannelBody = { channel_id?: unknown };
const isValidChannelId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 64;

@WebSocketGateway({ namespace: '/realtime' })
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly verifier: AccessTokenVerifier,
    private readonly hub: RealtimeHub,
    private readonly membership: MembershipPort,
  ) {}

  afterInit(namespace: Namespace) {
    this.hub.attach(namespace);
  }

  /** Token gửi qua handshake.auth (KHÔNG qua query string để không lộ trong log/URL) */
  async handleConnection(client: Socket) {
    try {
      const user = await this.verifier.verify(client.handshake.auth?.token as string | undefined);
      client.data.userId = user.userId;
      await client.join(`user:${user.userId}`);
    } catch {
      client.emit('exception', fail(401, 'UNAUTHORIZED'));
      client.disconnect(true);
    }
  }

  @SubscribeMessage('channel.subscribe')
  async subscribe(@ConnectedSocket() client: Socket, @MessageBody() body: ChannelBody) {
    if (!isValidChannelId(body?.channel_id)) return fail(400, 'VALIDATION_FAILED');
    // Chống IDOR: không tin channel_id do client gửi, phải hỏi membership
    if (!(await this.membership.canAccessChannel(client.data.userId, body.channel_id))) return fail(403, 'FORBIDDEN');
    await client.join(`channel:${body.channel_id}`);
    return ok({ channel_id: body.channel_id });
  }

  @SubscribeMessage('channel.unsubscribe')
  async unsubscribe(@ConnectedSocket() client: Socket, @MessageBody() body: ChannelBody) {
    if (!isValidChannelId(body?.channel_id)) return fail(400, 'VALIDATION_FAILED');
    await client.leave(`channel:${body.channel_id}`);
    return ok({ channel_id: body.channel_id });
  }
}