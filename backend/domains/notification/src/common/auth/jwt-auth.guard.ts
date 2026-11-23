import { CanActivate, ExecutionContext, Injectable, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import { AccessTokenVerifier, AuthUser, extractBearerToken } from './access-token.verifier';

export type AuthenticatedRequest = Request & { user?: AuthUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly verifier: AccessTokenVerifier) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.user = await this.verifier.verify(extractBearerToken(request.headers.authorization));
    return true;
  }
}

/** user_id LUÔN lấy từ token, không bao giờ từ body/query (chống IDOR) */
export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext): AuthUser => {
  return context.switchToHttp().getRequest<AuthenticatedRequest>().user as AuthUser;
});