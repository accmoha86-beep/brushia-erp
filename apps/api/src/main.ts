import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggerService } from './logger/logger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // ─── Security ───
  try {
    const helmet = (await import('helmet')).default;
    app.use(helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    }));
  } catch { /* helmet optional */ }

  try {
    const compression = (await import('compression')).default;
    app.use(compression());
  } catch { /* compression optional */ }

  // ─── CORS ───
  const corsOrigins = (process.env.CORS_ORIGINS || '*').split(',').map(o => o.trim());
  app.enableCors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id', 'X-Idempotency-Key', 'X-Correlation-Id'],
    exposedHeaders: ['X-Correlation-Id', 'X-RateLimit-Remaining'],
    maxAge: 86400,
  });

  // ─── API Versioning ───
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // ─── Global Prefix ───
  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/ready', 'health/live'],
  });

  // ─── Global Pipes ───
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );

  // ─── Swagger (non-production) ───
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Brushia ERP API')
      .setDescription('Enterprise Beauty & Cosmetics ERP Platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'X-Tenant-Id', in: 'header' }, 'tenant')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  // ─── Graceful Shutdown ───
  app.enableShutdownHooks();

  // ─── Start Server ───
  const port = process.env.PORT || process.env.APP_PORT || 3001;
  await app.listen(port);

  logger.log(
    `🚀 Brushia ERP API running on port ${port} [${process.env.NODE_ENV || 'development'}]`,
    'Bootstrap',
  );
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start Brushia ERP API:', err);
  process.exit(1);
});
