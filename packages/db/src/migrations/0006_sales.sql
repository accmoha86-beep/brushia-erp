-- Migration 0006: Sales Domain
-- Schema: sales
-- Tables: sales_orders, sales_order_items, payments, returns, return_items,
--         invoices, invoice_items, credit_notes

SET search_path TO sales, shared, public;

-- ─── Sales Orders ────────────────────────────────────────
CREATE TABLE sales.sales_orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    order_number    VARCHAR(30) NOT NULL,
    order_date      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Customer
    customer_id     UUID,  -- References crm.customers
    customer_name   VARCHAR(200),
    customer_phone  VARCHAR(20),
    customer_email  VARCHAR(200),
    
    -- Source
    order_source    VARCHAR(20) NOT NULL DEFAULT 'pos'
                    CHECK (order_source IN ('pos', 'backoffice', 'whatsapp', 'exhibition', 'wholesale', 'online')),
    pos_session_id  UUID,  -- References pos.sessions
    exhibition_id   UUID,  -- References exhibitions.events
    
    -- Location
    warehouse_id    UUID,
    branch_name     VARCHAR(100),
    
    -- Pricing (all in minor units — piasters)
    subtotal        BIGINT NOT NULL DEFAULT 0,
    discount_amount BIGINT NOT NULL DEFAULT 0,
    discount_reason TEXT,
    tax_amount      BIGINT NOT NULL DEFAULT 0,
    shipping_amount BIGINT NOT NULL DEFAULT 0,
    total           BIGINT NOT NULL DEFAULT 0,
    
    -- Tax details
    tax_rate        NUMERIC(5,2) NOT NULL DEFAULT 14.00,
    tax_inclusive    BOOLEAN NOT NULL DEFAULT true,
    
    -- Status
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded')),
    payment_status  VARCHAR(20) NOT NULL DEFAULT 'unpaid'
                    CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded', 'overpaid')),
    fulfillment_status VARCHAR(20) NOT NULL DEFAULT 'unfulfilled'
                    CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled', 'returned')),
    
    -- Wholesale
    price_list_id   UUID,
    is_wholesale    BOOLEAN NOT NULL DEFAULT false,
    
    -- Salesperson / Commission
    salesperson_id  UUID,
    commission_rate NUMERIC(5,2),
    commission_amount BIGINT DEFAULT 0,
    
    -- Promotion applied
    promotion_id    UUID,
    promotion_code  VARCHAR(50),
    
    -- Loyalty
    loyalty_points_earned  INTEGER DEFAULT 0,
    loyalty_points_redeemed INTEGER DEFAULT 0,
    loyalty_discount BIGINT DEFAULT 0,
    
    -- Notes
    internal_notes  TEXT,
    customer_notes  TEXT,
    
    -- Audit
    created_by      UUID NOT NULL REFERENCES iam.users(id),
    updated_by      UUID REFERENCES iam.users(id),
    cancelled_by    UUID REFERENCES iam.users(id),
    cancelled_at    TIMESTAMPTZ,
    cancel_reason   TEXT,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Idempotency
    idempotency_key VARCHAR(100),
    UNIQUE(tenant_id, idempotency_key),
    UNIQUE(tenant_id, order_number)
);

CREATE INDEX idx_so_customer ON sales.sales_orders(tenant_id, customer_id);
CREATE INDEX idx_so_status ON sales.sales_orders(tenant_id, status, created_at DESC);
CREATE INDEX idx_so_date ON sales.sales_orders(tenant_id, order_date DESC);
CREATE INDEX idx_so_source ON sales.sales_orders(tenant_id, order_source);

-- ─── Sales Order Items ───────────────────────────────────
CREATE TABLE sales.sales_order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    sales_order_id  UUID NOT NULL REFERENCES sales.sales_orders(id) ON DELETE CASCADE,
    
    line_number     INTEGER NOT NULL,
    product_id      UUID NOT NULL,
    variant_id      UUID,
    sku             VARCHAR(50),
    product_name    VARCHAR(200) NOT NULL,
    variant_name    VARCHAR(200),
    
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    unit_price      BIGINT NOT NULL CHECK (unit_price >= 0),  -- Selling price
    unit_cost       BIGINT NOT NULL DEFAULT 0,  -- Cost at time of sale (for margin)
    
    discount_amount BIGINT NOT NULL DEFAULT 0,
    tax_amount      BIGINT NOT NULL DEFAULT 0,
    line_total      BIGINT NOT NULL DEFAULT 0,
    
    -- Fulfillment
    qty_fulfilled   INTEGER NOT NULL DEFAULT 0,
    qty_returned    INTEGER NOT NULL DEFAULT 0,
    
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_soi_order ON sales.sales_order_items(tenant_id, sales_order_id);
CREATE INDEX idx_soi_product ON sales.sales_order_items(tenant_id, product_id, variant_id);

-- ─── Payments ────────────────────────────────────────────
CREATE TABLE sales.payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    payment_number  VARCHAR(30) NOT NULL,
    payment_date    TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Reference
    reference_type  VARCHAR(30) NOT NULL CHECK (reference_type IN ('sales_order', 'invoice', 'return_refund')),
    reference_id    UUID NOT NULL,
    
    -- Amount
    amount          BIGINT NOT NULL CHECK (amount > 0),
    currency        VARCHAR(3) NOT NULL DEFAULT 'EGP',
    
    -- Method
    payment_method  VARCHAR(30) NOT NULL
                    CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'vodafone_cash', 'instapay', 'fawry', 'cod', 'store_credit', 'split')),
    
    -- Bank account link
    bank_account_id UUID,
    
    -- Split payment details
    split_details   JSONB,  -- [{method: 'cash', amount: 50000}, {method: 'card', amount: 30000}]
    
    -- Status
    status          VARCHAR(20) NOT NULL DEFAULT 'completed'
                    CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'voided')),
    
    -- Transaction reference
    external_ref    VARCHAR(100),
    
    -- Journal entry link
    journal_entry_id UUID,
    
    received_by     UUID REFERENCES iam.users(id),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, payment_number)
);

