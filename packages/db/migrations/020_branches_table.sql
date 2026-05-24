-- Migration 020: pos.branches table + seed data
-- ================================================

-- Create branches table
CREATE TABLE IF NOT EXISTS pos.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  branch_type VARCHAR(20) NOT NULL DEFAULT 'permanent', -- permanent | exhibition | popup
  address_line1 TEXT,
  city VARCHAR(50),
  governorate VARCHAR(50),
  phone VARCHAR(20),
  manager_name VARCHAR(100),
  warehouse_id UUID REFERENCES inventory.warehouses(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Exhibition-specific fields
  event_start_date DATE,
  event_end_date DATE,
  event_venue VARCHAR(200),
  event_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- Add branch_id to registers if not exists
DO $$ BEGIN
  ALTER TABLE pos.registers ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES pos.branches(id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Seed branches
INSERT INTO pos.branches (tenant_id, name, code, branch_type, city, governorate, phone, manager_name, warehouse_id, is_active)
SELECT 
  'a0000000-0000-0000-0000-000000000001',
  'Brushia Main Store',
  'BR-MAIN',
  'permanent',
  'Cairo',
  'Cairo',
  '+20 100 000 0001',
  'Nadia Hassan',
  '20000000-0000-0000-0000-000000000001',
  true
WHERE NOT EXISTS (SELECT 1 FROM pos.branches WHERE code = 'BR-MAIN' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO pos.branches (tenant_id, name, code, branch_type, city, governorate, phone, manager_name, warehouse_id, is_active)
SELECT 
  'a0000000-0000-0000-0000-000000000001',
  'Brushia Alexandria',
  'BR-ALEX',
  'permanent',
  'Alexandria',
  'Alexandria',
  '+20 100 000 0002',
  'Layla Ahmed',
  '20000000-0000-0000-0000-000000000002',
  true
WHERE NOT EXISTS (SELECT 1 FROM pos.branches WHERE code = 'BR-ALEX' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO pos.branches (tenant_id, name, code, branch_type, city, governorate, phone, warehouse_id, is_active, event_start_date, event_end_date, event_venue, event_notes)
SELECT 
  'a0000000-0000-0000-0000-000000000001',
  'Cairo Beauty Expo 2026',
  'EX-EXPO26',
  'exhibition',
  'Cairo',
  'Cairo',
  '+20 100 000 0003',
  '20000000-0000-0000-0000-000000000003',
  true,
  '2026-06-15',
  '2026-06-20',
  'Cairo International Convention Center',
  'Annual beauty & cosmetics exhibition — booth B15'
WHERE NOT EXISTS (SELECT 1 FROM pos.branches WHERE code = 'EX-EXPO26' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

-- Track migration
INSERT INTO public.migrations (name, applied_at) VALUES ('020_branches_table', NOW())
ON CONFLICT DO NOTHING;
