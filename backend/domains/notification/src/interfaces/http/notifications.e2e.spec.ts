import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { NotificationRepository } from '../../application/ports/notification.repository';
import { InMemoryNotificationRepository } from '../../testing/in-memory-notification.repository';

const INTERNAL = process.env.INTERNAL_SERVICE_TOKEN!;

describe('Notifications REST (e2e)', () => {
  let app: INestApplication;
  let tokenOf: (userId: string) => string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(NotificationRepository).useClass(InMemoryNotificationRepository)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
    const jwt = moduleRef.get(JwtService);
    tokenOf = (userId) => jwt.sign({ sub: userId });
  });
  afterAll(() => app.close());

  const sendEvent = (body: object) => request(app.getHttpServer()).post('/internal/v1/events').set('X-Internal-Token', INTERNAL).send(body);
  const baseEvent = {
    event_id: 'evt-1', event_type: 'project.member_added', occurred_at: '2026-11-22T10:00:00Z',
    project_id: 'p1', recipient_user_ids: ['alice'], title: 'Bạn được thêm vào dự án', body: 'Aurora Pay',
  };

  it('nhận event → 202; gửi lại cùng event_id → created=false', async () => {
    expect((await sendEvent(baseEvent)).body.data.created).toBe(true);
    const again = await sendEvent(baseEvent);
    expect(again.status).toBe(202);
    expect(again.body.data.created).toBe(false);
  });

  it('thiếu token nội bộ → 401; body sai → 400', async () => {
    expect((await request(app.getHttpServer()).post('/internal/v1/events').send(baseEvent)).status).toBe(401);
    expect((await sendEvent({ ...baseEvent, event_type: 'hack', recipient_user_ids: [] })).status).toBe(400);
  });

  it('chỉ người nhận mới thấy thông báo', async () => {
    const alice = await request(app.getHttpServer()).get('/api/v1/notifications').set('Authorization', `Bearer ${tokenOf('alice')}`);
    expect(alice.body.data.items).toHaveLength(1);
    const bob = await request(app.getHttpServer()).get('/api/v1/notifications').set('Authorization', `Bearer ${tokenOf('bob')}`);
    expect(bob.body.data.items).toHaveLength(0);
  });

  it('IDOR: bob đánh dấu thông báo của alice → 404; alice → 200', async () => {
    const list = await request(app.getHttpServer()).get('/api/v1/notifications').set('Authorization', `Bearer ${tokenOf('alice')}`);
    const id = list.body.data.items[0].notification_id;
    const asBob = await request(app.getHttpServer()).patch(`/api/v1/notifications/${id}/read`).set('Authorization', `Bearer ${tokenOf('bob')}`);
    expect(asBob.status).toBe(404);
    const asAlice = await request(app.getHttpServer()).patch(`/api/v1/notifications/${id}/read`).set('Authorization', `Bearer ${tokenOf('alice')}`);
    expect(asAlice.status).toBe(200);
    const count = await request(app.getHttpServer()).get('/api/v1/notifications/unread-count').set('Authorization', `Bearer ${tokenOf('alice')}`);
    expect(count.body.data.unread).toBe(0);
  });

  it('id không phải UUID → 400; limit > 50 → 400', async () => {
    const auth = { Authorization: `Bearer ${tokenOf('alice')}` };
    expect((await request(app.getHttpServer()).patch('/api/v1/notifications/1/read').set(auth)).status).toBe(400);
    expect((await request(app.getHttpServer()).get('/api/v1/notifications?limit=500').set(auth)).status).toBe(400);
  });
});