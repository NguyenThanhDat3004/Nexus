import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import configuration from '../config/configuration';
import { RedisModule } from '../redis/redis.module';
import { RedisService } from '../redis/redis.service';
import { SessionModule } from '../session/session.module';
import { SessionService } from '../session/session.service';
import { PinModule } from '../pin/pin.module';
import { DevicesController } from './devices.controller';

describe('DevicesController (Devices API with PIN)', () => {
  let moduleRef: TestingModule;
  let controller: DevicesController;
  let sessionService: SessionService;
  let redisService: RedisService;

  const testUserId = `user-dev-test-${Date.now()}`;
  const otherUserId = `user-other-${Date.now()}`;
  const createdSessionIds: string[] = [];

  const correctPin = '123456';
  const wrongPin = '000000';

  beforeAll(async () => {
    if (!process.env.DEVICE_LIMIT_PIN_HASH) {
      process.env.DEVICE_LIMIT_PIN_HASH = await bcrypt.hash(correctPin, 10);
    }

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        RedisModule,
        SessionModule,
        PinModule,
      ],
      controllers: [DevicesController],
    }).compile();

    await moduleRef.init();

    controller = moduleRef.get<DevicesController>(DevicesController);
    sessionService = moduleRef.get<SessionService>(SessionService);
    redisService = moduleRef.get<RedisService>(RedisService);
    await redisService.ping();
  });

  afterAll(async () => {
    const redis = redisService.getClient();
    for (const sid of createdSessionIds) {
      await redis.del(`session:${sid}`);
    }
    await redis.del(`user:${testUserId}:devices`);
    await redis.del(`user:${otherUserId}:devices`);
    await moduleRef.close();
  });

  it('tạo 2 session -> GET liệt kê đủ 2 thiết bị', async () => {
    const s1 = await sessionService.createSession({
      userId: testUserId,
      ip: '10.0.0.1',
      deviceClass: 'desktop',
      deviceFingerprint: 'fp-mac',
      deviceLabel: 'MacBook Pro',
    });
    createdSessionIds.push(s1);

    const s2 = await sessionService.createSession({
      userId: testUserId,
      ip: '10.0.0.2',
      deviceClass: 'mobile',
      deviceFingerprint: 'fp-iphone',
      deviceLabel: 'iPhone 15',
    });
    createdSessionIds.push(s2);

    const devices = await controller.getDevices(testUserId);
    expect(devices).toHaveLength(2);

    const sessionIds = devices.map((d) => d.sessionId);
    expect(sessionIds).toContain(s1);
    expect(sessionIds).toContain(s2);
  });

  it('DELETE với thiếu PIN trong body -> ném 400 BadRequestException', async () => {
    const s1 = createdSessionIds[0];
    await expect(
      controller.deleteDevice(testUserId, s1, {} as any),
    ).rejects.toThrow(BadRequestException);

    await expect(
      controller.deleteDevice(testUserId, s1, { pin: '' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('DELETE với PIN sai -> ném 401 UnauthorizedException và session vẫn còn', async () => {
    const s2 = createdSessionIds[1];
    await expect(
      controller.deleteDevice(testUserId, s2, { pin: wrongPin }),
    ).rejects.toThrow(UnauthorizedException);

    // Kiểm tra session vẫn còn trong Redis và trong danh sách
    const session = await sessionService.getSession(s2);
    expect(session).not.toBeNull();

    const devices = await controller.getDevices(testUserId);
    expect(devices.map((d) => d.sessionId)).toContain(s2);
  });

  it('DELETE với PIN đúng -> trả 200 và GET còn 1 thiết bị', async () => {
    const s1 = createdSessionIds[0];
    const res = await controller.deleteDevice(testUserId, s1, {
      pin: correctPin,
    });
    expect(res).toEqual({ success: true, message: 'Đã xóa session thành công' });

    const devices = await controller.getDevices(testUserId);
    expect(devices).toHaveLength(1);
    expect(devices[0].sessionId).toBe(createdSessionIds[1]);
  });

  it('DELETE session không tồn tại -> ném 404 NotFoundException', async () => {
    await expect(
      controller.deleteDevice(testUserId, 'non-existent-session-id', {
        pin: correctPin,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('DELETE session của user khác -> ném 404 NotFoundException', async () => {
    // Tạo session thuộc về otherUserId
    const otherSessionId = await sessionService.createSession({
      userId: otherUserId,
      ip: '10.0.0.99',
      deviceClass: 'tablet',
      deviceFingerprint: 'fp-ipad',
      deviceLabel: 'iPad Air',
    });
    createdSessionIds.push(otherSessionId);

    // testUserId cố gắng xóa otherSessionId với PIN đúng của testUserId
    await expect(
      controller.deleteDevice(testUserId, otherSessionId, { pin: correctPin }),
    ).rejects.toThrow(NotFoundException);

    // Session của otherUserId vẫn phải còn nguyên
    const otherSession = await sessionService.getSession(otherSessionId);
    expect(otherSession).not.toBeNull();
  });
});
