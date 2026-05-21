-- Migration 015: Complete Purchasing Module
-- Adds: goods_receipts, goods_receipt_items, vendor_bills, bill_payments
-- Adds: extra landed cost columns to purchase_orders

-- ─── Add landed cost breakdown columns to purchase_orders ─────
ALTER TABLE purchasing.purchase_orders ADD COLUMN IF NOT EXISTS china_shipping_cost BIGINT NOT NULL DEFAULT 0;
ALTER TABLE purchasing.purchase_orders ADD COLUMN IF NOT EXISTS china_agent_fee BIGINT NOT NULL DEFAULT 0;
ALTER TABLE purchasing.purchase_orders ADD COLUMN IF NOT EXISTS egypt_customs_duty BIGINT NOT NULL DEFAULT 0;
ALTER TABLE purchasing.purchase_orders ADD COLUMN IF NOT EXISTS egypt_clearance_fee BIGINT NOT NULL DEFAULT 0;
ALTER TABLE purchasing.purchase_orders ADD COLUMN IF NOT EXISTS egypt_local_shipping BIGINT NOT NULL DEFAULT 0;
ALTER TABLE purchasing.purchase_orders ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(10,4) NOT NULL DEFAULT 1.0;
ALTER TABLE purchasing.purchase_orders ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE purchasing.purchase_orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- ─── Goods Receipts ─────────────────────────────────
CREATE TABLE IF NOT EXISTS purchasing.goods_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
    receipt_number VARCHAR(30) NOT NULL,
    purchase_order_id UUID NOT NULL REFERENCES purchasing.purchase_orders(id),
    warehouse_id UUID NOT NULL,
    receipt_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    notes TEXT,
    received_by UUID NOT NULL,
    inspected_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, receipt_number)
);

CREATE TABLE IF NOT EXISTS purchasing.goods_receipt_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
    goods_receipt_id UUID NOT NULL REFERENCES purchasing.goods_receipts(id) ON DELETE CASCADE,
    po_item_id UUID NOT NULL REFERENCES purchasing.purchase_order_items(id),
    product_id UUID NOT NULL,
    variant_id UUID,
    quantity_received INTEGER NOT NULL DEFAULT 0,
    quantity_accepted INTEGER NOT NULL DEFAULT 0,
    quantity_rejected INTEGER NOT NULL DEFAULT 0,
    rejection_reason TEXT,
    unit_cost BIGINT NOT NULL DEFAULT 0,
    landed_unit_cost BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Vendor Bills ────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchasing.vendor_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
    bill_number VARCHAR(30) NOT NULL,
    vendor_id UUID NOT NULL REFERENCES purchasing.vendors(id),
    purchase_order_id UUID REFERENCES purchasing.purchase_orders(id),
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal BIGINT NOT NULL DEFAULT 0,
    tax_amount BIGINT NOT NULL DEFAULT 0,
    total BIGINT NOT NULL DEFAULT 0,
    amount_paid BIGINT NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'EGP',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, bill_number)
);

CREATE TABLE IF NOT EXISTS purchasing.bill_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
    bill_id UUID NOT NULL REFERENCES purchasing.vendor_bills(id),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount BIGINT NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    reference VARCHAR(100),
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Track migration
INSERT INTO public.migrations (name, applied_at) VALUES ('015_purchasing_complete', NOW()) ON CONFLICT DO NOTHING;
