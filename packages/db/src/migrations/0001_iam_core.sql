-- Migration: 0001_iam_core
-- Description: Identity & Access Management core tables
-- Author: Brushia ERP Architecture
-- Date: 2025-01-01

BEGIN;

-- =========================================================
-- TENANTS
-- =========================================================
CREATE TABLE iam.tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
    plan            VARCHAR(50) NOT NULL DEFAULT 'trial'
                    CHECK (plan IN ('trial', 'starter', 'professional', 'enterprise')),
    
    -- Company details
    legal_name      VARCHAR(255),
    tax_id          VARCHAR(50),           -- Egyptian Tax Registration Number
    commercial_reg  VARCHAR(50),           -- السجل التجاري
    
    -- Contact
    email           VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    
    -- Address
    address_line1   VARCHAR(255),
    address_line2   VARCHAR(255),
    city            VARCHAR(100),
    governorate     VARCHAR(100),
    postal_code     VARCHAR(10),
    country         VARCHAR(2) NOT NULL DEFAULT 'EG',
    
    -- Settings
    currency        VARCHAR(3) NOT NULL DEFAULT 'EGP',
    timezone        VARCHAR(50) NOT NULL DEFAULT 'Africa/Cairo',
    locale          VARCHAR(10) NOT NULL DEFAULT 'ar-EG',
    vat_rate        INTEGER NOT NULL DEFAULT 1400,    -- 14.00% stored as basis points
    fiscal_year_start INTEGER NOT NULL DEFAULT 1,     -- Month (1=January)
    
    -- Limits
    max_users       INTEGER NOT NULL DEFAULT 5,
    max_branches    INTEGER NOT NULL DEFAULT 1,
    max_warehouses  INTEGER NOT NULL DEFAULT 2,
    
    -- Timestamps
    trial_ends_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,           -- Soft delete
    
    CONSTRAINT tenants_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$')
);

CREATE INDEX idx_tenants_slug ON iam.tenants(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_status ON iam.tenants(status) WHERE deleted_at IS NULL;

-- =========================================================
-- USERS
-- =========================================================
CREATE TABLE iam.users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    -- Identity
    email           VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    password_hash   VARCHAR(255) NOT NULL,
    
    -- Profile
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    display_name    VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    avatar_url      VARCHAR(500),
    
    -- Status
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'locked', 'pending_verification')),
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Security
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until    TIMESTAMPTZ,
    last_login_at   TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Preferences
    language        VARCHAR(5) NOT NULL DEFAULT 'ar',
    theme           VARCHAR(10) NOT NULL DEFAULT 'system'
                    CHECK (theme IN ('light', 'dark', 'system')),
    
    -- Assignment
    default_branch_id UUID,       -- FK added later after branches table
    default_warehouse_id UUID,    -- FK added later after warehouses table
    
    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    
    CONSTRAINT users_email_tenant_unique UNIQUE (tenant_id, email),
    CONSTRAINT users_phone_format CHECK (phone IS NULL OR phone ~ '^\+[0-9]{10,15}$')
);

CREATE INDEX idx_users_tenant ON iam.users(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON iam.users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON iam.users(tenant_id, status) WHERE deleted_at IS NULL;

-- =========================================================
-- ROLES
-- =========================================================
CREATE TABLE iam.roles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) NOT NULL,
    description     TEXT,
    
    is_system       BOOLEAN NOT NULL DEFAULT FALSE,  -- System roles can't be deleted
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,  -- Auto-assigned to new users
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT roles_slug_tenant_unique UNIQUE (tenant_id, slug)
);

CREATE INDEX idx_roles_tenant ON iam.roles(tenant_id);

-- =========================================================
-- PERMISSIONS
-- =========================================================
CREATE TABLE iam.permissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Permission identifier: module.resource.action
    -- e.g., 'inventory.products.create', 'accounting.journals.post'
    code            VARCHAR(200) NOT NULL UNIQUE,
    
    module          VARCHAR(50) NOT NULL,       -- e.g., 'inventory', 'accounting', 'sales'
    resource        VARCHAR(50) NOT NULL,       -- e.g., 'products', 'journals', 'orders'
    action          VARCHAR(50) NOT NULL,       -- e.g., 'create', 'read', 'update', 'delete', 'post', 'approve'
    
    description     TEXT,
    
    -- Grouping for UI
    display_group   VARCHAR(100),
    display_order   INTEGER NOT NULL DEFAULT 0,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_permissions_module ON iam.permissions(module);

-- =========================================================
-- ROLE-PERMISSION MAPPING
-- =========================================================
CREATE TABLE iam.role_permissions (
    role_id         UUID NOT NULL REFERENCES iam.roles(id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES iam.permissions(id) ON DELETE CASCADE,
    
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by      UUID REFERENCES iam.users(id),
    
    PRIMARY KEY (role_id, permission_id)
);

-- =========================================================
-- USER-ROLE MAPPING
-- =========================================================
CREATE TABLE iam.user_roles (
    user_id         UUID NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES iam.roles(id) ON DELETE CASCADE,
    
    -- Optional branch-scoped role (NULL = all branches)
    branch_id       UUID,          -- FK added later
    
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by     UUID REFERENCES iam.users(id),
    expires_at      TIMESTAMPTZ,   -- Temporary role assignments
    
    PRIMARY KEY (user_id, role_id, COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::UUID))
);

