-- ═══════════════════════════════════════════════════════════════
-- Migration 022: Seed promotions + stock counts (021 was already marked applied before fix)
-- ═══════════════════════════════════════════════════════════════

DO $$ DECLARE t_id UUID; w_id UUID; u_id UUID; sc_id UUID; BEGIN
  SELECT id INTO t_id FROM iam.tenants WHERE slug = 'brushia' LIMIT 1;
  IF t_id IS NULL THEN RETURN; END IF;

  -- ═══ Seed Promotions (using correct columns: is_active, starts_at, ends_at, used_count) ═══
  DELETE FROM sales.promotions WHERE tenant_id = t_id AND code IS NOT NULL;

  INSERT INTO sales.promotions (tenant_id, name, type, value, code, is_active, starts_at, ends_at, used_count, usage_limit, min_order_amount, applies_to, description)
  VALUES
    (t_id, 'Summer Sale 2026', 'percentage', 20, 'SUMMER20', true, '2026-05-01', '2026-08-31', 145, 500, 20000, 'all', 'Summer collection 20% discount on all products'),
    (t_id, 'New Customer Welcome', 'percentage', 15, 'WELCOME15', true, '2026-01-01', '2026-12-31', 312, NULL, 15000, 'all', '15% off your first order — welcome to Brushia!'),
    (t_id, 'Lash Bundle Deal', 'fixed', 5000, 'LASH50', true, '2026-05-15', '2026-07-31', 28, 100, 30000, 'all', 'EGP 50 off lash bundle purchases over EGP 300'),
    (t_id, 'Eid Al-Adha Special', 'percentage', 25, 'EID25', true, '2026-06-06', '2026-06-10', 0, 200, 25000, 'all', 'Special 25% Eid discount — limited time!'),
    (t_id, 'Wholesale 10% Extra', 'percentage', 10, 'BULK10', true, '2026-01-01', '2026-12-31', 87, NULL, 100000, 'all', 'Extra 10% for wholesale orders over EGP 1,000'),
    (t_id, 'Flash Friday', 'percentage', 30, 'FLASH30', false, '2026-05-01', '2026-05-02', 256, 300, 10000, 'all', 'Flash 30% off — one day only! (ended)');

  -- ═══ Seed Stock Count ═══
  SELECT id INTO w_id FROM inventory.warehouses WHERE tenant_id = t_id LIMIT 1;
  SELECT id INTO u_id FROM iam.users WHERE tenant_id = t_id LIMIT 1;

  IF w_id IS NOT NULL AND u_id IS NOT NULL THEN
    -- Delete any existing test stock counts
    DELETE FROM inventory.stock_count_items WHERE tenant_id = t_id;
    DELETE FROM inventory.stock_counts WHERE tenant_id = t_id;

    INSERT INTO inventory.stock_counts (id, tenant_id, count_number, warehouse_id, count_type, status, counted_by, count_date, notes, completed_at)
    VALUES (
      'c0000000-0000-0000-0000-000000000001',
      t_id, 'SC-20260520-001', w_id, 'full', 'completed', u_id,
      '2026-05-20', 'Monthly full stock count — all products verified against system quantities',
      '2026-05-20 18:30:00+02'
    ) ON CONFLICT (id) DO NOTHING;

    SELECT id INTO sc_id FROM inventory.stock_counts WHERE tenant_id = t_id AND count_number = 'SC-20260520-001';

    IF sc_id IS NOT NULL THEN
      INSERT INTO inventory.stock_count_items (tenant_id, stock_count_id, product_id, variant_id, system_qty, counted_qty, variance, unit_cost)
      SELECT sl.tenant_id, sc_id, sl.product_id, sl.variant_id, sl.qty_on_hand,
        -- Most items match, a few have small variances
        sl.qty_on_hand + (CASE
          WHEN sl.product_id IN (SELECT id FROM catalog.products WHERE tenant_id = t_id ORDER BY id LIMIT 3) THEN -1
          WHEN sl.product_id IN (SELECT id FROM catalog.products WHERE tenant_id = t_id ORDER BY id LIMIT 5 OFFSET 3) THEN 1
          ELSE 0 END),
        CASE
          WHEN sl.product_id IN (SELECT id FROM catalog.products WHERE tenant_id = t_id ORDER BY id LIMIT 3) THEN -1
          WHEN sl.product_id IN (SELECT id FROM catalog.products WHERE tenant_id = t_id ORDER BY id LIMIT 5 OFFSET 3) THEN 1
          ELSE 0 END,
        COALESCE((SELECT pv.cost_price FROM catalog.product_variants pv WHERE pv.id = sl.variant_id LIMIT 1), 0)
      FROM inventory.stock_levels sl
      WHERE sl.tenant_id = t_id AND sl.qty_on_hand > 0
      LIMIT 20
      ON CONFLICT DO NOTHING;
    END IF;

    -- Add a second stock count (in progress)
    INSERT INTO inventory.stock_counts (id, tenant_id, count_number, warehouse_id, count_type, status, counted_by, count_date, notes)
    VALUES (
      'c0000000-0000-0000-0000-000000000002',
      t_id, 'SC-20260524-001', w_id, 'partial', 'in_progress', u_id,
      '2026-05-24', 'Weekly spot check — lashes and brushes section'
    ) ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ═══ Update order payment status to paid (POS sales should be paid) ═══
  UPDATE sales.sales_orders SET payment_status = 'paid', paid_amount = grand_total::bigint
  WHERE tenant_id = t_id AND channel = 'pos' AND payment_status = 'unpaid';

END $$;

INSERT INTO public.migrations (name, applied_at) VALUES ('022_seed_promotions_stockcounts', NOW()) ON CONFLICT DO NOTHING;
