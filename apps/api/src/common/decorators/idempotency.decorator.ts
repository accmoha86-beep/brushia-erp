import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENCY_KEY = 'IDEMPOTENCY';

/**
 * Mark an endpoint as idempotent.
 * The idempotency guard will check X-Idempotency-Key header.
 */
export const Idempotent = () => SetMetadata(IDEMPOTENCY_KEY, true);
