import { ConfigService } from '@nestjs/config';
import RedisMock from 'ioredis-mock';
import { RetentionService } from './retention.service';

const cfg = { notificationDays: 90, mailLogDays: 180, batchSize: 2 };

describe('RetentionService', () => {
  const redis = new RedisMock();
  const notifications = { deleteOlderThan: jest.fn() };
  const mailLogs = { deleteOlderThan: jest.fn() };
  const config = { get: () => cfg } as unknown as ConfigService;
  const service = new RetentionService(notifications as never, mailLogs as never, redis as never, config as never);
  const now = new Date('2026-11-26T03:00:00Z');

  beforeEach(async () => {
    await redis.flushall(); // mỗi test bắt đầu không có khoá
    jest.resetAllMocks(); // xoá cả các mockResolvedValueOnce còn thừa từ test trước
  });

  it('xoá theo lô đến khi lô cuối nhỏ hơn batchSize', async () => {
    notifications.deleteOlderThan.mockResolvedValueOnce(2).mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    mailLogs.deleteOlderThan.mockResolvedValueOnce(0);
    await expect(service.purge(now)).resolves.toEqual({ notifications: 5, mail_logs: 0 });
    expect(notifications.deleteOlderThan).toHaveBeenCalledTimes(3);
    expect(mailLogs.deleteOlderThan).toHaveBeenCalledTimes(1);
  });

  it('lô xoá đúng bằng batchSize → phải chạy thêm 1 lô mới biết đã hết', async () => {
    notifications.deleteOlderThan.mockResolvedValueOnce(2).mockResolvedValueOnce(0);
    mailLogs.deleteOlderThan.mockResolvedValue(0);
    await expect(service.purge(now)).resolves.toEqual({ notifications: 2, mail_logs: 0 });
    expect(notifications.deleteOlderThan).toHaveBeenCalledTimes(2);
  });

  it('mốc xoá = now - số ngày giữ lại', async () => {
    notifications.deleteOlderThan.mockResolvedValue(0);
    mailLogs.deleteOlderThan.mockResolvedValue(0);
    await service.purge(now);
    expect(notifications.deleteOlderThan).toHaveBeenCalledWith(new Date('2026-08-28T03:00:00Z'), 2); // 90 ngày
    expect(mailLogs.deleteOlderThan).toHaveBeenCalledWith(new Date('2026-05-30T03:00:00Z'), 2); // 180 ngày
  });

  it('instance khác đang giữ khoá → bỏ qua, không xoá gì', async () => {
    await redis.set('retention:lock', '1');
    await expect(service.purge(now)).resolves.toBeNull();
    expect(notifications.deleteOlderThan).not.toHaveBeenCalled();
    expect(mailLogs.deleteOlderThan).not.toHaveBeenCalled();
  });
});
