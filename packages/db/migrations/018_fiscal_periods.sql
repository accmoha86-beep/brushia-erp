-- Migration 018: Create accounting.fiscal_periods table (required by journal entry creation)
-- Also creates default open periods for 2025 and 2026

CREATE TABLE IF NOT EXISTS accounting.fiscal_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'locked')),
  closed_by UUID REFERENCES iam.users(id),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Seed default open periods for Brushia tenant
INSERT INTO accounting.fiscal_periods (tenant_id, name, start_date, end_date, status)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'FY 2025', '2025-01-01', '2025-12-31', 'open'),
  ('a0000000-0000-0000-0000-000000000001', 'FY 2026', '2026-01-01', '2026-12-31', 'open'),
  ('a0000000-0000-0000-0000-000000000001', 'FY 2027', '2027-01-01', '2027-12-31', 'open')
ON CONFLICT DO NOTHING;

-- Track migration
INSERT INTO public.migrations (name, applied_at) 
VALUES ('018_fiscal_periods', NOW())
ON CONFLICT DO NOTHING;
