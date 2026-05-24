-- Migration 024: Seed stock counts + fix order payment status
-- Simple and defensive

DO $$
DECLARE
  t_id UUID;
  w_id UUID;
  u_id UUID;
  sc_id UUID;
BEGIN
  SELECT id INTO t_id FROM iam.tenants WHERE slug = 'brushia' LIMIT 1;
  IF t_id IS NULL THEN RETURN; END IF;

  -- Fix POS order payment status
  UPDATE sales.sales_orders 
  SET payment_status = 'paid', paid_amount = COALESCE(grand_total, total, 0)
  WHERE tenant_id = t_id AND channel = 'pos' AND (payment_status IS NULL OR payment_status = 'unpaid');

  -- Seed stock counts
  SELECT id INTO w_id FROM inventory.warehouses WHERE tenant_id = t_id LIMIT 1;
  SELECT id INTO u_id FROM iam.users WHERE tenant_id = t_id LIMIT 1;

  IF w_id IS NOT NULL AND u_id IS NOT NULL THEN
    -- Remove existing stock counts for clean insert
    DELETE FROM inventory.stock_count_items WHERE tenant_id = t_id;
    DELETE FROM inventory.stock_counts WHERE tenant_id = t_id;

    -- Completed count
    INSERT INTO inventory.stock_counts (tenant_id, count_number, warehouse_id, count_type, status, counted_by, count_date, notes, total_items, total_variance, completed_at)
    VALUES (t_id, 'SC-20260520-001', w_id, 'full', 'completed', u_id, '2026-05-20',
      'Monthly full stock count — all products verified', 20, 3, '2026-05-20 18:30:00+02');

    SELECT id INTO sc_id FROM inventory.stock_counts WHERE tenant_id = t_id AND count_number = 'SC-20260520-001';

    -- In progress count
    INSERT INTO inventory.stock_counts (tenant_id, count_number, warehouse_id, count_type, status, counted_by, count_date, notes, total_items)
    VALUES (t_id, 'SC-20260524-001', w_id, 'partial', 'in_progress', u_id, '2026-05-24',
      'Weekly spot check — lashes and brushes section', 8);
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Migration 024 error: %', SQLERRM;
END $$;

INSERT INTO public.migrations (name, applied_at) VALUES ('024_seed_stockcounts_orders', NOW()) ON CONFLICT DO NOTHING;
