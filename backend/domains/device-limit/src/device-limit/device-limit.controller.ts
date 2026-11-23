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

    let targetSessionId = body.existingSessionId;
    if (!targetSessionId) {
      const limitCheck = await this.deviceLimitService.checkDeviceLimit(
        userId,
        body.deviceClass,
        body.deviceFingerprint,
      );
      if (limitCheck.existingSessionId) {
        targetSessionId = limitCheck.existingSessionId;
      }
    }

    if (targetSessionId) {
      const existing = await this.sessionService.getSession(targetSessionId);
      if (existing && existing.userId === userId) {
        res.status(HttpStatus.OK);
        return { sessionId: targetSessionId };
      }
    }

    const sessionId = await this.sessionService.createSession({
      userId,
      ip: body.ip ?? '127.0.0.1',
      deviceClass: body.deviceClass,
      deviceFingerprint: body.deviceFingerprint,
      deviceLabel: body.deviceLabel ?? 'Thiết bị lạ',
    });

    res.status(HttpStatus.CREATED);
    return { sessionId };
  }
}
