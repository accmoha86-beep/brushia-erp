-- Migration 0011: Expense Management
-- Schema: accounting (extension)

SET search_path TO accounting, shared, public;

CREATE TABLE accounting.expenses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    expense_number  VARCHAR(30) NOT NULL,
    expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Classification
    category        VARCHAR(50) NOT NULL
                    CHECK (category IN (
                        'shipping_china', 'shipping_local', 'customs_duty', 'clearance_fees',
                        'rent', 'utilities', 'salaries', 'marketing', 'packaging',
                        'equipment', 'software', 'insurance', 'maintenance', 'other'
                    )),
    
    account_id      UUID REFERENCES accounting.chart_of_accounts(id),
    vendor_id       UUID,
    
    description     TEXT NOT NULL,
    
    amount          BIGINT NOT NULL CHECK (amount > 0),
    tax_amount      BIGINT NOT NULL DEFAULT 0,
    total           BIGINT NOT NULL DEFAULT 0,
    
    payment_method  VARCHAR(30),
    bank_account_id UUID REFERENCES accounting.bank_accounts(id),
    
    -- Status
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'voided')),
    
    -- Attachments
    receipt_urls    TEXT[] DEFAULT '{}',
    
    journal_entry_id UUID REFERENCES accounting.journal_entries(id),
    
    approved_by     UUID REFERENCES iam.users(id),
    approved_at     TIMESTAMPTZ,
    
    created_by      UUID NOT NULL REFERENCES iam.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, expense_number)
);

CREATE INDEX idx_expenses_date ON accounting.expenses(tenant_id, expense_date DESC);
CREATE INDEX idx_expenses_category ON accounting.expenses(tenant_id, category);

ALTER TABLE accounting.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_iso ON accounting.expenses USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON accounting.expenses FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
