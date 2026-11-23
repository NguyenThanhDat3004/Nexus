import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { fail } from './api-response';

type HttpErrorBody = { message?: string | string[] };
type EmittingClient = { emit(event: string, payload: unknown): unknown };

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, message, errors } = this.describe(exception);
    if (host.getType() === 'ws') {
      host.switchToWs().getClient<EmittingClient>().emit('exception', fail(status, message, errors));
      return;
    }
    if (host.getType() !== 'http') return;
    const response = host.switchToHttp().getResponse<Response>();
    if (response.headersSent) return; // lỗi giữa chừng một stream SSE
    response.status(status).json(fail(status, message, errors));
  }

  private describe(exception: unknown): { status: number; message: string; errors?: string[] } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const raw = typeof body === 'string' ? body : (body as HttpErrorBody).message;
      if (Array.isArray(raw)) return { status, message: 'VALIDATION_FAILED', errors: raw };
      return { status, message: raw ?? exception.message };
    }
    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'INTERNAL_ERROR' };
  }
}