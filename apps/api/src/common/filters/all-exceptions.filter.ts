import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../../logger/logger.service';
import { BusinessError } from '@brushia/shared';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'SYSTEM_INTERNAL_ERROR';
    let message = 'An unexpected error occurred';

    // Handle BusinessError from shared package
    if (exception instanceof BusinessError) {
      status = exception.statusCode;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
        'AllExceptions',
      );
    }

    response.status(status).json({
      success: false,
      error: { code, message },
      meta: {
        path: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
        correlationId: request.headers['x-correlation-id'] ?? null,
      },
    });
  }
}
