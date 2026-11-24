import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { Socket, io } from 'socket.io-client';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { NotificationRepository } from '../../application/ports/notification.repository';
import { InMemoryNotificationRepository } from '../../testing/in-memory-notification.repository';

const INTERNAL = process.env.INTERNAL_SERVICE_TOKEN!;

describe('Realtime: WebSocket + SSE (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let tokenOf: (userId: string) => string;
  const sockets: Socket[] = [];
  let seq = 0;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(NotificationRepository).useClass(InMemoryNotificationRepository)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.listen(0); // cổng ngẫu nhiên: client thật cần kết nối qua mạng
    baseUrl = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`;
    const jwt = moduleRef.get(JwtService);
    tokenOf = (userId) => jwt.sign({ sub: userId });
  });
  afterEach(() => sockets.splice(0).forEach((s) => s.disconnect()));
  afterAll(() => app.close());

  const connect = (token?: string) => {
    const socket = io(`${baseUrl}/realtime`, { auth: token ? { token } : {}, transports: ['websocket'], forceNew: true });
    sockets.push(socket);
    return socket;
  };
  const connected = (socket: Socket) => new Promise<void>((resolve, reject) => {
    socket.once('connect', () => resolve());
    socket.once('connect_error', reject);
  });
  const sendEvent = (extra: object = {}) =>
    request(app.getHttpServer()).post('/internal/v1/events').set('X-Internal-Token', INTERNAL).send({
      event_id: `evt-rt-${++seq}`, event_type: 'channel.created', occurred_at: '2026-11-24T10:00:00Z',
      recipient_user_ids: ['alice'], title: 'Channel mới', body: 'general', ...extra,
    });

  it.each([
    ['không có token', undefined],
    ['token sai', 'not-a-jwt'],
  ])('WS %s → bị từ chối ngay ở handshake (connect_error), không bao giờ connect', async (_, token) => {
    const socket = connect(token);
    const onConnect = jest.fn();
    socket.on('connect', onConnect);
    const error = await new Promise<Error>((resolve) => socket.once('connect_error', resolve));
    expect(error.message).toBe('UNAUTHORIZED');
    expect(onConnect).not.toHaveBeenCalled();
  });

  it('WS: chỉ người nhận được đẩy thông báo', async () => {
    const alice = connect(tokenOf('alice'));
    const bob = connect(tokenOf('bob'));
    await Promise.all([connected(alice), connected(bob)]);
    const bobGot = jest.fn();
    bob.on('notification', bobGot);

    const received = new Promise<{ title: string }>((resolve) => alice.once('notification', resolve));
    expect((await sendEvent()).status).toBe(202);
    expect((await received).title).toBe('Channel mới');
    await new Promise((r) => setTimeout(r, 100));
    expect(bobGot).not.toHaveBeenCalled();
  });

  it('WS: subscribe channel sai dữ liệu → 400; đúng → nhận channel.event', async () => {
    const alice = connect(tokenOf('alice'));
    await connected(alice);
    expect((await alice.emitWithAck('channel.subscribe', { channel_id: '' })).code).toBe(400);
    expect((await alice.emitWithAck('channel.subscribe', { channel_id: 'c-9' })).success).toBe(true);

    const received = new Promise<{ channel_id: string }>((resolve) => alice.once('channel.event', resolve));
    await sendEvent({ channel_id: 'c-9' });
    expect((await received).channel_id).toBe('c-9');
  });

  it('SSE không có token → 401', async () => {
    expect((await request(app.getHttpServer()).get('/api/v1/notifications/stream')).status).toBe(401);
  });

  it('SSE: nhận thông báo dạng text/event-stream', async () => {
    const chunks: string[] = [];
    const req = http.get(`${baseUrl}/api/v1/notifications/stream`, { headers: { Authorization: `Bearer ${tokenOf('alice')}` } });
    try {
      const res = await new Promise<http.IncomingMessage>((resolve) => req.once('response', resolve));
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/event-stream');
      const got = new Promise<void>((resolve) => res.on('data', (c: Buffer) => {
        chunks.push(c.toString());
        if (chunks.join('').includes('event: notification')) resolve();
      }));
      await sendEvent({ title: 'Qua SSE' });
      await got;
      expect(chunks.join('')).toContain('"title":"Qua SSE"');
    } finally {
      req.destroy(); // đóng stream → Nest hủy subscription (cả heartbeat)
    }
  });
});
