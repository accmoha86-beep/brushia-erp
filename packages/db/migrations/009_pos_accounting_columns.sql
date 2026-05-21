-- Migration 009: POS session columns + Accounting column aliases

-- ── POS: sessions — code uses cashier_id, session_number, opening_cash, current_cash ──
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS session_number VARCHAR(30);
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS cashier_id UUID;
UPDATE pos.sessions SET cashier_id = user_id WHERE cashier_id IS NULL;
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS opening_cash BIGINT DEFAULT 0;
UPDATE pos.sessions SET opening_cash = opening_balance WHERE opening_cash = 0;
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS current_cash BIGINT DEFAULT 0;
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS closing_cash BIGINT;

-- ── Accounting: journal_lines — code references tenant_id ──
ALTER TABLE accounting.journal_lines ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE accounting.journal_lines ADD COLUMN IF NOT EXISTS journal_entry_id UUID;
UPDATE accounting.journal_lines SET journal_entry_id = entry_id WHERE journal_entry_id IS NULL;

-- ── Accounting: journal_entries — code uses entry_date, source ──
ALTER TABLE accounting.journal_entries ADD COLUMN IF NOT EXISTS entry_date DATE;
UPDATE accounting.journal_entries SET entry_date = date WHERE entry_date IS NULL;
ALTER TABLE accounting.journal_entries ADD COLUMN IF NOT EXISTS source VARCHAR(30);
UPDATE accounting.journal_entries SET source = reference_type WHERE source IS NULL;

-- ── Sales: customers — add name computed column or plain column ──
ALTER TABLE sales.customers ADD COLUMN IF NOT EXISTS name VARCHAR(200);
UPDATE sales.customers SET name = CONCAT(first_name, ' ', COALESCE(last_name, '')) WHERE name IS NULL;

-- ── POS: sessions close columns ──
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS expected_cash BIGINT;
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS cash_difference BIGINT;
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS total_sales BIGINT DEFAULT 0;
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS total_refunds BIGINT DEFAULT 0;
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS transaction_count INTEGER DEFAULT 0;
ALTER TABLE pos.sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
