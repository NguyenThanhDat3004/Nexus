import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { AppConfig } from '../../config/configuration';

export function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}

@Injectable()
export class InternalTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const header = context.switchToHttp().getRequest<Request>().headers['x-internal-token'];
    const provided = Array.isArray(header) ? header[0] : header;
    if (!provided || !safeEqual(provided, this.config.get('internalToken', { infer: true }))) {
      throw new UnauthorizedException('INVALID_INTERNAL_TOKEN');
    }
    return true;
  }
}