-- Migration 004: Safety net for any fixes that migration 003 might have missed
-- All statements are idempotent (IF NOT EXISTS / IF EXISTS)

-- Catalog fixes (if not already applied)
ALTER TABLE catalog.brands ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS allow_backorder BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE catalog.product_variants ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}';
ALTER TABLE catalog.product_variants ADD COLUMN IF NOT EXISTS weight_grams INTEGER;
ALTER TABLE catalog.product_variants ADD COLUMN IF NOT EXISTS barcode_type VARCHAR(20) DEFAULT 'EAN13';
ALTER TABLE catalog.product_variants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS catalog.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES catalog.product_variants(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  alt_text VARCHAR(255),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON catalog.product_images(product_id);

-- Inventory fixes
ALTER TABLE inventory.warehouses ADD COLUMN IF NOT EXISTS manager_id UUID;
ALTER TABLE inventory.stock_levels ADD COLUMN IF NOT EXISTS location_id UUID;
ALTER TABLE inventory.stock_levels ADD COLUMN IF NOT EXISTS last_counted_at TIMESTAMPTZ;
ALTER TABLE inventory.stock_movements ADD COLUMN IF NOT EXISTS location_id UUID;

CREATE TABLE IF NOT EXISTS inventory.stock_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  product_id UUID NOT NULL REFERENCES catalog.products(id),
  variant_id UUID REFERENCES catalog.product_variants(id),
  warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
  quantity INTEGER NOT NULL,
  reference_type VARCHAR(30) NOT NULL,
  reference_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_lookup ON inventory.stock_reservations(tenant_id, product_id, warehouse_id);

-- Password fix (idempotent)
UPDATE iam.users 
SET password_hash = '$2a$12$jy7z8lt1nolLbME/d4f3XeWRS4epx9Kl3ws6zoyYvWNqUZ9LzkGo6'
WHERE email = 'admin@brushia.net';
