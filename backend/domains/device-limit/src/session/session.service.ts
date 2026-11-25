import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { randomUUID, createHash } from 'node:crypto';

export interface CreateSessionDto {
  userId: string;
  ip: string;
  deviceClass: 'mobile' | 'desktop' | 'tablet';
  deviceFingerprint: string;
  deviceLabel: string;
}

export interface SessionData {
  sessionId: string;
  userId: string;
  ip: string;
  deviceClass: 'mobile' | 'desktop' | 'tablet';
  deviceFingerprint: string;
  deviceLabel: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface DeviceSummary {
  sessionId: string;
  deviceClass: string;
  deviceLabel: string;
  lastSeenAt: string;
}

/**
 * Lua script: kiểm tra giới hạn + tạo session trong 1 lần thực thi Redis
 * (nguyên tử) — 2 login song song không thể cùng lọt qua.
 *
 * KEYS[1] = user:{userId}:devices (SET)
 * ARGV[1] = userId
 * ARGV[2] = sessionId mới (UUID)
 * ARGV[3] = deviceClass
 * ARGV[4] = deviceFingerprint
 * ARGV[5] = deviceLabel
 * ARGV[6] = ip
 * ARGV[7] = now (ISO)
 * ARGV[8] = TTL (giây)
 *
 * Trả về {'CREATED', sessionId} | {'EXISTING', sessionId} | {'LIMIT', ''}.
 * EXISTING: session cũ được gia hạn TTL + cập nhật last_seen_at (login lại
 * cùng máy cũng là hoạt động — phải refresh như getSession vẫn làm).
 * Session hết hạn (key đã mất) được dọn khỏi SET ngay trong script.
 */
const CREATE_SESSION_IF_ALLOWED_LUA = `
local members = redis.call('SMEMBERS', KEYS[1])
local count = 0
for _, sid in ipairs(members) do
  local key = 'session:' .. sid
  local cls = redis.call('HGET', key, 'device_class')
  if cls == false then
    redis.call('SREM', KEYS[1], sid)
  elseif cls == ARGV[3] then
    count = count + 1
    local fp = redis.call('HGET', key, 'device_fingerprint')
    if fp == ARGV[4] then
      -- Login lại cùng máy: dùng lại session cũ NHƯNG gia hạn TTL +
      -- cập nhật last_seen_at (giữ đúng hành vi cũ của đường check ->
      -- getSession, vốn refresh mỗi lần login lại).
      redis.call('HSET', key, 'last_seen_at', ARGV[7])
      redis.call('EXPIRE', key, ARGV[8])
      return {'EXISTING', sid}
    end
  end
end
if count > 0 then
  return {'LIMIT', ''}
end
local sessionKey = 'session:' .. ARGV[2]
redis.call('HSET', sessionKey,
  'user_id', ARGV[1],
  'ip', ARGV[6],
  'device_class', ARGV[3],
  'device_fingerprint', ARGV[4],
  'device_label', ARGV[5],
  'created_at', ARGV[7],
  'last_seen_at', ARGV[7])
redis.call('EXPIRE', sessionKey, ARGV[8])
redis.call('SADD', KEYS[1], ARGV[2])
return {'CREATED', ARGV[2]}
`;

/**
 * Sinh fingerprint thiết bị từ SHA-256 của:
 * (userAgent + maxTouchPoints + screenWidth x screenHeight)
 *
 * Các thành phần nối bằng '|' để 2 bộ input khác nhau không thể cho cùng 1
 * chuỗi raw (vd UA "ab" + touch 12 vs UA "ab1" + touch 2).
 */
export function createDeviceFingerprint(
  userAgent?: string | null,
  maxTouchPoints?: number | null,
  screenWidth?: number | null,
  screenHeight?: number | null,
): string {
  const raw = `${userAgent ?? ''}|${maxTouchPoints ?? 0}|${screenWidth ?? 0}x${screenHeight ?? 0}`;
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Suy ra tên hiển thị từ User-Agent và loại thiết bị
 */
export function deriveDeviceLabel(
  userAgent?: string | null,
  deviceClass?: 'mobile' | 'desktop' | 'tablet',
): string {
  const ua = userAgent ?? '';
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Macintosh')) {
    if (deviceClass === 'tablet') return 'iPad';
    if (deviceClass === 'mobile') return 'iPhone';
    return 'MacBook';
  }
  if (ua.includes('Android')) return 'Thiết bị Android';
  if (ua.includes('Windows')) return 'Máy tính Windows';
  if (ua.includes('Linux')) return 'Máy tính Linux';
  return 'Thiết bị lạ';
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly sessionTtlSeconds = 600; // 10 phút idle

  constructor(private readonly redisService: RedisService) {}

  /**
   * Tạo session mới:
   * - Sinh sessionId ngẫu nhiên (UUID v4)
   * - Lưu hash session:{sessionId} với TTL 600s
   * - Thêm sessionId vào set user:{userId}:devices
   */
  async createSession(dto: CreateSessionDto): Promise<string> {
    const sessionId = randomUUID();
    const now = new Date().toISOString();
    const redis = this.redisService.getClient();

    const sessionKey = `session:${sessionId}`;
    const userDevicesKey = `user:${dto.userId}:devices`;

    const pipeline = redis.pipeline();
    pipeline.hset(sessionKey, {
      user_id: dto.userId,
      ip: dto.ip,
      device_class: dto.deviceClass,
      device_fingerprint: dto.deviceFingerprint,
      device_label: dto.deviceLabel,
      created_at: now,
      last_seen_at: now,
    });
    pipeline.expire(sessionKey, this.sessionTtlSeconds);
    pipeline.sadd(userDevicesKey, sessionId);
    await pipeline.exec();

    return sessionId;
  }

  /**
   * Tạo session mới có kiểm tra giới hạn NGAY TRONG Redis (Lua script, nguyên tử):
   * đếm session cùng loại + so fingerprint + tạo session trong 1 lần thực thi,
   * nên 2 login song song không thể cùng lọt qua khe check-then-create.
   * Trả về { status: 'CREATED' | 'EXISTING' | 'LIMIT', sessionId? }.
   */
  async createSessionIfAllowed(dto: CreateSessionDto): Promise<{
    status: 'CREATED' | 'EXISTING' | 'LIMIT';
    sessionId?: string;
  }> {
    const sessionId = randomUUID();
    const now = new Date().toISOString();
    const redis = this.redisService.getClient();

    const result = (await redis.eval(
      CREATE_SESSION_IF_ALLOWED_LUA,
      1,
      `user:${dto.userId}:devices`,
      dto.userId,
      sessionId,
      dto.deviceClass,
      dto.deviceFingerprint,
      dto.deviceLabel,
      dto.ip,
      now,
      this.sessionTtlSeconds,
    )) as [string, string];

    const [status, id] = result;
    if (status === 'CREATED' || status === 'EXISTING') {
      return { status, sessionId: id };
    }
    return { status: 'LIMIT' };
  }

  /**
   * Lấy session:
   * - Trả về dữ liệu session hoặc null
   * - Cập nhật last_seen_at + gia hạn TTL 600s (sliding expiration)
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const redis = this.redisService.getClient();
    const sessionKey = `session:${sessionId}`;

    const data = await redis.hgetall(sessionKey);
    if (!data || Object.keys(data).length === 0 || !data.user_id) {
      return null;
    }

    const now = new Date().toISOString();
    const pipeline = redis.pipeline();
    pipeline.hset(sessionKey, 'last_seen_at', now);
    pipeline.expire(sessionKey, this.sessionTtlSeconds);
    await pipeline.exec();

    return {
      sessionId,
      userId: data.user_id,
      ip: data.ip,
      deviceClass: data.device_class as 'mobile' | 'desktop' | 'tablet',
      deviceFingerprint: data.device_fingerprint,
      deviceLabel: data.device_label,
      createdAt: data.created_at,
      lastSeenAt: now,
    };
  }

  /**
   * Xóa session:
   * - Xóa key session:{sessionId}
   * - Gỡ sessionId khỏi set user:{userId}:devices
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const redis = this.redisService.getClient();
    const sessionKey = `session:${sessionId}`;

    const userId = await redis.hget(sessionKey, 'user_id');
    const pipeline = redis.pipeline();
    pipeline.del(sessionKey);
    if (userId) {
      pipeline.srem(`user:${userId}:devices`, sessionId);
    }
    await pipeline.exec();
    return true;
  }

  /**
   * Đếm số session của user có deviceClass tương ứng
   */
  async countDevicesByClass(
    userId: string,
    deviceClass: 'mobile' | 'desktop' | 'tablet',
  ): Promise<number> {
    const redis = this.redisService.getClient();
    const userDevicesKey = `user:${userId}:devices`;
    const sessionIds = await redis.smembers(userDevicesKey);

    if (sessionIds.length === 0) {
      return 0;
    }

    let count = 0;
    const expiredIds: string[] = [];

    for (const id of sessionIds) {
      const cls = await redis.hget(`session:${id}`, 'device_class');
      if (!cls) {
        expiredIds.push(id);
      } else if (cls === deviceClass) {
        count += 1;
      }
    }

    if (expiredIds.length > 0) {
      await redis.srem(userDevicesKey, ...expiredIds);
    }

    return count;
  }

  /**
   * Lấy danh sách session của user theo deviceClass kèm thông tin fingerprint
   */
  async getSessionsByClass(
    userId: string,
    deviceClass: 'mobile' | 'desktop' | 'tablet',
  ): Promise<
    {
      sessionId: string;
      deviceClass: string;
      deviceFingerprint: string;
      deviceLabel: string;
      lastSeenAt: string;
    }[]
  > {
    const redis = this.redisService.getClient();
    const userDevicesKey = `user:${userId}:devices`;
    const sessionIds = await redis.smembers(userDevicesKey);

    if (sessionIds.length === 0) {
      return [];
    }

    const results: {
      sessionId: string;
      deviceClass: string;
      deviceFingerprint: string;
      deviceLabel: string;
      lastSeenAt: string;
    }[] = [];
    const expiredIds: string[] = [];

    for (const id of sessionIds) {
      const data = await redis.hmget(
        `session:${id}`,
        'device_class',
        'device_fingerprint',
        'device_label',
        'last_seen_at',
      );
      if (!data[0]) {
        expiredIds.push(id);
      } else if (data[0] === deviceClass) {
        results.push({
          sessionId: id,
          deviceClass: data[0],
          deviceFingerprint: data[1] ?? '',
          deviceLabel: data[2] ?? '',
          lastSeenAt: data[3] ?? '',
        });
      }
    }

    if (expiredIds.length > 0) {
      await redis.srem(userDevicesKey, ...expiredIds);
    }

    return results;
  }

  /**
   * Lấy danh sách session hợp lệ của user
   */
  async listDevices(userId: string): Promise<DeviceSummary[]> {
    const redis = this.redisService.getClient();
    const userDevicesKey = `user:${userId}:devices`;
    const sessionIds = await redis.smembers(userDevicesKey);

    if (sessionIds.length === 0) {
      return [];
    }

    const devices: DeviceSummary[] = [];
    const expiredIds: string[] = [];

    for (const id of sessionIds) {
      const data = await redis.hmget(
        `session:${id}`,
        'device_class',
        'device_label',
        'last_seen_at',
      );
      if (!data[0]) {
        expiredIds.push(id);
      } else {
        devices.push({
          sessionId: id,
          deviceClass: data[0],
          deviceLabel: data[1] ?? '',
          lastSeenAt: data[2] ?? '',
        });
      }
    }

    if (expiredIds.length > 0) {
      await redis.srem(userDevicesKey, ...expiredIds);
    }

    return devices;
  }
}
