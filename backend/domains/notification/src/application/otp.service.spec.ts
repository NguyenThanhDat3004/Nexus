import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import RedisMock from 'ioredis-mock';
import { OtpService } from './otp.service';

const otpConfig = { ttlSeconds: 60, resendCooldownSeconds: 60, maxAttempts: 5, hmacSecret: 's'.repeat(32) };

describe('OtpService', () => {
  const redis = new RedisMock();
  const mail = { sendOtp: jest.fn() };
  const config = { get: () => otpConfig } as unknown as ConfigService;
  const service = new OtpService(redis as never, mail as never, config as never);
  const lastCode = () => mail.sendOtp.mock.calls.at(-1)[1] as string;
  const KEY = 'otp:REGISTER:a@x.com';

  beforeEach(async () => {
    await redis.flushall();
    mail.sendOtp.mockReset().mockResolvedValue(undefined);
  });

  it('gửi mã 6 số, Redis chỉ lưu HMAC với TTL 60s', async () => {
    await expect(service.issue('A@x.com ', 'REGISTER')).resolves.toEqual({ expires_in: 60 });
    expect(lastCode()).toMatch(/^\d{6}$/);
    const stored = await redis.get(KEY); // email đã được chuẩn hoá
    expect(stored).not.toContain(lastCode());
    expect(await redis.ttl(KEY)).toBeGreaterThan(55);
  });

  it('gửi lại trong thời gian cooldown → 429', async () => {
    await service.issue('a@x.com', 'REGISTER');
    await expect(service.issue('a@x.com', 'REGISTER')).rejects.toMatchObject({ status: 429 });
  });

  it('đúng mã → true, dùng lại lần 2 → false', async () => {
    await service.issue('a@x.com', 'REGISTER');
    const code = lastCode();
    expect(await service.verify('a@x.com', 'REGISTER', code)).toBe(true);
    expect(await service.verify('a@x.com', 'REGISTER', code)).toBe(false);
  });

  it('mã của mục đích khác không dùng được', async () => {
    await service.issue('a@x.com', 'REGISTER');
    expect(await service.verify('a@x.com', 'LOGIN', lastCode())).toBe(false);
  });

  it('sai quá 5 lần → mã bị huỷ, kể cả lần sau nhập đúng', async () => {
    await service.issue('a@x.com', 'REGISTER');
    const code = lastCode();
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) expect(await service.verify('a@x.com', 'REGISTER', wrong)).toBe(false);
    expect(await service.verify('a@x.com', 'REGISTER', code)).toBe(false);
    expect(await redis.exists(KEY)).toBe(0);
  });

  it('hết hạn (key đã mất) → false', async () => {
    await service.issue('a@x.com', 'REGISTER');
    await redis.del(KEY);
    expect(await service.verify('a@x.com', 'REGISTER', lastCode())).toBe(false);
  });

  it('gửi mail lỗi → dọn key, được gửi lại ngay', async () => {
    mail.sendOtp.mockRejectedValueOnce(new HttpException('MAIL_DELIVERY_FAILED', 502));
    await expect(service.issue('a@x.com', 'REGISTER')).rejects.toBeInstanceOf(HttpException);
    await expect(service.issue('a@x.com', 'REGISTER')).resolves.toEqual({ expires_in: 60 });
  });
});