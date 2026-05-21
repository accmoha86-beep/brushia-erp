-- Migration 003: Add missing columns and tables to match Drizzle schema
-- This fixes mismatches between the initial migration and the Drizzle ORM schema

-- ============================================================
-- IAM.TENANTS — missing columns
-- ============================================================
ALTER TABLE iam.tenants ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255);
ALTER TABLE iam.tenants ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE iam.tenants ADD COLUMN IF NOT EXISTS max_warehouses INTEGER NOT NULL DEFAULT 3;
ALTER TABLE iam.tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- ============================================================
-- IAM.USERS — missing columns
-- ============================================================
ALTER TABLE iam.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE iam.users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE iam.users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE iam.users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE iam.users ADD COLUMN IF NOT EXISTS default_branch_id UUID;
ALTER TABLE iam.users ADD COLUMN IF NOT EXISTS default_warehouse_id UUID;
-- Remove columns in Drizzle but not in schema: display_name, is_owner
-- (keep them for compatibility)

-- ============================================================
-- IAM.ROLES — missing columns
-- ============================================================
ALTER TABLE iam.roles ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE iam.roles ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- IAM.SESSIONS — missing columns
-- ============================================================
ALTER TABLE iam.sessions ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE iam.sessions ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;
ALTER TABLE iam.sessions ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- ============================================================
-- IAM.PERMISSIONS — new table
-- ============================================================
CREATE TABLE IF NOT EXISTS iam.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  description TEXT,
  display_name VARCHAR(200),
  display_group VARCHAR(100),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(module, action, resource)
);

-- ============================================================
-- IAM.ROLE_PERMISSIONS — new table
-- ============================================================
CREATE TABLE IF NOT EXISTS iam.role_permissions (
  role_id UUID NOT NULL REFERENCES iam.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES iam.permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES iam.users(id),
  PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- IAM.API_KEYS — new table
-- ============================================================
CREATE TABLE IF NOT EXISTS iam.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  name VARCHAR(100) NOT NULL,
  key_prefix VARCHAR(10) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  rate_limit INTEGER NOT NULL DEFAULT 1000,
  permissions JSONB NOT NULL DEFAULT '[]',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES iam.users(id),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES iam.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes for new tables
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_permissions_module ON iam.permissions(module);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON iam.api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON iam.api_keys(key_prefix);

-- ============================================================
-- CATALOG.BRANDS — missing columns
-- ============================================================
ALTER TABLE catalog.brands ADD COLUMN IF NOT EXISTS description TEXT;

-- ============================================================
-- CATALOG.PRODUCTS — missing columns
-- ============================================================
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS allow_backorder BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ============================================================
-- CATALOG.PRODUCT_VARIANTS — missing columns
-- ============================================================
ALTER TABLE catalog.product_variants ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}';
ALTER TABLE catalog.product_variants ADD COLUMN IF NOT EXISTS weight_grams INTEGER;
ALTER TABLE catalog.product_variants ADD COLUMN IF NOT EXISTS barcode_type VARCHAR(20) DEFAULT 'EAN13';
ALTER TABLE catalog.product_variants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ============================================================
-- CATALOG.PRODUCT_IMAGES — new table
-- ============================================================
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

-- ============================================================
-- INVENTORY.WAREHOUSES — missing columns
-- ============================================================
ALTER TABLE inventory.warehouses ADD COLUMN IF NOT EXISTS manager_id UUID;

-- ============================================================
-- INVENTORY.STOCK_LEVELS — missing columns
-- ============================================================
ALTER TABLE inventory.stock_levels ADD COLUMN IF NOT EXISTS location_id UUID;
ALTER TABLE inventory.stock_levels ADD COLUMN IF NOT EXISTS last_counted_at TIMESTAMPTZ;

-- ============================================================
-- INVENTORY.STOCK_MOVEMENTS — missing columns
-- ============================================================
ALTER TABLE inventory.stock_movements ADD COLUMN IF NOT EXISTS location_id UUID;

-- ============================================================
-- INVENTORY.STOCK_RESERVATIONS — new table
-- ============================================================
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
