export const configuration = () => ({
  app: {
    name: process.env.APP_NAME ?? 'brushia-erp',
    port: parseInt(process.env.APP_PORT ?? '3001', 10),
    env: process.env.NODE_ENV ?? 'development',
    url: process.env.APP_URL ?? 'http://localhost:3001',
    webUrl: process.env.WEB_URL ?? 'http://localhost:3000',
    logLevel: process.env.LOG_LEVEL ?? 'info',
  },
  database: {
    url: process.env.DATABASE_URL,
    poolMin: parseInt(process.env.DATABASE_POOL_MIN ?? '2', 10),
    poolMax: parseInt(process.env.DATABASE_POOL_MAX ?? '10', 10),
    ssl: process.env.DATABASE_SSL === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? '',
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION ?? '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION ?? '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
  },
  cors: {
    origins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(','),
  },
  queue: {
    prefix: process.env.QUEUE_PREFIX ?? 'brushia',
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
  },
});