CREATE INDEX idx_payments_ref ON sales.payments(tenant_id, reference_type, reference_id);
CREATE INDEX idx_payments_date ON sales.payments(tenant_id, payment_date DESC);

-- ─── Returns ─────────────────────────────────────────────
CREATE TABLE sales.returns (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    return_number   VARCHAR(30) NOT NULL,
    sales_order_id  UUID NOT NULL REFERENCES sales.sales_orders(id),
    customer_id     UUID,
    
    return_date     TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    reason          VARCHAR(30) NOT NULL
                    CHECK (reason IN ('defective', 'wrong_item', 'changed_mind', 'damaged_shipping', 'quality_issue', 'expired', 'other')),
    reason_detail   TEXT,
    
    -- Amounts
    subtotal        BIGINT NOT NULL DEFAULT 0,
    tax_amount      BIGINT NOT NULL DEFAULT 0,
    total           BIGINT NOT NULL DEFAULT 0,
    
    -- Resolution
    resolution      VARCHAR(20) NOT NULL DEFAULT 'refund'
                    CHECK (resolution IN ('refund', 'exchange', 'store_credit', 'replacement')),
    refund_amount   BIGINT DEFAULT 0,
    store_credit_amount BIGINT DEFAULT 0,
    
    -- Status
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected')),
    
    -- Restock
    restock         BOOLEAN NOT NULL DEFAULT true,
    warehouse_id    UUID,
    
    processed_by    UUID REFERENCES iam.users(id),
    approved_by     UUID REFERENCES iam.users(id),
    approved_at     TIMESTAMPTZ,
    
    journal_entry_id UUID,
    
    created_by      UUID NOT NULL REFERENCES iam.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, return_number)
);

CREATE TABLE sales.return_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    return_id       UUID NOT NULL REFERENCES sales.returns(id) ON DELETE CASCADE,
    sales_order_item_id UUID REFERENCES sales.sales_order_items(id),
    
    product_id      UUID NOT NULL,
    variant_id      UUID,
    product_name    VARCHAR(200) NOT NULL,
    
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    unit_price      BIGINT NOT NULL,
    line_total      BIGINT NOT NULL,
    
    condition       VARCHAR(20) NOT NULL DEFAULT 'good'
                    CHECK (condition IN ('good', 'damaged', 'defective', 'opened', 'expired')),
    restocked       BOOLEAN NOT NULL DEFAULT false,
    
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Invoices ────────────────────────────────────────────
CREATE TABLE sales.invoices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    invoice_number  VARCHAR(30) NOT NULL,
    sales_order_id  UUID REFERENCES sales.sales_orders(id),
    customer_id     UUID,
    
    issue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date        DATE,
    
    -- Amounts
    subtotal        BIGINT NOT NULL DEFAULT 0,
    discount_amount BIGINT NOT NULL DEFAULT 0,
    tax_amount      BIGINT NOT NULL DEFAULT 0,
    total           BIGINT NOT NULL DEFAULT 0,
    amount_paid     BIGINT NOT NULL DEFAULT 0,
    amount_due      BIGINT GENERATED ALWAYS AS (total - amount_paid) STORED,
    
    -- Status
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'issued', 'sent', 'partial', 'paid', 'overdue', 'voided')),
    
    -- Egyptian tax compliance
    tax_registration_number VARCHAR(20),
    
    notes           TEXT,
    terms           TEXT,
    
    journal_entry_id UUID,
    
    created_by      UUID NOT NULL REFERENCES iam.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, invoice_number)
);

CREATE TABLE sales.invoice_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    invoice_id      UUID NOT NULL REFERENCES sales.invoices(id) ON DELETE CASCADE,
    
    product_id      UUID,
    variant_id      UUID,
    description     TEXT NOT NULL,
    
    quantity        INTEGER NOT NULL,
    unit_price      BIGINT NOT NULL,
    discount_amount BIGINT NOT NULL DEFAULT 0,
    tax_amount      BIGINT NOT NULL DEFAULT 0,
    line_total      BIGINT NOT NULL,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Credit Notes ────────────────────────────────────────
CREATE TABLE sales.credit_notes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    credit_note_number VARCHAR(30) NOT NULL,
    invoice_id      UUID REFERENCES sales.invoices(id),
    return_id       UUID REFERENCES sales.returns(id),
    customer_id     UUID,
    
    issue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    amount          BIGINT NOT NULL CHECK (amount > 0),
    
    reason          TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'issued'
                    CHECK (status IN ('draft', 'issued', 'applied', 'voided')),
    
    journal_entry_id UUID,
    
    created_by      UUID NOT NULL REFERENCES iam.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, credit_note_number)
);

-- ─── RLS ─────────────────────────────────────────────────
ALTER TABLE sales.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.credit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_iso ON sales.sales_orders USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON sales.sales_order_items USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON sales.payments USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON sales.returns USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON sales.return_items USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON sales.invoices USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON sales.invoice_items USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON sales.credit_notes USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON sales.sales_orders FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sales.returns FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sales.invoices FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
