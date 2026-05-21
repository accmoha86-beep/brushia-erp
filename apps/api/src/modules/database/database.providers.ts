import { Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/database.constants';

/**
 * Alias — maps DATABASE_POOL to DATABASE_CONNECTION
 * so the SaleTransactionOrchestrator can inject the pool.
 */
export const DATABASE_POOL = DATABASE_CONNECTION;
export const InjectPool = () => Inject(DATABASE_CONNECTION);
