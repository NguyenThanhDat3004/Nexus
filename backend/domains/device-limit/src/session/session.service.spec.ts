import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { RedisModule } from '../redis/redis.module';
import { RedisService } from '../redis/redis.service';
import {
  SessionService,
  createDeviceFingerprint,
  deriveDeviceLabel,
} from './session.service';

describe('SessionService (Redis Session Store)', () => {
  let moduleRef: TestingModule;
  let sessionService: SessionService;
  let redisService: RedisService;
  const testUserId = `test-user-${Date.now()}`;
  const createdSessionIds: string[] = [];

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        RedisModule,
      ],
      providers: [SessionService],
    }).compile();

    await moduleRef.init();

    sessionService = moduleRef.get<SessionService>(SessionService);
    redisService = moduleRef.get<RedisService>(RedisService);
    // ensure connected
    await redisService.ping();
  });

  afterAll(async () => {
    const redis = redisService.getClient();
    // Clean up test keys
    for (const sid of createdSessionIds) {
      await redis.del(`session:${sid}`);
    }
    await redis.del(`user:${testUserId}:devices`);
    await moduleRef.close();
  });

  describe('createSession & getSession & TTL', () => {
    it('tạo session -> getSession trả về đúng dữ liệu, TTL còn <= 600 và > 590', async () => {
      const fp = createDeviceFingerprint('Mozilla/5.0 (iPhone)', 5, 390, 844);
      const label = deriveDeviceLabel('Mozilla/5.0 (iPhone)', 'mobile');

      const sessionId = await sessionService.createSession({
        userId: testUserId,
        ip: '192.168.1.100',
        deviceClass: 'mobile',
        deviceFingerprint: fp,
        deviceLabel: label,
      });

      expect(sessionId).toBeDefined();
      createdSessionIds.push(sessionId);

      // Verify TTL directly from Redis
      const redis = redisService.getClient();
      const ttl = await redis.ttl(`session:${sessionId}`);
      expect(ttl).toBeLessThanOrEqual(600);
      expect(ttl).toBeGreaterThan(590);

      // Verify getSession returns correct data
      const session = await sessionService.getSession(sessionId);
      expect(session).not.toBeNull();
      expect(session?.sessionId).toBe(sessionId);
      expect(session?.userId).toBe(testUserId);
      expect(session?.ip).toBe('192.168.1.100');
      expect(session?.deviceClass).toBe('mobile');
      expect(session?.deviceFingerprint).toBe(fp);
      expect(session?.deviceLabel).toBe('iPhone');
      expect(session?.createdAt).toBeDefined();
      expect(session?.lastSeenAt).toBeDefined();
    });

    it('đọc lại session -> last_seen_at được cập nhật', async () => {
      const sessionId = createdSessionIds[0];
      const sessionFirst = await sessionService.getSession(sessionId);
      expect(sessionFirst).not.toBeNull();

      // Wait a tiny delay so timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 50));

      const sessionSecond = await sessionService.getSession(sessionId);
      expect(sessionSecond).not.toBeNull();
      expect(
        new Date(sessionSecond!.lastSeenAt).getTime(),
      ).toBeGreaterThanOrEqual(new Date(sessionFirst!.lastSeenAt).getTime());
    });

    it('getSession với sessionId không tồn tại -> trả về null', async () => {
      const session = await sessionService.getSession('non-existent-session-id');
      expect(session).toBeNull();
    });
  });

  describe('countDevicesByClass & deleteSession & listDevices', () => {
    it('tạo 2 session cùng class -> countDevicesByClass trả về 2', async () => {
      // 1 session đã tạo ở trên (mobile), tạo thêm 1 session mobile nữa
      const sessionId2 = await sessionService.createSession({
        userId: testUserId,
        ip: '192.168.1.101',
        deviceClass: 'mobile',
        deviceFingerprint: 'fp-mobile-2',
        deviceLabel: 'iPhone phụ',
      });
      createdSessionIds.push(sessionId2);

      const countMobile = await sessionService.countDevicesByClass(
        testUserId,
        'mobile',
      );
      expect(countMobile).toBe(2);

      const countDesktop = await sessionService.countDevicesByClass(
        testUserId,
        'desktop',
      );
      expect(countDesktop).toBe(0);
    });

    it('xóa 1 session -> countDevicesByClass trả về 1, listDevices không còn session đó', async () => {
      const sessionIdToDelete = createdSessionIds[1];
      await sessionService.deleteSession(sessionIdToDelete);

      const countMobile = await sessionService.countDevicesByClass(
        testUserId,
        'mobile',
      );
      expect(countMobile).toBe(1);

      const devices = await sessionService.listDevices(testUserId);
      expect(devices.length).toBe(1);
      expect(devices[0].sessionId).toBe(createdSessionIds[0]);
      expect(devices.some((d) => d.sessionId === sessionIdToDelete)).toBe(
        false,
      );
    });
  });
});
