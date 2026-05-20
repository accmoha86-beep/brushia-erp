import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { validateApiEnv } from '@brushia/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { LoggerService } from './logger/logger.service';

async function bootstrap(): Promise<void> {
  // ─── Validate Environment (fail fast) ───
  const env = validateApiEnv();

  // ─── Create Application ───
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // ─── Security ───
  app.use(helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false,
  }));
  app.use(compression());

  // ─── CORS ───
  app.enableCors({
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
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

  // ─── Global Filters ───
  app.useGlobalFilters(
    new AllExceptionsFilter(logger),
    new HttpExceptionFilter(logger),
  );

  // ─── Global Interceptors ───
  app.useGlobalInterceptors(
    new LoggingInterceptor(logger),
    new TransformInterceptor(),
  );

  // ─── Swagger (non-production) ───
  if (env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Brushia ERP API')
      .setDescription('Enterprise Beauty & Cosmetics ERP Platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'X-Tenant-Id', in: 'header' }, 'tenant')
      .addServer(`http://localhost:${env.APP_PORT}`, 'Development')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`📚 Swagger docs: http://localhost:${env.APP_PORT}/docs`, 'Bootstrap');
  }

  // ─── Graceful Shutdown ───
  app.enableShutdownHooks();

  // ─── Start Server ───
  await app.listen(env.APP_PORT);

  logger.log(
    `🚀 Brushia ERP API running on port ${env.APP_PORT} [${env.NODE_ENV}]`,
    'Bootstrap',
  );
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start Brushia ERP API:', err);
  process.exit(1);
});
