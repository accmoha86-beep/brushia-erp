// Migrations 034-038 applied + sync June 2026 - clear import notes
import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggerService } from './logger/logger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // ─── Security ───
  try {
    const helmet = (await import('helmet')).default;
    app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  } catch { /* optional */ }
  try {
    const compression = (await import('compression')).default;
    app.use(compression());
  } catch { /* optional */ }

  // ─── CORS ───
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id', 'X-Idempotency-Key', 'X-Correlation-Id'],
  });

  // ─── Versioning ───
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // ─── Global Prefix ───
  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/(.*)'],
  });

  // No global ValidationPipe — Zod DTOs handle their own validation via @anatine/zod-nestjs

  // ─── Graceful Shutdown ───
  app.enableShutdownHooks();

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`🚀 Bloom ERP running on port ${port} [${process.env.NODE_ENV || 'development'}]`, 'Bootstrap');
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start:', err);
  process.exit(1);
});
