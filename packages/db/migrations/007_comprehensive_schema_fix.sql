-- Migration 007: Comprehensive schema fix — align code with DB
-- Adds missing columns that code references but DB lacks

-- catalog.products: code uses parent_id for variant grouping
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES catalog.products(id);
CREATE INDEX IF NOT EXISTS idx_products_parent ON catalog.products(parent_id) WHERE parent_id IS NOT NULL;

-- sales.sales_orders: code uses cancel_reason, cancelled_at, source
ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS source VARCHAR(20);
-- Populate source from channel for existing rows
UPDATE sales.sales_orders SET source = channel WHERE source IS NULL;

-- sales.order_items: code uses tenant_id, line_number
ALTER TABLE sales.order_items ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE sales.order_items ADD COLUMN IF NOT EXISTS line_number INTEGER DEFAULT 1;
ALTER TABLE sales.order_items ADD COLUMN IF NOT EXISTS cost_price BIGINT DEFAULT 0;

-- Add cancel_reason, cancelled_at indexes
CREATE INDEX IF NOT EXISTS idx_sales_orders_cancelled ON sales.sales_orders(cancelled_at) WHERE cancelled_at IS NOT NULL;

-- Ensure stock_movements has warehouse_id as primary (location_id is optional alias)
-- Already has warehouse_id from migration 001

-- Done
