/**
 * Shared constants used across the Brushia ERP platform.
 */

// ─── Egypt-specific ───
export const EGYPT_VAT_RATE = 14;
export const EGYPT_CURRENCY = 'EGP' as const;
export const EGYPT_TIMEZONE = 'Africa/Cairo';
export const EGYPT_LOCALE = 'en-EG';
export const EGYPT_PHONE_PREFIX = '+20';

export const GOVERNORATES = [
  'Cairo', 'Giza', 'Alexandria', 'Qalyubia',
  'Dakahlia', 'Sharqia', 'Gharbia', 'Monufia',
  'Beheira', 'Kafr El Sheikh', 'Damietta', 'Port Said',
  'Ismailia', 'Suez', 'North Sinai', 'South Sinai',
  'Red Sea', 'New Valley', 'Matrouh', 'Fayoum',
  'Beni Suef', 'Minya', 'Assiut', 'Sohag',
  'Qena', 'Luxor', 'Aswan',
] as const;

// ─── Business Rules ───
export const MAX_ORDER_ITEMS = 100;
export const MAX_PAYMENT_SPLITS = 5;
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
export const IDEMPOTENCY_KEY_TTL_HOURS = 24;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MINUTES = 15;

// ─── Loyalty Tiers ───
export const LOYALTY_TIERS = {
  bronze: { minPoints: 0, multiplier: 1.0, name: 'Bronze' },
  silver: { minPoints: 500, multiplier: 1.25, name: 'Silver' },
  gold: { minPoints: 2000, multiplier: 1.5, name: 'Gold' },
  platinum: { minPoints: 5000, multiplier: 2.0, name: 'Platinum' },
} as const;

// ─── Accounting ───
export const ACCOUNT_TYPES = [
  'asset', 'liability', 'equity', 'revenue', 'expense', 'contra',
] as const;

export const FISCAL_YEAR_START_MONTH = 1; // January for Egypt

// ─── POS ───
export const POS_OFFLINE_QUEUE_MAX = 500;
export const POS_SYNC_INTERVAL_MS = 30_000;
export const POS_RECEIPT_WIDTH_MM = 80;
