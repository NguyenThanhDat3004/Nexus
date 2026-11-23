import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { SSE_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { Observable, map } from 'rxjs';
import { ok } from './api-response';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http' || this.reflector.get(SSE_METADATA, context.getHandler())) return next.handle();
    const response = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(map((data: unknown) => ok(data ?? null, response.statusCode)));
  }
}