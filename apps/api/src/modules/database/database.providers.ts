// ═══════════════════════════════════════════════════════════════════════════
// Database Providers — Pool injection for NestJS DI
// ═══════════════════════════════════════════════════════════════════════════
import { Inject } from '@nestjs/common';

export const DATABASE_POOL = 'DATABASE_POOL';

/**
 * Decorator for injecting the PostgreSQL connection pool.
 * Usage: constructor(@InjectPool() private readonly pool: Pool) {}
 */
export const InjectPool = () => Inject(DATABASE_POOL);
