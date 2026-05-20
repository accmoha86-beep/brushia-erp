-- Migration 0008: Purchasing Domain
-- Schema: purchasing
-- Tables: vendors, purchase_orders, purchase_order_items,
--         goods_receipts, goods_receipt_items, vendor_bills, bill_payments

SET search_path TO purchasing, shared, public;

-- ─── Vendors ─────────────────────────────────────────────
CREATE TABLE purchasing.vendors (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    vendor_code     VARCHAR(20) NOT NULL,
    company_name    VARCHAR(200) NOT NULL,
    contact_name    VARCHAR(100),
    
    email           VARCHAR(200),
    phone           VARCHAR(20),
    whatsapp        VARCHAR(20),
    website         TEXT,
    
    -- Address
    address_line1   VARCHAR(200),
    city            VARCHAR(100),
    country         VARCHAR(2) NOT NULL DEFAULT 'CN',  -- Most suppliers from China
    
    -- Terms
    payment_terms   VARCHAR(30) DEFAULT 'net_30'
                    CHECK (payment_terms IN ('prepaid', 'cod', 'net_15', 'net_30', 'net_60', 'net_90')),
    default_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Rating
    rating          INTEGER CHECK (rating BETWEEN 1 AND 5),
    
    -- Financial
    tax_number      VARCHAR(50),
    gl_account_id   UUID,  -- References accounting.chart_of_accounts
    
    -- Status
    is_active       BOOLEAN NOT NULL DEFAULT true,
    
    notes           TEXT,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, vendor_code)
);

-- ─── Purchase Orders ─────────────────────────────────────
CREATE TABLE purchasing.purchase_orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    po_number       VARCHAR(30) NOT NULL,
    vendor_id       UUID NOT NULL REFERENCES purchasing.vendors(id),
    warehouse_id    UUID NOT NULL,
    
    order_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date   DATE,
    
    -- Amounts (minor units)
    subtotal        BIGINT NOT NULL DEFAULT 0,
    tax_amount      BIGINT NOT NULL DEFAULT 0,
    total           BIGINT NOT NULL DEFAULT 0,
    
    -- Landed cost breakdown
    china_shipping_cost BIGINT NOT NULL DEFAULT 0,
    china_agent_fee    BIGINT NOT NULL DEFAULT 0,
    egypt_customs_duty BIGINT NOT NULL DEFAULT 0,
    egypt_clearance_fee BIGINT NOT NULL DEFAULT 0,
    egypt_local_shipping BIGINT NOT NULL DEFAULT 0,
    other_costs        BIGINT NOT NULL DEFAULT 0,
    total_landed_cost  BIGINT NOT NULL DEFAULT 0,  -- subtotal + all extra costs
    
    -- Currency
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    exchange_rate   NUMERIC(10,4) NOT NULL DEFAULT 1.0,
    
    -- Status
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'submitted', 'approved', 'ordered', 'partial_received', 'received', 'cancelled', 'closed')),
    
    approved_by     UUID REFERENCES iam.users(id),
    approved_at     TIMESTAMPTZ,
    
    notes           TEXT,
    
    journal_entry_id UUID,
    
    created_by      UUID NOT NULL REFERENCES iam.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, po_number)
);

CREATE INDEX idx_po_vendor ON purchasing.purchase_orders(tenant_id, vendor_id);
CREATE INDEX idx_po_status ON purchasing.purchase_orders(tenant_id, status);
CREATE INDEX idx_po_date ON purchasing.purchase_orders(tenant_id, order_date DESC);

-- ─── Purchase Order Items ────────────────────────────────
CREATE TABLE purchasing.purchase_order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    purchase_order_id UUID NOT NULL REFERENCES purchasing.purchase_orders(id) ON DELETE CASCADE,
    
    product_id      UUID NOT NULL,
    variant_id      UUID,
    sku             VARCHAR(50),
    product_name    VARCHAR(200) NOT NULL,
    
    quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
    quantity_received INTEGER NOT NULL DEFAULT 0,
    
    unit_cost       BIGINT NOT NULL CHECK (unit_cost >= 0),
    total_cost      BIGINT NOT NULL DEFAULT 0,
    
    -- Landed cost per unit (calculated after allocation)
    landed_unit_cost BIGINT NOT NULL DEFAULT 0,
    
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_poi_po ON purchasing.purchase_order_items(tenant_id, purchase_order_id);

