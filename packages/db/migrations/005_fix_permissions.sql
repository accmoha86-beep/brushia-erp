-- Migration 005: Fix permissions table and user_roles table

-- Add missing 'code' column to permissions table
ALTER TABLE iam.permissions ADD COLUMN IF NOT EXISTS code VARCHAR(200) UNIQUE;

-- Fix user_roles table — add missing columns from Drizzle schema
ALTER TABLE iam.user_roles ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE iam.user_roles ADD COLUMN IF NOT EXISTS assigned_by UUID;
ALTER TABLE iam.user_roles ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE iam.user_roles ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Update existing permissions to have a code (if any exist)
UPDATE iam.permissions SET code = module || '.' || resource || '.' || action WHERE code IS NULL;
