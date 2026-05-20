import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, headers } = request;
    const correlationId = headers['x-correlation-id'] ?? '-';
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          const response = context.switchToHttp().getResponse();
          this.logger.logWithMeta('info', {
            method,
            url,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
            correlationId,
          }, `${method} ${url} ${response.statusCode} ${duration}ms`);
        },
        error: (err) => {
          const duration = Date.now() - start;
          this.logger.logWithMeta('error', {
            method,
            url,
            duration: `${duration}ms`,
            correlationId,
            error: err.message,
          }, `${method} ${url} ERROR ${duration}ms`);
        },
      }),
    );
  }
}
