import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import type { AppConfig } from '../config/configuration';
import { REDIS } from '../infrastructure/redis/redis.module';
import { MailService } from './mail.service';

export const OTP_PURPOSES = ['REGISTER', 'LOGIN', 'RESET_PIN'] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

@Injectable()
export class OtpService {
  private readonly cfg: AppConfig['otp'];

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    private readonly mail: MailService,
    config: ConfigService<AppConfig, true>,
  ) {
    this.cfg = config.get('otp', { infer: true });
  }

  async issue(email: string, purpose: OtpPurpose): Promise<{ expires_in: number }> {
    const key = this.key(email, purpose);
    // Chống spam: SET NX → trong thời gian cooldown chỉ 1 request thắng
    const allowed = await this.redis.set(`${key}:cooldown`, '1', 'EX', this.cfg.resendCooldownSeconds, 'NX');
    if (allowed !== 'OK') throw new HttpException('OTP_RESEND_TOO_SOON', HttpStatus.TOO_MANY_REQUESTS);

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0'); // crypto, KHÔNG dùng Math.random
    await this.redis.multi()
      .set(key, this.hash(key, code), 'EX', this.cfg.ttlSeconds) // chỉ lưu HMAC, không lưu mã gốc
      .del(`${key}:attempts`)
      .exec();

    try {
      await this.mail.sendOtp(email, code, this.cfg.ttlSeconds);
    } catch (error) {
      await this.redis.del(key, `${key}:cooldown`); // gửi lỗi → cho phép gửi lại ngay
      throw error;
    }
    return { expires_in: this.cfg.ttlSeconds };
  }

  async verify(email: string, purpose: OtpPurpose, code: string): Promise<boolean> {
    const key = this.key(email, purpose);
    const stored = await this.redis.get(key);
    if (!stored) return false; // hết hạn hoặc chưa từng gửi

    const attempts = await this.redis.incr(`${key}:attempts`);
    if (attempts === 1) await this.redis.expire(`${key}:attempts`, this.cfg.ttlSeconds);
    if (attempts > this.cfg.maxAttempts) {
      await this.redis.del(key, `${key}:attempts`); // sai quá nhiều → huỷ mã, phải xin mã mới
      return false;
    }

    const matches = timingSafeEqual(Buffer.from(stored, 'hex'), Buffer.from(this.hash(key, code), 'hex'));
    if (!matches) return false;
    // DEL trả 1 cho đúng MỘT request → 2 request đúng mã gửi cùng lúc chỉ 1 cái thành công (dùng 1 lần)
    const consumed = await this.redis.del(key);
    await this.redis.del(`${key}:attempts`);
    return consumed === 1;
  }

  private key(email: string, purpose: OtpPurpose) {
    return `otp:${purpose}:${email.trim().toLowerCase()}`;
  }

  private hash(key: string, code: string) {
    return createHmac('sha256', this.cfg.hmacSecret).update(`${key}:${code}`).digest('hex');
  }
}