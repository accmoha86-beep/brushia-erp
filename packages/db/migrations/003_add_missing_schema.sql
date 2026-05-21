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
