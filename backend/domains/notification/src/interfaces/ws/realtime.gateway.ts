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
    // Xác thực ở middleware: chạy TRƯỚC khi kết nối được chấp nhận.
    // Nest không chờ handleConnection (async) xong mới gắn message handler, nên nếu xác thực ở đó
    // client sai token vẫn kịp gửi channel.subscribe khi userId còn undefined.
    // Token gửi qua handshake.auth (KHÔNG qua query string để không lộ trong log/URL).
    namespace.use((socket, next) => {
      this.verifier
        .verify(socket.handshake.auth?.token as string | undefined)
        .then((user) => {
          socket.data.userId = user.userId;
          next();
        })
        .catch(() => next(new Error('UNAUTHORIZED'))); // client nhận connect_error, không bao giờ "connect"
    });
  }

  /** Tới được đây nghĩa là middleware đã xác thực xong */
  async handleConnection(client: Socket) {
    await client.join(`user:${client.data.userId}`);
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