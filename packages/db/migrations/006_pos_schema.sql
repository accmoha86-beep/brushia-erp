-- Migration 006: Create POS schema and tables

CREATE SCHEMA IF NOT EXISTS pos;

CREATE TABLE IF NOT EXISTS pos.registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  branch_id UUID,
  location_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ip_address VARCHAR(50),
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS pos.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  register_id UUID NOT NULL REFERENCES pos.registers(id),
  user_id UUID NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opening_balance BIGINT NOT NULL DEFAULT 0,
  closing_balance BIGINT,
  expected_balance BIGINT,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  session_id UUID REFERENCES pos.sessions(id),
  order_id UUID,
  transaction_number VARCHAR(50) NOT NULL,
  type VARCHAR(30) NOT NULL DEFAULT 'sale',
  status VARCHAR(30) NOT NULL DEFAULT 'completed',
  subtotal BIGINT NOT NULL DEFAULT 0,
  discount_total BIGINT NOT NULL DEFAULT 0,
  tax_total BIGINT NOT NULL DEFAULT 0,
  total BIGINT NOT NULL DEFAULT 0,
  cost_total BIGINT NOT NULL DEFAULT 0,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(200),
  customer_id UUID,
  cashier_id UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, transaction_number)
);

CREATE TABLE IF NOT EXISTS pos.transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES pos.transactions(id),
  product_id UUID NOT NULL,
  variant_id UUID,
  product_name VARCHAR(300),
  product_sku VARCHAR(100),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price BIGINT NOT NULL DEFAULT 0,
  unit_cost BIGINT NOT NULL DEFAULT 0,
  discount BIGINT NOT NULL DEFAULT 0,
  tax BIGINT NOT NULL DEFAULT 0,
  line_total BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pos.held_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES pos.sessions(id),
  name VARCHAR(200),
  items JSONB NOT NULL DEFAULT '[]',
  customer_id UUID,
  notes TEXT,
  held_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retrieved_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS pos.cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES pos.sessions(id),
  type VARCHAR(20) NOT NULL,
  amount BIGINT NOT NULL,
  reason TEXT,
  performed_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Also add the permissions table missing columns
ALTER TABLE iam.permissions ADD COLUMN IF NOT EXISTS display_name VARCHAR(300);
ALTER TABLE iam.permissions ADD COLUMN IF NOT EXISTS display_group VARCHAR(200);
ALTER TABLE iam.permissions ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Also add quantity alias view for backward compatibility
-- Actually just add a `quantity` column alias if it doesn't exist
ALTER TABLE inventory.stock_levels ADD COLUMN IF NOT EXISTS quantity INTEGER GENERATED ALWAYS AS (qty_on_hand) STORED;
