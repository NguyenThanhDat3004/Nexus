import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PinVerificationService } from './pin-verification.interface';

/**
 * TODO: Implementation này chỉ dùng tạm cho môi trường local/test.
 * Khi service Identity (cổng 8081) hoàn thành, thay thế implementation này
 * bằng cách gọi HTTP request sang Identity service (cổng 8081) để verify hash PIN thật của user.
 */
@Injectable()
export class LocalPinVerificationService implements PinVerificationService {
  private readonly logger = new Logger(LocalPinVerificationService.name);

  constructor(private readonly configService: ConfigService) {}

  async verifyPin(userId: string, pin: string): Promise<boolean> {
    const pinHash =
      this.configService.get<string>('pinHash') ||
      process.env.DEVICE_LIMIT_PIN_HASH ||
      '';

    if (!pinHash) {
      this.logger.warn(
        `TODO: Chưa cấu hình DEVICE_LIMIT_PIN_HASH khi verify PIN cho user ${userId}`,
      );
      return false;
    }

    try {
      return await bcrypt.compare(pin, pinHash);
    } catch (err: any) {
      this.logger.error(
        `Lỗi bcrypt khi verify PIN cho user ${userId}: ${err?.message}`,
      );
      return false;
    }
  }
}
