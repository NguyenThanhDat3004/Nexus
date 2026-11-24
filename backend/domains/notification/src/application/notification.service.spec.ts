import { NotFoundException } from '@nestjs/common';
import type { NotificationEvent, NotificationItem } from '../domain/notification';
import { decodeCursor } from './cursor';
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
    repo = { saveFromEvent: jest.fn(), listForUser: jest.fn(), markRead: jest.fn(), markAllRead: jest.fn(), countUnread: jest.fn() } as never;
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

  it('phân trang: có trang sau thì trả next_cursor trỏ vào phần tử cuối', async () => {
    const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
    repo.listForUser.mockResolvedValue([item(id(3), '2026-11-22T03:00:00.000Z'), item(id(2), '2026-11-22T02:00:00.000Z'), item(id(1), '2026-11-22T01:00:00.000Z')]);
    const page = await service.list('u1', 2);
    expect(repo.listForUser).toHaveBeenCalledWith('u1', 3, null);
    expect(page.items).toHaveLength(2);
    expect(decodeCursor(page.next_cursor!)).toEqual({ created_at: '2026-11-22T02:00:00.000Z', notification_id: id(2) });
  });

  it('trang cuối → next_cursor = null', async () => {
    repo.listForUser.mockResolvedValue([]);
    expect((await service.list('u1', 20)).next_cursor).toBeNull();
  });

  it('cursor rác → 400', async () => {
    await expect(service.list('u1', 20, 'not-a-cursor')).rejects.toThrow('INVALID_CURSOR');
  });

  it('đánh dấu thông báo không thuộc mình → 404', async () => {
    repo.markRead.mockResolvedValue(false);
    await expect(service.markRead('u1', 'n-of-u2')).rejects.toBeInstanceOf(NotFoundException);
  });
});