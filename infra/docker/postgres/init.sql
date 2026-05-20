-- ═══════════════════════════════════════════════════════════
-- Brushia ERP — PostgreSQL Initialization
-- This runs ONCE when the database container is first created
-- ═══════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Trigram similarity for fuzzy search
CREATE EXTENSION IF NOT EXISTS "btree_gist";   -- GiST index for exclusion constraints

-- ─── Domain Schemas ───
-- Each domain module gets its own schema for clean boundaries
CREATE SCHEMA IF NOT EXISTS iam;        -- Identity & Access Management
CREATE SCHEMA IF NOT EXISTS tenant;     -- Tenant Management
CREATE SCHEMA IF NOT EXISTS catalog;    -- Product Catalog
CREATE SCHEMA IF NOT EXISTS inventory;  -- Inventory Engine
CREATE SCHEMA IF NOT EXISTS accounting; -- Accounting Engine
CREATE SCHEMA IF NOT EXISTS sales;      -- Sales & POS
CREATE SCHEMA IF NOT EXISTS purchasing; -- Purchasing & Vendors
CREATE SCHEMA IF NOT EXISTS crm;        -- Customer Relationship
CREATE SCHEMA IF NOT EXISTS shipping;   -- Shipping & Fulfillment
CREATE SCHEMA IF NOT EXISTS promo;      -- Promotions Engine
CREATE SCHEMA IF NOT EXISTS loyalty;    -- Loyalty Program
CREATE SCHEMA IF NOT EXISTS audit;      -- Audit & Compliance
CREATE SCHEMA IF NOT EXISTS platform;   -- Platform Services (outbox, idempotency, etc.)
CREATE SCHEMA IF NOT EXISTS media;      -- Media & File Management
CREATE SCHEMA IF NOT EXISTS reporting;  -- Materialized views & reporting

-- ─── Default Search Path ───
ALTER DATABASE brushia SET search_path TO public, iam, tenant, catalog, inventory, accounting, sales, purchasing, crm, shipping, promo, loyalty, audit, platform, media, reporting;

-- ─── Platform Tables (used across all modules) ───

-- Transactional Outbox Pattern
CREATE TABLE platform.outbox (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL,
    aggregate_type  VARCHAR(100) NOT NULL,
    aggregate_id    UUID NOT NULL,
    event_type      VARCHAR(200) NOT NULL,
    payload         JSONB NOT NULL DEFAULT '{}',
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at    TIMESTAMPTZ,
    retry_count     INT NOT NULL DEFAULT 0,
    max_retries     INT NOT NULL DEFAULT 5,
    error           TEXT
);

CREATE INDEX idx_outbox_unprocessed ON platform.outbox (created_at)
    WHERE processed_at IS NULL;
CREATE INDEX idx_outbox_tenant ON platform.outbox (tenant_id);

-- Idempotency Keys
CREATE TABLE platform.idempotency_keys (
    key             VARCHAR(255) PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    response_status INT,
    response_body   JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX idx_idempotency_expires ON platform.idempotency_keys (expires_at);

-- ─── Utility Functions ───

-- Generate short, human-readable IDs (e.g., INV-20240101-A3F2)
CREATE OR REPLACE FUNCTION platform.generate_ref(prefix TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN prefix || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
           UPPER(SUBSTRING(MD5(uuid_generate_v4()::TEXT) FROM 1 FOR 4));
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION platform.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Audit Log Table ───
CREATE TABLE audit.log (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    user_id         UUID,
    action          VARCHAR(50) NOT NULL,  -- CREATE, UPDATE, DELETE, LOGIN, etc.
    entity_type     VARCHAR(100) NOT NULL, -- e.g., 'sales.order', 'inventory.movement'
    entity_id       UUID,
    changes         JSONB,                 -- {field: {old: x, new: y}}
    metadata        JSONB DEFAULT '{}',    -- IP, user agent, etc.
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create partitions for current and next month
DO $$
DECLARE
    start_date DATE := DATE_TRUNC('month', CURRENT_DATE);
    end_date DATE;
    partition_name TEXT;
BEGIN
    FOR i IN 0..2 LOOP
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'log_' || TO_CHAR(start_date, 'YYYY_MM');
        EXECUTE FORMAT(
            'CREATE TABLE IF NOT EXISTS audit.%I PARTITION OF audit.log FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );
        start_date := end_date;
    END LOOP;
END $$;

CREATE INDEX idx_audit_log_tenant ON audit.log (tenant_id, created_at DESC);
CREATE INDEX idx_audit_log_entity ON audit.log (entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON audit.log (user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- Database initialized successfully!
-- ═══════════════════════════════════════════════════════════
