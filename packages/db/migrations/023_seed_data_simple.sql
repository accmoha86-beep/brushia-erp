-- Migration 023: Simple seed — promotions + orders fix
-- Deliberately simple to avoid any SQL errors

DO $$ 
DECLARE 
  t_id UUID;
BEGIN
  SELECT id INTO t_id FROM iam.tenants WHERE slug = 'brushia' LIMIT 1;
  IF t_id IS NULL THEN RETURN; END IF;

  -- Clear old promotions
  DELETE FROM sales.promotions WHERE tenant_id = t_id;

  -- Insert promotions using ONLY columns from migration 001 + 011
  INSERT INTO sales.promotions (tenant_id, name, type, value, code, is_active, starts_at, ends_at, used_count, usage_limit, min_order_amount, applies_to, description) VALUES
    (t_id, 'Summer Sale 2026', 'percentage', 20, 'SUMMER20', true, '2026-05-01'::timestamptz, '2026-08-31'::timestamptz, 145, 500, 20000, 'all', 'Summer collection 20% discount'),
    (t_id, 'New Customer Welcome', 'percentage', 15, 'WELCOME15', true, '2026-01-01'::timestamptz, '2026-12-31'::timestamptz, 312, NULL, 15000, 'all', '15% off your first order'),
    (t_id, 'Lash Bundle Deal', 'fixed', 5000, 'LASH50', true, '2026-05-15'::timestamptz, '2026-07-31'::timestamptz, 28, 100, 30000, 'all', 'EGP 50 off lash bundles'),
    (t_id, 'Eid Al-Adha Special', 'percentage', 25, 'EID25', true, '2026-06-06'::timestamptz, '2026-06-10'::timestamptz, 0, 200, 25000, 'all', 'Special 25% Eid discount'),
    (t_id, 'Wholesale Extra 10%', 'percentage', 10, 'BULK10', true, '2026-01-01'::timestamptz, '2026-12-31'::timestamptz, 87, NULL, 100000, 'all', 'Extra 10% for wholesale'),
    (t_id, 'Flash Friday', 'percentage', 30, 'FLASH30', false, '2026-05-01'::timestamptz, '2026-05-02'::timestamptz, 256, 300, 10000, 'all', 'Flash 30% off — ended');

  -- Fix POS order payment status
  UPDATE sales.sales_orders 
  SET payment_status = 'paid', paid_amount = grand_total::bigint
  WHERE tenant_id = t_id AND channel = 'pos' AND payment_status = 'unpaid';

END $$;

INSERT INTO public.migrations (name, applied_at) VALUES ('023_seed_data_simple', NOW()) ON CONFLICT DO NOTHING;
