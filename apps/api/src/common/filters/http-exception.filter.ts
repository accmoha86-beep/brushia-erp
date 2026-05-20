import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../../logger/logger.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorBody = {
      success: false,
      error: {
        code: typeof exceptionResponse === 'object' && 'code' in exceptionResponse
          ? (exceptionResponse as Record<string, unknown>).code
          : `HTTP_${status}`,
        message: typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as Record<string, unknown>).message ?? exception.message,
        ...(typeof exceptionResponse === 'object' && 'details' in exceptionResponse
          ? { details: (exceptionResponse as Record<string, unknown>).details }
          : {}),
      },
      meta: {
        path: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
        correlationId: request.headers['x-correlation-id'] ?? null,
      },
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status}: ${exception.message}`,
        exception.stack,
        'HttpException',
      );
    }

    response.status(status).json(errorBody);
  }
}
