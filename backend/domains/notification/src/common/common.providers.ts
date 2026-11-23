import { Provider, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ApiExceptionFilter } from './http/api-exception.filter';
import { ResponseEnvelopeInterceptor } from './http/response-envelope.interceptor';

export const globalProviders: Provider[] = [
  // forbidNonWhitelisted: body có field lạ → 400 (chống mass assignment)
  { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }) },
  { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
  { provide: APP_FILTER, useClass: ApiExceptionFilter },
];