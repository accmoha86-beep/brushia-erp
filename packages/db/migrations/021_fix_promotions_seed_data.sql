-- ═══════════════════════════════════════════════════════════════
-- Migration 021: Seed promotions, commission records, stock counts
-- Uses only columns that exist in the original DDL (migration 001 + 011)
-- ═══════════════════════════════════════════════════════════════

DO $$ DECLARE t_id UUID; BEGIN
  SELECT id INTO t_id FROM iam.tenants WHERE slug = 'brushia' LIMIT 1;
  IF t_id IS NOT NULL THEN

    -- ═══ Seed Promotions ═══
    -- Table columns (001): id, tenant_id, name, code, type, value, min_order_amount, max_discount, 
    --   usage_limit, used_count, applies_to, is_active, starts_at, ends_at
    -- Added by 011: code, type, value, usage_count, usage_limit, min_order_amount, applies_to, description
    DELETE FROM sales.promotions WHERE tenant_id = t_id;
    
    INSERT INTO sales.promotions (tenant_id, name, type, value, code, is_active, starts_at, ends_at, used_count, usage_limit, min_order_amount, applies_to, description)
    VALUES
      (t_id, 'Summer Sale 2026', 'percentage', 20, 'SUMMER20', true, '2026-05-01', '2026-08-31', 145, 500, 20000, 'all', 'Summer collection 20% discount on all products'),
      (t_id, 'New Customer Welcome', 'percentage', 15, 'WELCOME15', true, '2026-01-01', '2026-12-31', 312, NULL, 15000, 'all', '15% off your first order'),
      (t_id, 'Lash Bundle Deal', 'fixed', 5000, 'LASH50', true, '2026-05-15', '2026-07-31', 28, 100, 30000, 'all', 'EGP 50 off lash bundle purchases'),
      (t_id, 'Eid Al-Adha Special', 'percentage', 25, 'EID25', true, '2026-06-06', '2026-06-10', 0, 200, 25000, 'all', 'Special 25% Eid discount'),
      (t_id, 'Wholesale 10% Extra', 'percentage', 10, 'BULK10', true, '2026-01-01', '2026-12-31', 87, NULL, 100000, 'all', 'Extra 10% for wholesale orders over EGP 1,000'),
      (t_id, 'Flash Friday', 'percentage', 30, 'FLASH30', false, '2026-05-01', '2026-05-02', 256, 300, 10000, 'all', 'Flash 30% off — one day only!')
    ON CONFLICT DO NOTHING;

    -- ═══ Seed Commission Records ═══
    BEGIN
      -- Assign salesperson to existing orders
      UPDATE sales.sales_orders SET salesperson_id = (SELECT id FROM hr.salespersons WHERE tenant_id = t_id AND employee_code = 'SP-001' LIMIT 1)
      WHERE tenant_id = t_id AND salesperson_id IS NULL AND id = (SELECT id FROM sales.sales_orders WHERE tenant_id = t_id ORDER BY created_at ASC LIMIT 1);
      
      UPDATE sales.sales_orders SET salesperson_id = (SELECT id FROM hr.salespersons WHERE tenant_id = t_id AND employee_code = 'SP-002' LIMIT 1)
      WHERE tenant_id = t_id AND salesperson_id IS NULL AND id = (SELECT id FROM sales.sales_orders WHERE tenant_id = t_id ORDER BY created_at ASC LIMIT 1 OFFSET 1);

      UPDATE sales.sales_orders SET salesperson_id = (SELECT id FROM hr.salespersons WHERE tenant_id = t_id AND employee_code = 'SP-003' LIMIT 1)
      WHERE tenant_id = t_id AND salesperson_id IS NULL AND id = (SELECT id FROM sales.sales_orders WHERE tenant_id = t_id ORDER BY created_at ASC LIMIT 1 OFFSET 2);

      -- Create commission records
      INSERT INTO hr.commissions (tenant_id, salesperson_id, sales_order_id, order_total, commission_rate, commission_amount, status, created_at)
      SELECT so.tenant_id, so.salesperson_id, so.id, so.grand_total::bigint,
        sp.default_commission_rate,
        ROUND(so.grand_total::numeric * sp.default_commission_rate / 100),
        'pending', so.created_at
      FROM sales.sales_orders so
      JOIN hr.salespersons sp ON sp.id = so.salesperson_id
      WHERE so.tenant_id = t_id AND so.salesperson_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM hr.commissions c WHERE c.sales_order_id = so.id)
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- ═══ Seed Sample Stock Count ═══
    BEGIN
      INSERT INTO inventory.stock_counts (tenant_id, count_number, warehouse_id, count_type, status, counted_by, count_date, notes, completed_at)
      VALUES (
        t_id, 'SC-20260520-001',
        (SELECT id FROM inventory.warehouses WHERE tenant_id = t_id LIMIT 1),
        'full', 'completed',
        (SELECT id FROM iam.users WHERE tenant_id = t_id LIMIT 1),
        '2026-05-20', 'Monthly full stock count — all products verified',
        '2026-05-20 18:30:00+02'
      )
      ON CONFLICT DO NOTHING;

      -- Add stock count items
      INSERT INTO inventory.stock_count_items (tenant_id, stock_count_id, product_id, variant_id, system_qty, counted_qty, difference, unit_cost)
      SELECT sl.tenant_id,
        (SELECT id FROM inventory.stock_counts WHERE tenant_id = t_id AND count_number = 'SC-20260520-001' LIMIT 1),
        sl.product_id, sl.variant_id, sl.qty_on_hand,
        sl.qty_on_hand + (CASE WHEN random() < 0.15 THEN (floor(random() * 3) - 1)::int ELSE 0 END),
        0,
        COALESCE((SELECT pv.cost_price FROM catalog.product_variants pv WHERE pv.id = sl.variant_id LIMIT 1), 0)
      FROM inventory.stock_levels sl
      WHERE sl.tenant_id = t_id AND sl.qty_on_hand > 0
      LIMIT 20
      ON CONFLICT DO NOTHING;

      UPDATE inventory.stock_count_items SET difference = counted_qty - system_qty
      WHERE tenant_id = t_id AND stock_count_id = (SELECT id FROM inventory.stock_counts WHERE tenant_id = t_id AND count_number = 'SC-20260520-001' LIMIT 1);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

  END IF;
END $$;

INSERT INTO public.migrations (name, applied_at) VALUES ('021_fix_promotions_seed_data', NOW()) ON CONFLICT DO NOTHING;
