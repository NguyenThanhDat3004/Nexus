import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { DeviceLimitService } from './device-limit.service';
import { SessionService } from '../session/session.service';

export interface CheckDeviceLimitDto {
  deviceClass: 'mobile' | 'desktop' | 'tablet';
  deviceFingerprint: string;
}

export interface CreateSessionRequestDto {
  deviceClass: 'mobile' | 'desktop' | 'tablet';
  deviceFingerprint: string;
  deviceLabel?: string;
  ip?: string;
  existingSessionId?: string;
}

/** Các giá trị deviceClass hợp lệ — chặn client bịa class lạ để né giới hạn. */
const VALID_DEVICE_CLASSES = ['mobile', 'desktop', 'tablet'] as const;

function assertValidDeviceClass(deviceClass: unknown): asserts deviceClass is
  | 'mobile'
  | 'desktop'
  | 'tablet' {
  if (
    typeof deviceClass !== 'string' ||
    !(VALID_DEVICE_CLASSES as readonly string[]).includes(deviceClass)
  ) {
    throw new BadRequestException(
      `deviceClass không hợp lệ: ${String(deviceClass)} (chỉ mobile/desktop/tablet)`,
    );
  }
}

@Controller('users/:userId')
export class DeviceLimitController {
  constructor(
    private readonly deviceLimitService: DeviceLimitService,
    private readonly sessionService: SessionService,
  ) {}

  @Post('device-limit/check')
  @HttpCode(HttpStatus.OK)
  async checkDeviceLimit(
    @Param('userId') userId: string,
    @Body() body: CheckDeviceLimitDto,
  ) {
    if (!body || !body.deviceClass || !body.deviceFingerprint) {
      throw new BadRequestException('Thiếu deviceClass hoặc deviceFingerprint');
    }
    assertValidDeviceClass(body.deviceClass);

    const result = await this.deviceLimitService.checkDeviceLimit(
      userId,
      body.deviceClass,
      body.deviceFingerprint,
    );

    if (!result.allowed) {
      throw new HttpException(
        {
          allowed: false,
          devices: result.devices,
        },
        HttpStatus.CONFLICT,
      );
    }

    const response: { allowed: boolean; existingSessionId?: string } = {
      allowed: true,
    };
    if (result.existingSessionId) {
      response.existingSessionId = result.existingSessionId;
    }
    return response;
  }

  @Post('sessions')
  async createSession(
    @Param('userId') userId: string,
    @Body() body: CreateSessionRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body || !body.deviceClass || !body.deviceFingerprint) {
      throw new BadRequestException('Thiếu deviceClass hoặc deviceFingerprint');
    }
    assertValidDeviceClass(body.deviceClass);

    // Client đã biết sessionId cũ (login lại cùng máy): chỉ dùng lại session
    // đó, không tạo mới nên không cần kiểm tra giới hạn.
    if (body.existingSessionId) {
      const existing = await this.sessionService.getSession(
        body.existingSessionId,
      );
      if (existing && existing.userId === userId) {
        res.status(HttpStatus.OK);
        return { sessionId: body.existingSessionId };
      }
      // existingSessionId không hợp lệ -> rơi xuống tạo mới qua đường nguyên tử.
    }

    // Tạo session nguyên tử trong Redis (Lua script): kiểm tra giới hạn +
    // tạo trong 1 lần thực thi, 2 login song song không thể cùng lọt qua khe
    // check-then-create. Hết slot -> 409 kèm danh sách device cùng loại.
    const result = await this.sessionService.createSessionIfAllowed({
      userId,
      ip: body.ip ?? '127.0.0.1',
      deviceClass: body.deviceClass,
      deviceFingerprint: body.deviceFingerprint,
      deviceLabel: body.deviceLabel ?? 'Thiết bị lạ',
    });

    if (result.status === 'LIMIT') {
      const devices = await this.sessionService.getSessionsByClass(
        userId,
        body.deviceClass,
      );
      throw new HttpException(
        {
          allowed: false,
          devices: devices.map((s) => ({
            sessionId: s.sessionId,
            deviceClass: s.deviceClass,
            deviceLabel: s.deviceLabel,
            lastSeenAt: s.lastSeenAt,
          })),
        },
        HttpStatus.CONFLICT,
      );
    }

    res.status(
      result.status === 'CREATED' ? HttpStatus.CREATED : HttpStatus.OK,
    );
    return { sessionId: result.sessionId };
  }
}
