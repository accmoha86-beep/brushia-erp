-- Migration 012: Add remaining module tables
-- Commissions, Stock Counting, Exhibitions, WhatsApp Orders, Loyalty Tiers

-- ═══ HR Schema (Commissions) ═══
CREATE SCHEMA IF NOT EXISTS hr;

CREATE TABLE IF NOT EXISTS hr.salespersons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    employee_code VARCHAR(20) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(200),
    default_commission_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
    commission_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
    assigned_branches TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    total_sales BIGINT NOT NULL DEFAULT 0,
    total_commission BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, employee_code)
);

CREATE TABLE IF NOT EXISTS hr.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    salesperson_id UUID NOT NULL,
    sales_order_id UUID,
    order_total BIGINT NOT NULL DEFAULT 0,
    commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    commission_amount BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    payment_reference VARCHAR(100),
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hr.commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(20) NOT NULL DEFAULT 'flat',
    rate NUMERIC(5,2),
    tiers JSONB,
    category_rates JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══ Exhibitions Schema ═══
CREATE SCHEMA IF NOT EXISTS exhibitions;

CREATE TABLE IF NOT EXISTS exhibitions.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    event_code VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    venue VARCHAR(200),
    city VARCHAR(100),
    governorate VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget_amount BIGINT NOT NULL DEFAULT 0,
    actual_cost BIGINT NOT NULL DEFAULT 0,
    warehouse_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'planning',
    total_sales BIGINT NOT NULL DEFAULT 0,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_visitors INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, event_code)
);

CREATE TABLE IF NOT EXISTS exhibitions.event_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    event_id UUID NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    amount BIGINT NOT NULL DEFAULT 0,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══ WhatsApp Schema ═══
CREATE SCHEMA IF NOT EXISTS whatsapp;

CREATE TABLE IF NOT EXISTS whatsapp.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(200),
    customer_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    sales_order_id UUID,
    assigned_to UUID,
    last_message_at TIMESTAMPTZ,
    message_count INTEGER NOT NULL DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whatsapp.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    conversation_id UUID NOT NULL,
    direction VARCHAR(10) NOT NULL DEFAULT 'inbound',
    message_type VARCHAR(20) NOT NULL DEFAULT 'text',
    content TEXT,
    media_url TEXT,
    product_ids UUID[] DEFAULT '{}',
    sent_by UUID,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══ Stock Counting (inventory schema) ═══
CREATE TABLE IF NOT EXISTS inventory.stock_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    count_number VARCHAR(30) NOT NULL,
    warehouse_id UUID NOT NULL,
    count_type VARCHAR(20) NOT NULL DEFAULT 'full',
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    counted_by UUID,
    approved_by UUID,
    count_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    total_items INTEGER NOT NULL DEFAULT 0,
    total_variance INTEGER NOT NULL DEFAULT 0,
    variance_value BIGINT NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, count_number)
);

CREATE TABLE IF NOT EXISTS inventory.stock_count_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    stock_count_id UUID NOT NULL,
    product_id UUID NOT NULL,
    variant_id UUID,
    system_qty INTEGER NOT NULL DEFAULT 0,
    counted_qty INTEGER,
    variance INTEGER DEFAULT 0,
    unit_cost BIGINT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══ Stock Transfers (inventory schema) ═══
CREATE TABLE IF NOT EXISTS inventory.stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    transfer_number VARCHAR(30) NOT NULL,
    from_warehouse_id UUID NOT NULL,
    to_warehouse_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    requested_by UUID,
    approved_by UUID,
    notes TEXT,
    total_items INTEGER NOT NULL DEFAULT 0,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, transfer_number)
);

CREATE TABLE IF NOT EXISTS inventory.stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    transfer_id UUID NOT NULL,
    product_id UUID NOT NULL,
    variant_id UUID,
    quantity INTEGER NOT NULL DEFAULT 0,
    received_qty INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══ Loyalty Tiers (CRM schema) ═══
CREATE SCHEMA IF NOT EXISTS crm;

CREATE TABLE IF NOT EXISTS crm.loyalty_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(50) NOT NULL,
    min_points INTEGER NOT NULL DEFAULT 0,
    multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.00,
    benefits TEXT,
    color VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);

-- Add columns to loyalty_transactions if missing
ALTER TABLE crm.loyalty_transactions ADD COLUMN IF NOT EXISTS balance_after INTEGER DEFAULT 0;
ALTER TABLE crm.loyalty_transactions ADD COLUMN IF NOT EXISTS order_id UUID;
ALTER TABLE crm.loyalty_transactions ADD COLUMN IF NOT EXISTS created_by UUID;
