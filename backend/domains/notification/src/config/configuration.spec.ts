import { buildConfig } from './configuration';

const validEnv = { JWT_SECRET: 'x'.repeat(32), INTERNAL_SERVICE_TOKEN: 'y'.repeat(24), OTP_HMAC_SECRET: 'z'.repeat(32) };

describe('buildConfig', () => {
  it('dùng giá trị mặc định', () => {
    const c = buildConfig(validEnv);
    expect(c.port).toBe(3002);
    expect(c.otp.ttlSeconds).toBe(60);
    expect(c.webOrigin).toEqual(['http://localhost:5173']);
  });
  it('tách nhiều WEB_ORIGIN', () => {
    expect(buildConfig({ ...validEnv, WEB_ORIGIN: 'http://a.test, http://b.test' }).webOrigin).toEqual(['http://a.test', 'http://b.test']);
  });
  it.each(['JWT_SECRET', 'INTERNAL_SERVICE_TOKEN', 'OTP_HMAC_SECRET'])('dừng khi thiếu %s', (name) => {
    expect(() => buildConfig({ ...validEnv, [name]: '' })).toThrow(name);
  });
  it('dừng khi JWT_SECRET quá ngắn', () => {
    expect(() => buildConfig({ ...validEnv, JWT_SECRET: 'short' })).toThrow('JWT_SECRET');
  });
  it('số không hợp lệ → mặc định', () => {
    expect(buildConfig({ ...validEnv, OTP_TTL_SECONDS: 'abc' }).otp.ttlSeconds).toBe(60);
  });
  it('retention mặc định 90 / 180 ngày, lô 1000', () => {
    expect(buildConfig(validEnv).retention).toEqual({ notificationDays: 90, mailLogDays: 180, batchSize: 1000 });
  });
  it('retention = 0 → dùng mặc định (không bao giờ xoá sạch)', () => {
    expect(buildConfig({ ...validEnv, NOTIFICATION_RETENTION_DAYS: '0' }).retention.notificationDays).toBe(90);
  });
});