-- Migration 0005: Accounting Domain
-- Schema: accounting
-- Tables: fiscal_years, fiscal_periods, chart_of_accounts, 
--         journal_entries, journal_entry_lines, tax_rates,
--         bank_accounts, bank_transactions, bank_reconciliations

SET search_path TO accounting, shared, public;

-- ─── Fiscal Years ────────────────────────────────────────
CREATE TABLE accounting.fiscal_years (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    name            VARCHAR(50) NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'closing', 'closed')),
    is_current      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name),
    CHECK (end_date > start_date)
);

-- ─── Fiscal Periods (Monthly) ────────────────────────────
CREATE TABLE accounting.fiscal_periods (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    fiscal_year_id  UUID NOT NULL REFERENCES accounting.fiscal_years(id),
    period_number   INTEGER NOT NULL CHECK (period_number BETWEEN 1 AND 13), -- 13 = adjusting
    name            VARCHAR(50) NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'closed', 'adjusting')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, fiscal_year_id, period_number)
);

-- ─── Chart of Accounts ──────────────────────────────────
CREATE TABLE accounting.chart_of_accounts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    parent_id       UUID REFERENCES accounting.chart_of_accounts(id),
    
    account_code    VARCHAR(20) NOT NULL,
    name            VARCHAR(150) NOT NULL,
    name_ar         VARCHAR(150),
    
    account_type    VARCHAR(30) NOT NULL
                    CHECK (account_type IN (
                        'asset', 'contra_asset',
                        'liability', 'contra_liability',
                        'equity',
                        'revenue', 'contra_revenue',
                        'expense',
                        'cost_of_goods_sold'
                    )),
    
    -- Classification
    is_header       BOOLEAN NOT NULL DEFAULT false,  -- Group header, not postable
    is_postable     BOOLEAN NOT NULL DEFAULT true,
    normal_balance  VARCHAR(6) NOT NULL CHECK (normal_balance IN ('debit', 'credit')),
    
    -- Sub-classification
    sub_type        VARCHAR(30),  -- 'cash', 'bank', 'receivable', 'payable', etc.
    
    -- Currency
    currency        VARCHAR(3) NOT NULL DEFAULT 'EGP',
    
    -- Status
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_system       BOOLEAN NOT NULL DEFAULT false,  -- Cannot be deleted
    
    -- Running balance (denormalized for performance)
    balance         BIGINT NOT NULL DEFAULT 0,  -- Minor units
    
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, account_code)
);

CREATE INDEX idx_coa_parent ON accounting.chart_of_accounts(tenant_id, parent_id);
CREATE INDEX idx_coa_type ON accounting.chart_of_accounts(tenant_id, account_type);

-- ─── Journal Entries ─────────────────────────────────────
CREATE TABLE accounting.journal_entries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    entry_number    VARCHAR(30) NOT NULL,
    fiscal_period_id UUID REFERENCES accounting.fiscal_periods(id),
    
    entry_date      DATE NOT NULL,
    
    entry_type      VARCHAR(20) NOT NULL DEFAULT 'standard'
                    CHECK (entry_type IN (
                        'standard', 'adjusting', 'closing', 'reversing', 'auto'
                    )),
    
    -- Source
    source_module   VARCHAR(30),  -- 'sales', 'purchasing', 'inventory', 'banking', 'manual'
    source_type     VARCHAR(30),  -- 'sales_order', 'purchase_order', 'stock_movement'
    source_id       UUID,
    
    description     TEXT NOT NULL,
    
    -- Totals (must balance)
    total_debit     BIGINT NOT NULL DEFAULT 0,
    total_credit    BIGINT NOT NULL DEFAULT 0,
    
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'posted', 'voided')),
    
    posted_at       TIMESTAMPTZ,
    posted_by       UUID REFERENCES iam.users(id),
    voided_at       TIMESTAMPTZ,
    voided_by       UUID REFERENCES iam.users(id),
    void_reason     TEXT,
    
    -- Reversal
    reversed_by_id  UUID REFERENCES accounting.journal_entries(id),
    reversal_of_id  UUID REFERENCES accounting.journal_entries(id),
    
    created_by      UUID NOT NULL REFERENCES iam.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Idempotency
    idempotency_key VARCHAR(100),
    UNIQUE(tenant_id, idempotency_key),
    UNIQUE(tenant_id, entry_number),
    
    -- INVARIANT: Debits must equal credits
    CHECK (total_debit = total_credit)
);

CREATE INDEX idx_je_date ON accounting.journal_entries(tenant_id, entry_date DESC);
CREATE INDEX idx_je_source ON accounting.journal_entries(tenant_id, source_module, source_type, source_id);
CREATE INDEX idx_je_period ON accounting.journal_entries(tenant_id, fiscal_period_id);

