/**
 * Typed business error constructors.
 */

import type { AppError } from '../types/common.js';
import { ErrorCodes } from '../types/common.js';

export class BusinessError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'BusinessError';
  }

  toAppError(): AppError {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

// ─── Factory Functions ───

export function insufficientStock(productId: string, requested: number, available: number): BusinessError {
  return new BusinessError(
    ErrorCodes.INSUFFICIENT_STOCK,
    `Insufficient stock for product ${productId}: requested ${requested}, available ${available}`,
    409,
    { productId, requested, available },
  );
}

export function journalImbalanced(debitTotal: number, creditTotal: number): BusinessError {
  return new BusinessError(
    ErrorCodes.JOURNAL_IMBALANCED,
    `Journal entry is not balanced: debits=${debitTotal}, credits=${creditTotal}`,
    400,
    { debitTotal, creditTotal },
  );
}

export function fiscalPeriodClosed(periodId: string): BusinessError {
  return new BusinessError(
    ErrorCodes.FISCAL_PERIOD_CLOSED,
    `Fiscal period ${periodId} is closed and cannot accept new entries`,
    409,
    { periodId },
  );
}

export function notFound(entity: string, id: string): BusinessError {
  return new BusinessError(
    ErrorCodes.NOT_FOUND,
    `${entity} not found: ${id}`,
    404,
    { entity, id },
  );
}

export function unauthorized(message = 'Unauthorized'): BusinessError {
  return new BusinessError(ErrorCodes.UNAUTHORIZED, message, 401);
}

export function forbidden(message = 'Forbidden'): BusinessError {
  return new BusinessError(ErrorCodes.FORBIDDEN, message, 403);
}
