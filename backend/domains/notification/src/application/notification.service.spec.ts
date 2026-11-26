import { NotFoundException } from '@nestjs/common';
import type { NotificationEvent, NotificationItem } from '../domain/notification';

import { NotificationService } from './notification.service';
import { NotificationRepository } from './ports/notification.repository';
import { RealtimePublisher } from './ports/realtime.publisher';

const event: NotificationEvent = {
  event_id: 'evt-1', event_type: 'project.member_added', occurred_at: '2026-11-22T10:00:00Z',
  project_id: 'p1', channel_id: null, recipient_user_ids: ['u2', 'u3', 'u2'], title: 'T', body: 'B',
};
const item = (id: string, created_at: string): NotificationItem => ({
  notification_id: id, type: 'x', title: 't', body: 'b', project_id: null, channel_id: null, created_at, read_at: null,
});

describe('NotificationService', () => {
  let repo: jest.Mocked<NotificationRepository>;
  let realtime: jest.Mocked<RealtimePublisher>;
  let service: NotificationService;

  beforeEach(() => {
        repo = { saveFromEvent: jest.fn(), listForUser: jest.fn(), countForUser: jest.fn(), markRead: jest.fn(), markAllRead: jest.fn(), countUnread: jest.fn() } as never;
    realtime = { publish: jest.fn() } as never;
    service = new NotificationService(repo, realtime);
  });

  it('lưu event, khử trùng người nhận và đẩy realtime', async () => {
    repo.saveFromEvent.mockResolvedValue({ notification_id: 'n1', created_at: new Date('2026-11-22T10:00:01Z') });
    await expect(service.handleEvent(event)).resolves.toEqual({ created: true, notification_id: 'n1' });
    expect(repo.saveFromEvent).toHaveBeenCalledWith(expect.objectContaining({ recipient_user_ids: ['u2', 'u3'] }));
    expect(realtime.publish).toHaveBeenCalledWith(['u2', 'u3'], null, expect.objectContaining({ notification_id: 'n1', read_at: null }));
  });

  it('event trùng → không đẩy realtime lần nữa', async () => {
    repo.saveFromEvent.mockResolvedValue(null);
    await expect(service.handleEvent(event)).resolves.toEqual({ created: false, notification_id: null });
    expect(realtime.publish).not.toHaveBeenCalled();
  });

   it('page 1 → skip 0, take limit', async () => {
    repo.listForUser.mockResolvedValue([]);
    repo.countForUser.mockResolvedValue(0);
    await service.list('u1', 1, 20);
    expect(repo.listForUser).toHaveBeenCalledWith('u1', 0, 20);
  });

  it('page 2 → bỏ qua limit phần tử đầu, còn trang sau thì has_more = true', async () => {
    repo.listForUser.mockResolvedValue([item('n3', '2026-11-22T03:00:00.000Z'), item('n4', '2026-11-22T02:00:00.000Z')]);
    repo.countForUser.mockResolvedValue(5);
    const page = await service.list('u1', 2, 2);
    expect(repo.listForUser).toHaveBeenCalledWith('u1', 2, 2);
    expect(page).toMatchObject({ page: 2, limit: 2, total: 5, has_more: true });
    expect(page.items).toHaveLength(2);
  });

  it('trang cuối vừa khít → has_more = false', async () => {
    repo.listForUser.mockResolvedValue([item('n3', '2026-11-22T03:00:00.000Z'), item('n4', '2026-11-22T02:00:00.000Z')]);
    repo.countForUser.mockResolvedValue(4);
    expect((await service.list('u1', 2, 2)).has_more).toBe(false);
  });

  it('page vượt quá số trang → items rỗng, has_more = false', async () => {
    repo.listForUser.mockResolvedValue([]);
    repo.countForUser.mockResolvedValue(3);
    expect(await service.list('u1', 5, 20)).toMatchObject({ items: [], total: 3, has_more: false });
  });

  it('đánh dấu thông báo không thuộc mình → 404', async () => {
    repo.markRead.mockResolvedValue(false);
    await expect(service.markRead('u1', 'n-of-u2')).rejects.toBeInstanceOf(NotFoundException);
  });
});