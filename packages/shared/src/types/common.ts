/**
 * Core shared types used across all Brushia ERP modules.
 * These types form the contract between frontend and backend.
 */

// ─── Identifiers ───
export type TenantId = string & { readonly __brand: 'TenantId' };
export type UserId = string & { readonly __brand: 'UserId' };
export type EntityId = string;

// ─── Result Pattern (no exceptions for business logic) ───
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

// ─── Error Types ───
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode?: number;
}

export const ErrorCodes = {
  // Auth
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  FORBIDDEN: 'AUTH_FORBIDDEN',
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',

  // Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resources
  NOT_FOUND: 'RESOURCE_NOT_FOUND',
  ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  CONFLICT: 'RESOURCE_CONFLICT',

  // Business Logic
  INSUFFICIENT_STOCK: 'INV_INSUFFICIENT_STOCK',
  JOURNAL_IMBALANCED: 'ACC_JOURNAL_IMBALANCED',
  FISCAL_PERIOD_CLOSED: 'ACC_FISCAL_PERIOD_CLOSED',
  PAYMENT_EXCEEDS_AMOUNT: 'SALES_PAYMENT_EXCEEDS',
  ORDER_NOT_CANCELLABLE: 'SALES_NOT_CANCELLABLE',

  // System
  INTERNAL_ERROR: 'SYSTEM_INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SYSTEM_UNAVAILABLE',
  RATE_LIMITED: 'SYSTEM_RATE_LIMITED',
  IDEMPOTENCY_CONFLICT: 'SYSTEM_IDEMPOTENCY_CONFLICT',
} as const;

// ─── Pagination ───
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── API Response Envelope ───
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: Record<string, unknown>;
  requestId?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  validationErrors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ─── Money (never use floating point for money) ───
export interface Money {
  /** Amount in minor units (piasters for EGP). 1 EGP = 100 piasters */
  amount: number;
  currency: CurrencyCode;
}

export type CurrencyCode = 'EGP' | 'USD' | 'EUR' | 'SAR';

// ─── Timestamps ───
export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface SoftDeletable {
  deletedAt: string | null;
}

// ─── Tenant-Scoped Entity ───
export interface TenantEntity extends Timestamps {
  id: EntityId;
  tenantId: TenantId;
}

// ─── Audit Metadata ───
export interface AuditMeta {
  userId: UserId;
  ip?: string;
  userAgent?: string;
  reason?: string;
}
