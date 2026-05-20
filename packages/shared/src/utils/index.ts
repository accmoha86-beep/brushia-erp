/**
 * Pure utility functions shared across the platform.
 * No side effects, no external dependencies.
 */

import type { Money, CurrencyCode, PaginationParams } from '../types/common.js';

// ─── Money Helpers ───

/** Create a Money object from major units (e.g., 150.50 EGP → { amount: 15050, currency: 'EGP' }) */
export function toMoney(majorUnits: number, currency: CurrencyCode = 'EGP'): Money {
  return { amount: Math.round(majorUnits * 100), currency };
}

/** Convert Money to major units for display (e.g., { amount: 15050 } → 150.50) */
export function fromMoney(money: Money): number {
  return money.amount / 100;
}

/** Format Money for display (e.g., "EGP 1,500.00") */
export function formatMoney(money: Money): string {
  const major = money.amount / 100;
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);
}

/** Add two Money values (must be same currency) */
export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot add different currencies: ${a.currency} + ${b.currency}`);
  }
  return { amount: a.amount + b.amount, currency: a.currency };
}

/** Subtract Money (a - b) */
export function subtractMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot subtract different currencies`);
  }
  return { amount: a.amount - b.amount, currency: a.currency };
}

/** Multiply Money by a factor (e.g., quantity) */
export function multiplyMoney(money: Money, factor: number): Money {
  return { amount: Math.round(money.amount * factor), currency: money.currency };
}

/** Calculate VAT amount (EGP 100 × 14% = EGP 14) */
export function calculateVat(subtotal: Money, vatRate: number): Money {
  return { amount: Math.round(subtotal.amount * vatRate / 100), currency: subtotal.currency };
}

/** Zero money */
export function zeroMoney(currency: CurrencyCode = 'EGP'): Money {
  return { amount: 0, currency };
}

// ─── Pagination Helpers ───

export function normalizePagination(params: Partial<PaginationParams>): PaginationParams {
  return {
    page: Math.max(1, params.page ?? 1),
    limit: Math.min(100, Math.max(1, params.limit ?? 25)),
    sortBy: params.sortBy ?? 'createdAt',
    sortOrder: params.sortOrder ?? 'desc',
  };
}

export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

// ─── String Helpers ───

/** Generate a URL-safe slug */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Mask sensitive data (e.g., email → m****@gmail.com) */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '****';
  return local[0] + '****@' + domain;
}

/** Format Egyptian phone number */
export function formatEgyptPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('20')) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '+20' + cleaned.slice(1);
  }
  return '+20' + cleaned;
}

// ─── Date Helpers ───

/** Get Cairo timezone date string */
export function toCairoTime(date: Date = new Date()): string {
  return date.toLocaleString('en-EG', { timeZone: 'Africa/Cairo' });
}

/** Check if date is within fiscal period */
export function isInFiscalPeriod(date: Date, periodStart: Date, periodEnd: Date): boolean {
  return date >= periodStart && date <= periodEnd;
}
