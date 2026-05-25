-- Migration 025: Cost Centers (مراكز التكلفة)
-- Links branches/departments to accounting for per-location P&L tracking

-- 1. Create cost_centers table
CREATE TABLE IF NOT EXISTS accounting.cost_centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  code VARCHAR(20) NOT NULL,
  name VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200),
  type VARCHAR(30) NOT NULL DEFAULT 'branch' CHECK (type IN ('branch', 'department', 'project', 'exhibition')),
  parent_id UUID REFERENCES accounting.cost_centers(id),
  branch_id UUID REFERENCES pos.branches(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  budget_amount BIGINT DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- 2. Add cost_center_id to journal_lines for transaction-level tracking
ALTER TABLE accounting.journal_lines 
  ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES accounting.cost_centers(id);

-- 3. Add cost_center_id to expenses too
ALTER TABLE accounting.expenses 
  ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES accounting.cost_centers(id);

-- 4. Seed cost centers from existing branches (auto-linked)
INSERT INTO accounting.cost_centers (tenant_id, code, name, name_ar, type, branch_id, is_active)
SELECT 
  b.tenant_id, 
  'CC-' || b.code, 
  b.name,
  CASE 
    WHEN b.name LIKE '%Main%' THEN 'الفرع الرئيسي'
    WHEN b.name LIKE '%Alex%' THEN 'فرع الإسكندرية'
    WHEN b.name LIKE '%Expo%' THEN 'معرض القاهرة للتجميل'
    WHEN b.name LIKE '%Nasr%' THEN 'فرع مدينة نصر'
    WHEN b.name LIKE '%Maadi%' THEN 'فرع المعادي'
    WHEN b.name LIKE '%Heliopolis%' THEN 'فرع مصر الجديدة'
    WHEN b.name LIKE '%6th%' OR b.name LIKE '%October%' THEN 'فرع 6 أكتوبر'
    WHEN b.name LIKE '%Mansoura%' THEN 'فرع المنصورة'
    WHEN b.name LIKE '%Tanta%' THEN 'فرع طنطا'
    WHEN b.name LIKE '%Zamalek%' THEN 'فرع الزمالك'
    ELSE b.name
  END,
  CASE WHEN b.branch_type = 'exhibition' THEN 'exhibition' ELSE 'branch' END,
  b.id,
  b.is_active
FROM pos.branches b
WHERE b.tenant_id = 'a0000000-0000-0000-0000-000000000001'
ON CONFLICT (tenant_id, code) DO NOTHING;

-- 5. Add department-level cost centers (not tied to branches)
INSERT INTO accounting.cost_centers (tenant_id, code, name, name_ar, type, description) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'CC-ADMIN', 'Administration', 'الإدارة', 'department', 'General admin and overhead'),
  ('a0000000-0000-0000-0000-000000000001', 'CC-MKTG', 'Marketing', 'التسويق', 'department', 'Marketing and advertising'),
  ('a0000000-0000-0000-0000-000000000001', 'CC-LOGISTICS', 'Logistics & Shipping', 'اللوجستيات والشحن', 'department', 'Warehousing and shipping operations'),
  ('a0000000-0000-0000-0000-000000000001', 'CC-ECOM', 'E-Commerce', 'التجارة الإلكترونية', 'department', 'Online store operations'),
  ('a0000000-0000-0000-0000-000000000001', 'CC-WHATSAPP', 'WhatsApp Sales', 'مبيعات واتساب', 'department', 'WhatsApp order channel')
ON CONFLICT (tenant_id, code) DO NOTHING;

-- 6. Create index for performance
CREATE INDEX IF NOT EXISTS idx_cost_centers_tenant ON accounting.cost_centers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_branch ON accounting.cost_centers(branch_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_cost_center ON accounting.journal_lines(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_expenses_cost_center ON accounting.expenses(cost_center_id);

-- Track migration
INSERT INTO public.migrations (name, applied_at) 
VALUES ('025_cost_centers', NOW())
ON CONFLICT DO NOTHING;