CREATE INDEX idx_user_roles_user ON iam.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON iam.user_roles(role_id);

-- =========================================================
-- SESSIONS (for tracking active sessions)
-- =========================================================
CREATE TABLE iam.sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    -- Token tracking
    refresh_token_hash VARCHAR(128) NOT NULL UNIQUE,
    
    -- Session info
    ip_address      INET,
    user_agent      TEXT,
    device_type     VARCHAR(20) CHECK (device_type IN ('web', 'pos', 'mobile', 'api')),
    
    -- Status
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Expiry
    expires_at      TIMESTAMPTZ NOT NULL,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user ON iam.sessions(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_sessions_token ON iam.sessions(refresh_token_hash) WHERE is_active = TRUE;
CREATE INDEX idx_sessions_expires ON iam.sessions(expires_at) WHERE is_active = TRUE;

-- =========================================================
-- API KEYS (for integrations)
-- =========================================================
CREATE TABLE iam.api_keys (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    name            VARCHAR(100) NOT NULL,
    key_hash        VARCHAR(128) NOT NULL UNIQUE,
    key_prefix      VARCHAR(10) NOT NULL,       -- First 8 chars for identification
    
    -- Scoping
    permissions     TEXT[] NOT NULL DEFAULT '{}', -- Array of permission codes
    allowed_ips     INET[],                      -- IP whitelist (NULL = any)
    
    -- Rate limiting
    rate_limit      INTEGER NOT NULL DEFAULT 1000, -- Requests per minute
    
    -- Status
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID NOT NULL REFERENCES iam.users(id),
    revoked_at      TIMESTAMPTZ,
    revoked_by      UUID REFERENCES iam.users(id)
);

CREATE INDEX idx_api_keys_tenant ON iam.api_keys(tenant_id) WHERE is_active = TRUE;
CREATE INDEX idx_api_keys_prefix ON iam.api_keys(key_prefix);

-- =========================================================
-- PASSWORD RESET TOKENS
-- =========================================================
CREATE TABLE iam.password_resets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
    
    token_hash      VARCHAR(128) NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_resets_token ON iam.password_resets(token_hash) WHERE used_at IS NULL;

-- =========================================================
-- AUDIT LOG (IAM-specific, references core.audit_log for general)
-- =========================================================
-- IAM events go to the core.audit_log partitioned table
-- but we add a specific view for IAM events

CREATE VIEW iam.audit_events AS
SELECT * FROM core.audit_log WHERE domain = 'iam';

-- =========================================================
-- FUNCTIONS
-- =========================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION iam.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated
    BEFORE UPDATE ON iam.tenants
    FOR EACH ROW EXECUTE FUNCTION iam.update_timestamp();

CREATE TRIGGER trg_users_updated
    BEFORE UPDATE ON iam.users
    FOR EACH ROW EXECUTE FUNCTION iam.update_timestamp();

CREATE TRIGGER trg_roles_updated
    BEFORE UPDATE ON iam.roles
    FOR EACH ROW EXECUTE FUNCTION iam.update_timestamp();

-- Lock user after 5 failed attempts
CREATE OR REPLACE FUNCTION iam.check_login_attempts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.failed_login_attempts >= 5 AND OLD.failed_login_attempts < 5 THEN
        NEW.status = 'locked';
        NEW.locked_until = NOW() + INTERVAL '30 minutes';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_lock_check
    BEFORE UPDATE OF failed_login_attempts ON iam.users
    FOR EACH ROW EXECUTE FUNCTION iam.check_login_attempts();

-- Prevent deletion of system roles
CREATE OR REPLACE FUNCTION iam.protect_system_roles()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_system = TRUE THEN
        RAISE EXCEPTION 'Cannot delete system role: %', OLD.name;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_roles_protect_system
    BEFORE DELETE ON iam.roles
    FOR EACH ROW EXECUTE FUNCTION iam.protect_system_roles();

-- =========================================================
-- ROW-LEVEL SECURITY
-- =========================================================

-- Enable RLS on tenant-scoped tables
ALTER TABLE iam.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Tenant isolation
-- These use the app-level SET LOCAL role + current_setting pattern

CREATE POLICY tenant_isolation_users ON iam.users
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_roles ON iam.roles
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_sessions ON iam.sessions
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_api_keys ON iam.api_keys
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- User roles need join through roles to get tenant_id
CREATE POLICY tenant_isolation_user_roles ON iam.user_roles
    USING (
        EXISTS (
            SELECT 1 FROM iam.users u 
            WHERE u.id = user_roles.user_id 
            AND u.tenant_id = current_setting('app.current_tenant_id')::UUID
        )
    );

CREATE POLICY tenant_isolation_role_permissions ON iam.role_permissions
    USING (
        EXISTS (
            SELECT 1 FROM iam.roles r 
            WHERE r.id = role_permissions.role_id 
            AND r.tenant_id = current_setting('app.current_tenant_id')::UUID
        )
    );

COMMIT;
