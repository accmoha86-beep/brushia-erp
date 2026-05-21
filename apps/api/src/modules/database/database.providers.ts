import { Inject } from '@nestjs/common';

/**
 * Inject the raw pg.Pool from DATABASE_RAW_POOL provider.
 * Used by SaleTransactionOrchestrator for direct SQL queries.
 */
export const DATABASE_POOL = 'DATABASE_RAW_POOL';
export const InjectPool = () => Inject('DATABASE_RAW_POOL');
