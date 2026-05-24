-- Migration 017: Fix POS schema to match service layer
-- Adds missing columns, renames mismatched columns, creates missing tables

-- ═══════════════════════════════════════════════════════
-- 1. pos.sessions — add missing columns
-- ═══════════════════════════════════════════════════════
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS session_number VARCHAR(50);
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS cashier_id UUID;
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS opening_cash BIGINT NOT NULL DEFAULT 0;
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS closing_cash BIGINT;
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS current_cash BIGINT NOT NULL DEFAULT 0;
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS expected_cash BIGINT;
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS cash_difference BIGINT;
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS total_sales BIGINT DEFAULT 0;
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS total_transactions INTEGER DEFAULT 0;
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS total_cash_sales BIGINT DEFAULT 0;
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS total_card_sales BIGINT DEFAULT 0;
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS close_notes TEXT;
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Copy data from old columns to new columns
UPDATE pos.sessions SET cashier_id = user_id WHERE cashier_id IS NULL AND user_id IS NOT NULL;
UPDATE pos.sessions SET opening_cash = opening_balance WHERE opening_cash = 0 AND opening_balance != 0;
UPDATE pos.sessions SET closing_cash = closing_balance WHERE closing_cash IS NULL AND closing_balance IS NOT NULL;
UPDATE pos.sessions SET current_cash = opening_balance WHERE current_cash = 0 AND opening_balance != 0;
UPDATE pos.sessions SET expected_cash = expected_balance WHERE expected_cash IS NULL AND expected_balance IS NOT NULL;

-- ═══════════════════════════════════════════════════════
-- 2. pos.transactions — add receipt_number + rename columns
-- ═══════════════════════════════════════════════════════
ALTER TABLE pos.transactions ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(50);
ALTER TABLE pos.transactions ADD COLUMN IF NOT EXISTS discount_amount BIGINT NOT NULL DEFAULT 0;
ALTER TABLE pos.transactions ADD COLUMN IF NOT EXISTS tax_amount BIGINT NOT NULL DEFAULT 0;
ALTER TABLE pos.transactions ADD COLUMN IF NOT EXISTS grand_total BIGINT NOT NULL DEFAULT 0;

-- Copy from old columns
UPDATE pos.transactions SET receipt_number = transaction_number WHERE receipt_number IS NULL;
UPDATE pos.transactions SET discount_amount = discount_total WHERE discount_amount = 0 AND discount_total != 0;
UPDATE pos.transactions SET tax_amount = tax_total WHERE tax_amount = 0 AND tax_total != 0;
UPDATE pos.transactions SET grand_total = total WHERE grand_total = 0 AND total != 0;

-- ═══════════════════════════════════════════════════════
-- 3. pos.held_orders — add missing columns
-- ═══════════════════════════════════════════════════════
ALTER TABLE pos.held_orders ADD COLUMN IF NOT EXISTS hold_number VARCHAR(50);
ALTER TABLE pos.held_orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200);
ALTER TABLE pos.held_orders ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'held';
ALTER TABLE pos.held_orders ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE pos.held_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE pos.held_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ═══════════════════════════════════════════════════════
-- 4. pos.cash_movements — add reference column
-- ═══════════════════════════════════════════════════════
ALTER TABLE pos.cash_movements ADD COLUMN IF NOT EXISTS reference VARCHAR(200);

-- ═══════════════════════════════════════════════════════
-- 5. pos.transaction_payments — NEW TABLE
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pos.transaction_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  transaction_id UUID NOT NULL REFERENCES pos.transactions(id),
  method VARCHAR(30) NOT NULL,
  amount BIGINT NOT NULL DEFAULT 0,
  reference VARCHAR(200),
  tendered BIGINT,
  change_amount BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_txn_payments_txn ON pos.transaction_payments(transaction_id);

-- ═══════════════════════════════════════════════════════
-- 6. pos.daily_summaries — NEW TABLE
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pos.daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  register_id UUID NOT NULL REFERENCES pos.registers(id),
  summary_date DATE NOT NULL,
  session_id UUID,
  opening_cash BIGINT DEFAULT 0,
  closing_cash BIGINT DEFAULT 0,
  expected_cash BIGINT DEFAULT 0,
  cash_difference BIGINT DEFAULT 0,
  total_sales BIGINT DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  total_refunds BIGINT DEFAULT 0,
  cash_sales BIGINT DEFAULT 0,
  card_sales BIGINT DEFAULT 0,
  mobile_sales BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, register_id, summary_date)
);

-- ═══════════════════════════════════════════════════════
-- 7. pos.registers — add missing columns for createRegister
-- ═══════════════════════════════════════════════════════
ALTER TABLE pos.registers ADD COLUMN IF NOT EXISTS device_name VARCHAR(100);
ALTER TABLE pos.registers ADD COLUMN IF NOT EXISTS receipt_header TEXT;
ALTER TABLE pos.registers ADD COLUMN IF NOT EXISTS receipt_footer TEXT;

-- Track migration
INSERT INTO public.migrations (name, applied_at)
VALUES ('017_fix_pos_schema', NOW())
ON CONFLICT (name) DO NOTHING;