-- ─── Goods Receipts ──────────────────────────────────────
CREATE TABLE purchasing.goods_receipts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    receipt_number  VARCHAR(30) NOT NULL,
    purchase_order_id UUID NOT NULL REFERENCES purchasing.purchase_orders(id),
    warehouse_id    UUID NOT NULL,
    
    receipt_date    TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'inspecting', 'accepted', 'partial_accepted', 'rejected')),
    
    notes           TEXT,
    
    received_by     UUID NOT NULL REFERENCES iam.users(id),
    inspected_by    UUID REFERENCES iam.users(id),
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, receipt_number)
);

CREATE TABLE purchasing.goods_receipt_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    goods_receipt_id UUID NOT NULL REFERENCES purchasing.goods_receipts(id) ON DELETE CASCADE,
    po_item_id      UUID NOT NULL REFERENCES purchasing.purchase_order_items(id),
    
    product_id      UUID NOT NULL,
    variant_id      UUID,
    
    quantity_received INTEGER NOT NULL CHECK (quantity_received >= 0),
    quantity_accepted INTEGER NOT NULL DEFAULT 0,
    quantity_rejected INTEGER NOT NULL DEFAULT 0,
    
    rejection_reason TEXT,
    
    -- Cost
    unit_cost       BIGINT NOT NULL DEFAULT 0,
    landed_unit_cost BIGINT NOT NULL DEFAULT 0,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CHECK (quantity_accepted + quantity_rejected <= quantity_received)
);

-- ─── Vendor Bills ────────────────────────────────────────
CREATE TABLE purchasing.vendor_bills (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    bill_number     VARCHAR(30) NOT NULL,
    vendor_id       UUID NOT NULL REFERENCES purchasing.vendors(id),
    purchase_order_id UUID REFERENCES purchasing.purchase_orders(id),
    
    bill_date       DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date        DATE,
    
    subtotal        BIGINT NOT NULL DEFAULT 0,
    tax_amount      BIGINT NOT NULL DEFAULT 0,
    total           BIGINT NOT NULL DEFAULT 0,
    amount_paid     BIGINT NOT NULL DEFAULT 0,
    amount_due      BIGINT GENERATED ALWAYS AS (total - amount_paid) STORED,
    
    currency        VARCHAR(3) NOT NULL DEFAULT 'EGP',
    
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'pending', 'approved', 'partial', 'paid', 'overdue', 'voided')),
    
    journal_entry_id UUID,
    
    notes           TEXT,
    
    created_by      UUID NOT NULL REFERENCES iam.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, bill_number)
);

CREATE TABLE purchasing.bill_payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    bill_id         UUID NOT NULL REFERENCES purchasing.vendor_bills(id),
    
    payment_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    amount          BIGINT NOT NULL CHECK (amount > 0),
    payment_method  VARCHAR(30) NOT NULL,
    bank_account_id UUID,
    reference       VARCHAR(100),
    
    journal_entry_id UUID,
    
    created_by      UUID NOT NULL REFERENCES iam.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── RLS ─────────────────────────────────────────────────
ALTER TABLE purchasing.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchasing.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchasing.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchasing.goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchasing.goods_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchasing.vendor_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchasing.bill_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_iso ON purchasing.vendors USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON purchasing.purchase_orders USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON purchasing.purchase_order_items USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON purchasing.goods_receipts USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON purchasing.goods_receipt_items USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON purchasing.vendor_bills USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON purchasing.bill_payments USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON purchasing.vendors FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON purchasing.purchase_orders FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON purchasing.vendor_bills FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
