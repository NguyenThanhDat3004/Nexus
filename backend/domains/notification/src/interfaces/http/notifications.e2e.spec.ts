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

    it('phân trang offset: page/limit/total/has_more; page sai hoặc còn gửi cursor → 400', async () => {
    const auth = { Authorization: `Bearer ${tokenOf('alice')}` };
    // alice đã có 1 thông báo (evt-1) từ test đầu → thêm 2 nữa = 3
    await sendEvent({ ...baseEvent, event_id: 'evt-page-2' });
    await sendEvent({ ...baseEvent, event_id: 'evt-page-3' });

    const p1 = await request(app.getHttpServer()).get('/api/v1/notifications?page=1&limit=2').set(auth);
    expect(p1.status).toBe(200);
    expect(p1.body.data).toMatchObject({ page: 1, limit: 2, total: 3, has_more: true });
    expect(p1.body.data.items).toHaveLength(2);

    const p2 = await request(app.getHttpServer()).get('/api/v1/notifications?page=2&limit=2').set(auth);
    expect(p2.body.data).toMatchObject({ page: 2, total: 3, has_more: false });
    expect(p2.body.data.items).toHaveLength(1);

    // 2 trang không được trùng nhau
    const ids = [...p1.body.data.items, ...p2.body.data.items].map((i: { notification_id: string }) => i.notification_id);
    expect(new Set(ids).size).toBe(3);

    expect((await request(app.getHttpServer()).get('/api/v1/notifications?page=0').set(auth)).status).toBe(400);
    expect((await request(app.getHttpServer()).get('/api/v1/notifications?page=101').set(auth)).status).toBe(400);
    expect((await request(app.getHttpServer()).get('/api/v1/notifications?cursor=abc').set(auth)).status).toBe(400);
  });

  it('deleteOlderThan: xoá thông báo cũ nhất và người nhận của nó', async () => {
    const repo = app.get(NotificationRepository); // bản InMemory nhờ overrideProvider ở beforeAll
    const auth = { Authorization: `Bearer ${tokenOf('alice')}` };
    const totalOf = async () => (await request(app.getHttpServer()).get('/api/v1/notifications').set(auth)).body.data.total;

    const before = await totalOf();
    // cutoff ở tương lai 1 giây → mọi thông báo đều "cũ"; limit 1 → chỉ xoá đúng 1 cái
    expect(await repo.deleteOlderThan(new Date(Date.now() + 1000), 1)).toBe(1);
    expect(await totalOf()).toBe(before - 1);
  });
});