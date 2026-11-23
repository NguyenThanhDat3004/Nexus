import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';

/**
 * Map an upstream GitHub/Jira HTTP status to the matching NestJS exception.
 *
 * 401 -> UnauthorizedException, 429 -> HttpException(429),
 * any other status -> HttpException with that exact status.
 *
 * Purpose: a rate-limit (429) must surface as 429, never as 401,
 * so the team can tell "hết limit" apart from "token hết hạn / bị thu hồi".
 *
 * Note: TooManyRequestsException only exists in NestJS 11; this project
 * is on NestJS 10.4, so 429 uses HttpException + HttpStatus.TOO_MANY_REQUESTS.
 */
export function throwUpstreamError(status: number, message: string): never {
  if (status === 401) throw new UnauthorizedException(message);
  if (status === 429) throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
  throw new HttpException(message, status);
}
