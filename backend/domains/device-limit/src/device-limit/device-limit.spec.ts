import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import configuration from '../config/configuration';
import { RedisModule } from '../redis/redis.module';
import { RedisService } from '../redis/redis.service';
import { SessionModule } from '../session/session.module';
import { SessionService } from '../session/session.service';
import { PinModule } from '../pin/pin.module';
import { DevicesModule } from '../devices/devices.module';
import { DevicesController } from '../devices/devices.controller';
import { DeviceLimitModule } from './device-limit.module';
import { DeviceLimitController } from './device-limit.controller';
import { DeviceLimitService } from './device-limit.service';

describe('DeviceLimit (Login Check & Session Lifecycle with Redis)', () => {
  let moduleRef: TestingModule;
  let deviceLimitController: DeviceLimitController;
  let devicesController: DevicesController;
  let sessionService: SessionService;
  let redisService: RedisService;

  const testUserId = `user-login-${Date.now()}`;
  const testPin = '123456';
  const createdSessionIds: string[] = [];

  function createMockResponse() {
    const res: any = {
      statusCode: 200,
      status: function (code: number) {
        this.statusCode = code;
        return this;
      },
    };
    return res;
  }

  beforeAll(async () => {
    if (!process.env.DEVICE_LIMIT_PIN_HASH) {
      process.env.DEVICE_LIMIT_PIN_HASH = await bcrypt.hash(testPin, 10);
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
        DevicesModule,
        DeviceLimitModule,
      ],
    }).compile();

    await moduleRef.init();

    deviceLimitController = moduleRef.get<DeviceLimitController>(
      DeviceLimitController,
    );
    devicesController = moduleRef.get<DevicesController>(DevicesController);
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
    await moduleRef.close();
  });

  it('1. Slot trống -> check trả allowed: true', async () => {
    const result = await deviceLimitController.checkDeviceLimit(testUserId, {
      deviceClass: 'mobile',
      deviceFingerprint: 'fp-iphone-1',
    });
    expect(result).toEqual({ allowed: true });
  });

  it('2. Tạo 1 session mobile, check lại cùng fingerprint -> allowed: true, existingSessionId trùng session cũ', async () => {
    const resMock1 = createMockResponse();
    const createResult = await deviceLimitController.createSession(
      testUserId,
      {
        deviceClass: 'mobile',
        deviceFingerprint: 'fp-iphone-1',
        deviceLabel: 'iPhone 15 Pro',
        ip: '10.0.1.5',
      },
      resMock1,
    );

    expect(resMock1.statusCode).toBe(HttpStatus.CREATED);
    expect(createResult.sessionId).toBeDefined();
    const firstSessionId = createResult.sessionId;
    createdSessionIds.push(firstSessionId);

    // Check lại bằng cùng fingerprint
    const checkResult = await deviceLimitController.checkDeviceLimit(
      testUserId,
      {
        deviceClass: 'mobile',
        deviceFingerprint: 'fp-iphone-1',
      },
    );
    expect(checkResult.allowed).toBe(true);
    expect(checkResult.existingSessionId).toBe(firstSessionId);

    // Identity gọi POST /sessions lại với cùng fingerprint -> trả 200 và session cũ
    const resMock2 = createMockResponse();
    const reLoginResult = await deviceLimitController.createSession(
      testUserId,
      {
        deviceClass: 'mobile',
        deviceFingerprint: 'fp-iphone-1',
        deviceLabel: 'iPhone 15 Pro',
        ip: '10.0.1.5',
      },
      resMock2,
    );
    expect(resMock2.statusCode).toBe(HttpStatus.OK);
    expect(reLoginResult.sessionId).toBe(firstSessionId);
  });

  it('3. Slot mobile đã đầy, check bằng fingerprint khác -> 409, body chứa đúng device cũ', async () => {
    try {
      await deviceLimitController.checkDeviceLimit(testUserId, {
        deviceClass: 'mobile',
        deviceFingerprint: 'fp-iphone-different',
      });
      fail('Kỳ vọng ném 409 Conflict nhưng không ném');
    } catch (err: any) {
      expect(err).toBeInstanceOf(HttpException);
      expect(err.getStatus()).toBe(HttpStatus.CONFLICT);

      const responseBody = err.getResponse();
      expect(responseBody.allowed).toBe(false);
      expect(responseBody.devices).toBeDefined();
      expect(responseBody.devices.length).toBe(1);
      expect(responseBody.devices[0].sessionId).toBe(createdSessionIds[0]);
      expect(responseBody.devices[0].deviceClass).toBe('mobile');
    }
  });

  it('4. Xóa device cũ bằng DELETE kèm PIN rồi check lại bằng fingerprint mới -> allowed: true', async () => {
    const oldSessionId = createdSessionIds[0];

    // Xóa qua DevicesController (Phần 6)
    const deleteRes = await devicesController.deleteDevice(
      testUserId,
      oldSessionId,
      { pin: testPin },
    );
    expect(deleteRes).toEqual({
      success: true,
      message: 'Đã xóa session thành công',
    });

    // Check lại bằng fingerprint mới
    const checkResult = await deviceLimitController.checkDeviceLimit(
      testUserId,
      {
        deviceClass: 'mobile',
        deviceFingerprint: 'fp-iphone-different',
      },
    );
    expect(checkResult).toEqual({ allowed: true });
  });

  it('5. POST /users/:userId/sessions -> 201, session xuất hiện trong GET /users/:userId/devices', async () => {
    const resMock = createMockResponse();
    const createResult = await deviceLimitController.createSession(
      testUserId,
      {
        deviceClass: 'mobile',
        deviceFingerprint: 'fp-iphone-different',
        deviceLabel: 'iPhone 16 Pro Max',
        ip: '10.0.1.9',
      },
      resMock,
    );

    expect(resMock.statusCode).toBe(HttpStatus.CREATED);
    expect(createResult.sessionId).toBeDefined();
    createdSessionIds.push(createResult.sessionId);

    // Kiểm tra session mới xuất hiện trong GET /users/:userId/devices
    const devices = await devicesController.getDevices(testUserId);
    expect(devices.length).toBe(1);
    expect(devices[0].sessionId).toBe(createResult.sessionId);
    expect(devices[0].deviceLabel).toBe('iPhone 16 Pro Max');
  });

  it('6. POST /sessions khi slot mobile đã đầy, fingerprint khác -> 409 và không tạo session mới', async () => {
    // Slot mobile của testUserId đang có 1 session (từ test 5)
    const before = await devicesController.getDevices(testUserId);
    expect(before.length).toBe(1);

    const resMock = createMockResponse();
    let thrown: any;
    try {
      await deviceLimitController.createSession(
        testUserId,
        {
          deviceClass: 'mobile',
          deviceFingerprint: 'fp-iphone-khac-nua',
          deviceLabel: 'iPhone khác',
          ip: '10.0.1.10',
        },
        resMock,
      );
    } catch (err: any) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(HttpException);
    expect(thrown.getStatus()).toBe(HttpStatus.CONFLICT);
    const responseBody = thrown.getResponse();
    expect(responseBody.allowed).toBe(false);
    expect(responseBody.devices).toBeDefined();
    expect(responseBody.devices.length).toBe(1);

    // Không có session mới nào được tạo
    const devices = await devicesController.getDevices(testUserId);
    expect(devices.length).toBe(1);
  });

  it('7. 10 login song song cùng class, slot trống -> đúng 1 cái 201, 9 cái 409', async () => {
    const raceUserId = `user-race-${Date.now()}`;
    const attempts = Array.from({ length: 10 }, (_, i) => {
      const resMock = createMockResponse();
      return deviceLimitController
        .createSession(
          raceUserId,
          {
            deviceClass: 'desktop',
            deviceFingerprint: `fp-race-${i}`,
            deviceLabel: `Máy race ${i}`,
            ip: '10.0.2.1',
          },
          resMock,
        )
        .then((result) => ({
          ok: true,
          status: resMock.statusCode,
          sessionId: result.sessionId,
        }))
        .catch((err: any) => ({
          ok: false,
          status: err?.getStatus?.() ?? 0,
          sessionId: undefined as string | undefined,
        }));
    });
    const results: any[] = await Promise.all(attempts);
    const created = results.filter((r) => r.ok);
    const conflicts = results.filter(
      (r) => !r.ok && r.status === HttpStatus.CONFLICT,
    );
    expect(created).toHaveLength(1);
    expect(created[0].status).toBe(HttpStatus.CREATED);
    expect(conflicts).toHaveLength(9);

    // Dọn dẹp session race
    const redis = redisService.getClient();
    for (const r of created) {
      await redis.del(`session:${r.sessionId}`);
    }
    await redis.del(`user:${raceUserId}:devices`);
  });

  it('8. deviceClass lạ -> 400 BadRequestException (không né được giới hạn bằng class bịa)', async () => {
    await expect(
      deviceLimitController.checkDeviceLimit(testUserId, {
        deviceClass: 'smartwatch' as any,
        deviceFingerprint: 'fp-watch',
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      deviceLimitController.createSession(
        testUserId,
        {
          deviceClass: 'smartwatch' as any,
          deviceFingerprint: 'fp-watch',
        },
        createMockResponse(),
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
