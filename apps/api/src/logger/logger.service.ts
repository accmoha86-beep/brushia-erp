import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import pino from 'pino';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: pino.Logger;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL ?? 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:HH:MM:ss.l',
                ignore: 'pid,hostname',
                singleLine: false,
              },
            }
          : undefined,
      // Production: structured JSON logs
      ...(process.env.NODE_ENV === 'production' && {
        formatters: {
          level: (label: string) => ({ level: label }),
          bindings: () => ({}),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
      base: {
        service: 'bloom-api',
        env: process.env.NODE_ENV,
      },
    });
  }

  log(message: string, context?: string): void {
    this.logger.info({ context }, message);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error({ context, trace }, message);
  }

  warn(message: string, context?: string): void {
    this.logger.warn({ context }, message);
  }

  debug(message: string, context?: string): void {
    this.logger.debug({ context }, message);
  }

  verbose(message: string, context?: string): void {
    this.logger.trace({ context }, message);
  }

  /** Structured log with metadata */
  logWithMeta(level: 'info' | 'warn' | 'error' | 'debug', meta: Record<string, unknown>, message: string): void {
    this.logger[level](meta, message);
  }

  /** Get child logger with bound fields */
  child(bindings: Record<string, unknown>): pino.Logger {
    return this.logger.child(bindings);
  }
}