-- ─── Journal Entry Lines ─────────────────────────────────
CREATE TABLE accounting.journal_entry_lines (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    journal_entry_id UUID NOT NULL REFERENCES accounting.journal_entries(id) ON DELETE CASCADE,
    
    line_number     INTEGER NOT NULL,
    account_id      UUID NOT NULL REFERENCES accounting.chart_of_accounts(id),
    
    description     TEXT,
    
    debit_amount    BIGINT NOT NULL DEFAULT 0 CHECK (debit_amount >= 0),
    credit_amount   BIGINT NOT NULL DEFAULT 0 CHECK (credit_amount >= 0),
    
    -- Cannot have both debit and credit on same line
    CHECK (NOT (debit_amount > 0 AND credit_amount > 0)),
    -- Must have at least one
    CHECK (debit_amount > 0 OR credit_amount > 0),
    
    -- Optional dimensions for reporting
    cost_center     VARCHAR(50),
    department      VARCHAR(50),
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jel_entry ON accounting.journal_entry_lines(tenant_id, journal_entry_id);
CREATE INDEX idx_jel_account ON accounting.journal_entry_lines(tenant_id, account_id);

-- ─── Tax Rates ───────────────────────────────────────────
CREATE TABLE accounting.tax_rates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    name            VARCHAR(50) NOT NULL,
    name_ar         VARCHAR(50),
    rate            NUMERIC(5,2) NOT NULL,
    tax_type        VARCHAR(20) NOT NULL DEFAULT 'vat'
                    CHECK (tax_type IN ('vat', 'sales_tax', 'withholding', 'customs', 'exempt')),
    is_default      BOOLEAN NOT NULL DEFAULT false,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    account_id      UUID REFERENCES accounting.chart_of_accounts(id), -- Tax liability account
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);

-- ─── Bank Accounts ───────────────────────────────────────
CREATE TABLE accounting.bank_accounts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    account_id      UUID NOT NULL REFERENCES accounting.chart_of_accounts(id), -- Linked GL account
    
    bank_name       VARCHAR(100) NOT NULL,
    account_name    VARCHAR(100) NOT NULL,
    account_number  VARCHAR(50),
    iban            VARCHAR(34),
    swift_code      VARCHAR(11),
    
    account_type    VARCHAR(20) NOT NULL DEFAULT 'checking'
                    CHECK (account_type IN ('checking', 'savings', 'cash', 'mobile_wallet', 'digital')),
    currency        VARCHAR(3) NOT NULL DEFAULT 'EGP',
    
    -- Balance
    current_balance BIGINT NOT NULL DEFAULT 0,
    last_reconciled_at TIMESTAMPTZ,
    last_reconciled_balance BIGINT,
    
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Bank Transactions ───────────────────────────────────
CREATE TABLE accounting.bank_transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    bank_account_id UUID NOT NULL REFERENCES accounting.bank_accounts(id),
    
    transaction_date DATE NOT NULL,
    value_date       DATE,
    
    transaction_type VARCHAR(20) NOT NULL
                    CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'fee', 'interest', 'adjustment')),
    
    amount          BIGINT NOT NULL,  -- Positive = in, Negative = out
    balance_after   BIGINT NOT NULL,
    
    description     TEXT,
    reference       VARCHAR(100),
    
    -- Reconciliation
    is_reconciled   BOOLEAN NOT NULL DEFAULT false,
    reconciled_at   TIMESTAMPTZ,
    journal_entry_id UUID REFERENCES accounting.journal_entries(id),
    
    -- Source reference
    source_type     VARCHAR(30),
    source_id       UUID,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bank_tx_account ON accounting.bank_transactions(tenant_id, bank_account_id, transaction_date DESC);
CREATE INDEX idx_bank_tx_unreconciled ON accounting.bank_transactions(tenant_id, bank_account_id)
    WHERE is_reconciled = false;

-- ─── Bank Reconciliations ────────────────────────────────
CREATE TABLE accounting.bank_reconciliations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    bank_account_id UUID NOT NULL REFERENCES accounting.bank_accounts(id),
    
    statement_date  DATE NOT NULL,
    statement_balance BIGINT NOT NULL,
    system_balance  BIGINT NOT NULL,
    difference      BIGINT NOT NULL DEFAULT 0,
    
    status          VARCHAR(20) NOT NULL DEFAULT 'in_progress'
                    CHECK (status IN ('in_progress', 'completed', 'voided')),
    
    reconciled_by   UUID REFERENCES iam.users(id),
    completed_at    TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Safety: Posted JE cannot be modified ────────────────
CREATE OR REPLACE FUNCTION accounting.protect_posted_je()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'posted' AND NEW.status != 'voided' THEN
        RAISE EXCEPTION 'Cannot modify a posted journal entry (%). Void it first.', OLD.entry_number;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_posted BEFORE UPDATE ON accounting.journal_entries
    FOR EACH ROW EXECUTE FUNCTION accounting.protect_posted_je();

-- ─── Safety: JE lines must balance ──────────────────────
CREATE OR REPLACE FUNCTION accounting.validate_je_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_total_debit BIGINT;
    v_total_credit BIGINT;
BEGIN
    SELECT COALESCE(SUM(debit_amount), 0), COALESCE(SUM(credit_amount), 0)
    INTO v_total_debit, v_total_credit
    FROM accounting.journal_entry_lines
    WHERE journal_entry_id = NEW.journal_entry_id;
    
    -- Update parent totals
    UPDATE accounting.journal_entries
    SET total_debit = v_total_debit,
        total_credit = v_total_credit,
        updated_at = now()
    WHERE id = NEW.journal_entry_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_je_totals AFTER INSERT OR UPDATE OR DELETE ON accounting.journal_entry_lines
    FOR EACH ROW EXECUTE FUNCTION accounting.validate_je_balance();

-- ─── RLS ─────────────────────────────────────────────────
ALTER TABLE accounting.fiscal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.fiscal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.bank_reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_iso ON accounting.fiscal_years USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON accounting.fiscal_periods USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON accounting.chart_of_accounts USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON accounting.journal_entries USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON accounting.journal_entry_lines USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON accounting.tax_rates USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON accounting.bank_accounts USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON accounting.bank_transactions USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON accounting.bank_reconciliations USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ─── Triggers ────────────────────────────────────────────
CREATE TRIGGER set_updated_at BEFORE UPDATE ON accounting.chart_of_accounts
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON accounting.journal_entries
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON accounting.bank_accounts
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
