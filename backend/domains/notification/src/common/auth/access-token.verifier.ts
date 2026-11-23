import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AuthUser { userId: string }

export function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

@Injectable()
export class AccessTokenVerifier {
  constructor(private readonly jwt: JwtService) {}

  async verify(token: string | null | undefined): Promise<AuthUser> {
    if (!token) throw new UnauthorizedException('MISSING_ACCESS_TOKEN');
    let payload: { sub?: unknown };
    try {
      // Chỉ HS256 — chặn alg=none và tấn công đổi thuật toán
      payload = await this.jwt.verifyAsync(token, { algorithms: ['HS256'] });
    } catch {
      throw new UnauthorizedException('INVALID_ACCESS_TOKEN');
    }
    if (typeof payload.sub !== 'string' || payload.sub.length === 0) throw new UnauthorizedException('INVALID_ACCESS_TOKEN');
    return { userId: payload.sub };
  }
}