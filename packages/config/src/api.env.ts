/**
 * API server environment validation.
 * Fails fast at startup if any required env var is missing or invalid.
 */

import { z } from 'zod';

const apiEnvSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  APP_NAME: z.string().default('brushia-erp'),
  APP_PORT: z.coerce.number().int().positive().default(3001),
  APP_URL: z.string().url().default('http://localhost:3001'),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).default('info'),

  // Database
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.coerce.number().int().positive().default(5432),
  DATABASE_NAME: z.string().default('brushia'),
  DATABASE_USER: z.string().default('brushia'),
  DATABASE_PASSWORD: z.string().min(1),
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  DATABASE_POOL_MIN: z.coerce.number().int().min(1).default(2),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).default(10),
  DATABASE_SSL: z.coerce.boolean().default(false),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Rate Limiting
  THROTTLE_TTL: z.coerce.number().int().positive().default(60),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),

  // Storage
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),

  // Queue
  QUEUE_PREFIX: z.string().default('brushia'),

  // Sentry
  SENTRY_DSN: z.string().optional(),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

let _env: ApiEnv | null = null;

export function validateApiEnv(): ApiEnv {
  if (_env) return _env;

  const result = apiEnvSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error('\n╔═══════════════════════════════════════════════╗');
    console.error('║  ❌ ENVIRONMENT VALIDATION FAILED              ║');
    console.error('╚═══════════════════════════════════════════════╝');
    console.error('\nMissing or invalid environment variables:\n');
    console.error(errors);
    console.error('\nCopy .env.example to .env and fill in values.\n');

    process.exit(1);
  }

  _env = result.data;
  return _env;
}

export function getApiEnv(): ApiEnv {
  if (!_env) {
    throw new Error('Environment not validated yet. Call validateApiEnv() first.');
  }
  return _env;
}
