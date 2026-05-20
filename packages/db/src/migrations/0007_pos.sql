-- Migration 0007: POS Domain
-- Schema: pos
-- Tables: registers, sessions, transactions, held_orders, 
--         cash_movements, daily_summaries

SET search_path TO pos, shared, public;

-- ─── POS Registers ───────────────────────────────────────
CREATE TABLE pos.registers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    register_number VARCHAR(20) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    warehouse_id    UUID NOT NULL,  -- References inventory.warehouses
    
    -- Hardware
    receipt_printer VARCHAR(50),
    barcode_scanner VARCHAR(50),
    cash_drawer     BOOLEAN NOT NULL DEFAULT true,
    
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, register_number)
);

-- ─── POS Sessions ────────────────────────────────────────
CREATE TABLE pos.sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    register_id     UUID NOT NULL REFERENCES pos.registers(id),
    
    cashier_id      UUID NOT NULL REFERENCES iam.users(id),
    
    -- Cash
    opening_balance BIGINT NOT NULL DEFAULT 0,
    closing_balance BIGINT,
    expected_balance BIGINT,
    difference      BIGINT,
    
    -- Totals (calculated)
    total_sales     BIGINT NOT NULL DEFAULT 0,
    total_returns   BIGINT NOT NULL DEFAULT 0,
    total_discounts BIGINT NOT NULL DEFAULT 0,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    
    -- Payment method breakdown
    cash_total      BIGINT NOT NULL DEFAULT 0,
    card_total      BIGINT NOT NULL DEFAULT 0,
    wallet_total    BIGINT NOT NULL DEFAULT 0,
    
    -- Status
    status          VARCHAR(20) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'closing', 'closed', 'reconciled')),
    
    opened_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at       TIMESTAMPTZ,
    reconciled_at   TIMESTAMPTZ,
    reconciled_by   UUID REFERENCES iam.users(id),
    
    notes           TEXT,
    close_notes     TEXT,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_cashier ON pos.sessions(tenant_id, cashier_id, opened_at DESC);
CREATE INDEX idx_sessions_open ON pos.sessions(tenant_id) WHERE status = 'open';

-- ─── POS Transactions ────────────────────────────────────
-- Links POS actions to sales_orders
CREATE TABLE pos.transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    session_id      UUID NOT NULL REFERENCES pos.sessions(id),
    sales_order_id  UUID,  -- References sales.sales_orders
    
    transaction_type VARCHAR(20) NOT NULL
                    CHECK (transaction_type IN ('sale', 'return', 'exchange', 'void')),
    
    receipt_number  VARCHAR(30) NOT NULL,
    
    subtotal        BIGINT NOT NULL DEFAULT 0,
    discount        BIGINT NOT NULL DEFAULT 0,
    tax             BIGINT NOT NULL DEFAULT 0,
    total           BIGINT NOT NULL DEFAULT 0,
    
    -- Payment split
    payment_method  VARCHAR(30) NOT NULL,
    cash_tendered   BIGINT,
    change_given    BIGINT,
    split_payments  JSONB,
    
    -- Customer
    customer_id     UUID,
    customer_name   VARCHAR(200),
    
    -- Receipt
    receipt_printed BOOLEAN NOT NULL DEFAULT false,
    receipt_url     TEXT,
    
    voided          BOOLEAN NOT NULL DEFAULT false,
    void_reason     TEXT,
    voided_by       UUID REFERENCES iam.users(id),
    voided_at       TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, receipt_number)
);

CREATE INDEX idx_pos_tx_session ON pos.transactions(tenant_id, session_id);
CREATE INDEX idx_pos_tx_date ON pos.transactions(tenant_id, created_at DESC);

-- ─── Held Orders (Park & Recall) ─────────────────────────
CREATE TABLE pos.held_orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    session_id      UUID NOT NULL REFERENCES pos.sessions(id),
    
    hold_name       VARCHAR(100) NOT NULL,  -- Customer name or reference
    items           JSONB NOT NULL,  -- Serialized cart
    subtotal        BIGINT NOT NULL DEFAULT 0,
    
    customer_id     UUID,
    notes           TEXT,
    
    status          VARCHAR(20) NOT NULL DEFAULT 'held'
                    CHECK (status IN ('held', 'recalled', 'expired', 'cancelled')),
    
    held_by         UUID NOT NULL REFERENCES iam.users(id),
    recalled_at     TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Cash Movements ──────────────────────────────────────
CREATE TABLE pos.cash_movements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    session_id      UUID NOT NULL REFERENCES pos.sessions(id),
    
    movement_type   VARCHAR(20) NOT NULL
                    CHECK (movement_type IN ('cash_in', 'cash_out', 'float', 'pickup')),
    amount          BIGINT NOT NULL,
    reason          TEXT NOT NULL,
    
    performed_by    UUID NOT NULL REFERENCES iam.users(id),
    approved_by     UUID REFERENCES iam.users(id),
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Daily Summaries ─────────────────────────────────────
CREATE TABLE pos.daily_summaries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    register_id     UUID NOT NULL REFERENCES pos.registers(id),
    
    summary_date    DATE NOT NULL,
    
    total_sales     BIGINT NOT NULL DEFAULT 0,
    total_returns   BIGINT NOT NULL DEFAULT 0,
    total_discounts BIGINT NOT NULL DEFAULT 0,
    total_tax       BIGINT NOT NULL DEFAULT 0,
    net_sales       BIGINT NOT NULL DEFAULT 0,
    
    transaction_count INTEGER NOT NULL DEFAULT 0,
    avg_transaction BIGINT NOT NULL DEFAULT 0,
    
    cash_total      BIGINT NOT NULL DEFAULT 0,
    card_total      BIGINT NOT NULL DEFAULT 0,
    wallet_total    BIGINT NOT NULL DEFAULT 0,
    
    items_sold      INTEGER NOT NULL DEFAULT 0,
    unique_customers INTEGER NOT NULL DEFAULT 0,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, register_id, summary_date)
);

-- ─── RLS ─────────────────────────────────────────────────
ALTER TABLE pos.registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos.held_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos.daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_iso ON pos.registers USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON pos.sessions USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON pos.transactions USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON pos.held_orders USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON pos.cash_movements USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON pos.daily_summaries USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON pos.registers FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON pos.sessions FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
