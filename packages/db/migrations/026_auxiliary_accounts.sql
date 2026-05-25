-- Migration 026: Auxiliary Accounts (حسابات مساعدة)
-- Sub-ledgers for customers, vendors, bank accounts, and employees
-- Enables: customer statements, vendor statements, bank reconciliation

-- 1. Auxiliary accounts table (sub-ledger entries)
CREATE TABLE IF NOT EXISTS accounting.auxiliary_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  account_id UUID NOT NULL REFERENCES accounting.chart_of_accounts(id),
  entity_type VARCHAR(30) NOT NULL CHECK (entity_type IN ('customer', 'vendor', 'employee', 'bank')),
  entity_id UUID NOT NULL,
  entity_name VARCHAR(200) NOT NULL,
  entity_name_ar VARCHAR(200),
  code VARCHAR(30),
  opening_balance BIGINT NOT NULL DEFAULT 0,
  current_balance BIGINT NOT NULL DEFAULT 0,
  credit_limit BIGINT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, account_id, entity_type, entity_id)
);

-- 2. Bank accounts table (detailed bank info)
CREATE TABLE IF NOT EXISTS accounting.bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  auxiliary_id UUID REFERENCES accounting.auxiliary_accounts(id),
  bank_name VARCHAR(200) NOT NULL,
  bank_name_ar VARCHAR(200),
  account_number VARCHAR(50),
  iban VARCHAR(50),
  swift_code VARCHAR(20),
  branch_name VARCHAR(100),
  currency VARCHAR(3) NOT NULL DEFAULT 'EGP',
  account_type VARCHAR(30) NOT NULL DEFAULT 'current' CHECK (account_type IN ('current', 'savings', 'e-wallet')),
  opening_balance BIGINT NOT NULL DEFAULT 0,
  current_balance BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, account_number)
);

-- 3. Add auxiliary_account_id to journal_lines for sub-ledger tracking
ALTER TABLE accounting.journal_lines
  ADD COLUMN IF NOT EXISTS auxiliary_account_id UUID REFERENCES accounting.auxiliary_accounts(id);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_aux_accounts_tenant ON accounting.auxiliary_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_aux_accounts_entity ON accounting.auxiliary_accounts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_tenant ON accounting.bank_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_aux ON accounting.journal_lines(auxiliary_account_id);

-- 5. Seed auxiliary accounts from existing data

-- Customer sub-ledgers (linked to Accounts Receivable account 1010)
INSERT INTO accounting.auxiliary_accounts (tenant_id, account_id, entity_type, entity_id, entity_name, code)
SELECT 
  c.tenant_id,
  (SELECT id FROM accounting.chart_of_accounts WHERE account_number = '1010' AND tenant_id = c.tenant_id LIMIT 1),
  'customer',
  c.id,
  CONCAT(c.first_name, ' ', c.last_name),
  'CUS-' || ROW_NUMBER() OVER (ORDER BY c.created_at)
FROM sales.customers c
WHERE c.tenant_id = 'a0000000-0000-0000-0000-000000000001'
  AND EXISTS (SELECT 1 FROM accounting.chart_of_accounts WHERE account_number = '1010' AND tenant_id = c.tenant_id)
ON CONFLICT DO NOTHING;

-- Vendor sub-ledgers (linked to Accounts Payable account 2100)
INSERT INTO accounting.auxiliary_accounts (tenant_id, account_id, entity_type, entity_id, entity_name, entity_name_ar, code)
SELECT 
  v.tenant_id,
  (SELECT id FROM accounting.chart_of_accounts WHERE account_number = '2100' AND tenant_id = v.tenant_id LIMIT 1),
  'vendor',
  v.id,
  v.name,
  v.name,
  'VEN-' || ROW_NUMBER() OVER (ORDER BY v.created_at)
FROM purchasing.vendors v
WHERE v.tenant_id = 'a0000000-0000-0000-0000-000000000001'
  AND EXISTS (SELECT 1 FROM accounting.chart_of_accounts WHERE account_number = '2100' AND tenant_id = v.tenant_id)
ON CONFLICT DO NOTHING;

-- 6. Seed bank accounts for Egypt
INSERT INTO accounting.bank_accounts (tenant_id, bank_name, bank_name_ar, account_number, account_type, currency) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Commercial International Bank (CIB)', 'البنك التجاري الدولي', 'CIB-001', 'current', 'EGP'),
  ('a0000000-0000-0000-0000-000000000001', 'National Bank of Egypt (NBE)', 'البنك الأهلي المصري', 'NBE-001', 'current', 'EGP'),
  ('a0000000-0000-0000-0000-000000000001', 'Vodafone Cash Wallet', 'محفظة فودافون كاش', 'VC-001', 'e-wallet', 'EGP'),
  ('a0000000-0000-0000-0000-000000000001', 'InstaPay', 'إنستاباي', 'IP-001', 'e-wallet', 'EGP')
ON CONFLICT DO NOTHING;

-- Link bank accounts to auxiliary accounts (under Cash & Bank account 1000)
INSERT INTO accounting.auxiliary_accounts (tenant_id, account_id, entity_type, entity_id, entity_name, entity_name_ar, code)
SELECT 
  ba.tenant_id,
  (SELECT id FROM accounting.chart_of_accounts WHERE account_number = '1000' AND tenant_id = ba.tenant_id LIMIT 1),
  'bank',
  ba.id,
  ba.bank_name,
  ba.bank_name_ar,
  'BNK-' || ROW_NUMBER() OVER (ORDER BY ba.created_at)
FROM accounting.bank_accounts ba
WHERE ba.tenant_id = 'a0000000-0000-0000-0000-000000000001'
  AND EXISTS (SELECT 1 FROM accounting.chart_of_accounts WHERE account_number = '1000' AND tenant_id = ba.tenant_id)
ON CONFLICT DO NOTHING;

-- Track migration
INSERT INTO public.migrations (name, applied_at) 
VALUES ('026_auxiliary_accounts', NOW())
ON CONFLICT DO NOTHING;
