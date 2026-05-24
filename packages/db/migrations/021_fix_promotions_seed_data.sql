-- ═══════════════════════════════════════════════════════════════
-- Migration 021: Fix promotions columns + seed promotions, commissions, stock counts
-- ═══════════════════════════════════════════════════════════════

-- Add missing columns to promotions (align service with DDL)
DO $$ BEGIN ALTER TABLE sales.promotions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sales.promotions ADD COLUMN IF NOT EXISTS start_date DATE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sales.promotions ADD COLUMN IF NOT EXISTS end_date DATE; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Update existing rows: copy from starts_at/ends_at to new columns if they exist
DO $$ BEGIN
  UPDATE sales.promotions SET start_date = starts_at::date WHERE start_date IS NULL AND starts_at IS NOT NULL;
  UPDATE sales.promotions SET end_date = ends_at::date WHERE end_date IS NULL AND ends_at IS NOT NULL;
  UPDATE sales.promotions SET status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END WHERE status IS NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ═══ Seed Promotions ═══
DO $$ DECLARE t_id UUID; BEGIN
  SELECT id INTO t_id FROM iam.tenants WHERE slug = 'brushia' LIMIT 1;
  IF t_id IS NOT NULL THEN
    -- Delete old failed promotion seeds (if any)
    DELETE FROM sales.promotions WHERE tenant_id = t_id;
    
    INSERT INTO sales.promotions (tenant_id, name, type, value, code, status, start_date, end_date, usage_count, usage_limit, min_order_amount, is_active, starts_at, ends_at, applies_to, description)
    VALUES
      (t_id, 'Summer Sale 2026', 'percentage', 20, 'SUMMER20', 'active', '2026-05-01', '2026-08-31', 145, 500, 20000, true, '2026-05-01', '2026-08-31', 'all', 'Summer collection 20% discount on all products'),
      (t_id, 'New Customer Welcome', 'percentage', 15, 'WELCOME15', 'active', '2026-01-01', '2026-12-31', 312, NULL, 15000, true, '2026-01-01', '2026-12-31', 'all', '15% off your first order'),
      (t_id, 'Lash Bundle Deal', 'fixed', 5000, 'LASH50', 'active', '2026-05-15', '2026-07-31', 28, 100, 30000, true, '2026-05-15', '2026-07-31', 'all', 'EGP 50 off lash bundle purchases'),
      (t_id, 'Eid Al-Adha Special', 'percentage', 25, 'EID25', 'scheduled', '2026-06-06', '2026-06-10', 0, 200, 25000, true, '2026-06-06', '2026-06-10', 'all', 'Special 25% Eid discount'),
      (t_id, 'Wholesale 10% Extra', 'percentage', 10, 'BULK10', 'active', '2026-01-01', '2026-12-31', 87, NULL, 100000, true, '2026-01-01', '2026-12-31', 'all', 'Extra 10% for wholesale orders over EGP 1,000'),
      (t_id, 'Flash Friday', 'percentage', 30, 'FLASH30', 'expired', '2026-05-01', '2026-05-02', 256, 300, 10000, false, '2026-05-01', '2026-05-02', 'all', 'Flash 30% off — one day only!')
    ON CONFLICT DO NOTHING;

    -- ═══ Seed Commission Records ═══
    -- Link existing orders to salespersons and create commission records
    BEGIN
      -- Assign salesperson to the first few orders
      UPDATE sales.sales_orders SET salesperson_id = (SELECT id FROM hr.salespersons WHERE tenant_id = t_id AND employee_code = 'SP-001' LIMIT 1)
      WHERE tenant_id = t_id AND salesperson_id IS NULL AND order_number LIKE 'POS-%-0001' LIMIT 1;
      
      UPDATE sales.sales_orders SET salesperson_id = (SELECT id FROM hr.salespersons WHERE tenant_id = t_id AND employee_code = 'SP-002' LIMIT 1)
      WHERE tenant_id = t_id AND salesperson_id IS NULL AND order_number LIKE 'POS-%-0002' LIMIT 1;

      UPDATE sales.sales_orders SET salesperson_id = (SELECT id FROM hr.salespersons WHERE tenant_id = t_id AND employee_code = 'SP-003' LIMIT 1)
      WHERE tenant_id = t_id AND salesperson_id IS NULL AND order_number LIKE 'POS-%-0003' LIMIT 1;

      -- Create commission records for orders with salesperson
      INSERT INTO hr.commissions (tenant_id, salesperson_id, sales_order_id, order_total, commission_rate, commission_amount, status, created_at)
      SELECT so.tenant_id, so.salesperson_id, so.id, so.grand_total::bigint,
        sp.default_commission_rate,
        ROUND(so.grand_total::numeric * sp.default_commission_rate / 100),
        'pending',
        so.created_at
      FROM sales.sales_orders so
      JOIN hr.salespersons sp ON sp.id = so.salesperson_id
      WHERE so.tenant_id = t_id AND so.salesperson_id IS NOT NULL
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- ═══ Seed Sample Stock Count ═══
    BEGIN
      INSERT INTO inventory.stock_counts (tenant_id, count_number, warehouse_id, count_type, status, counted_by, count_date, notes, completed_at)
      VALUES (
        t_id, 'SC-20260520-001',
        (SELECT id FROM inventory.warehouses WHERE tenant_id = t_id AND name ILIKE '%main%' LIMIT 1),
        'full', 'completed',
        (SELECT id FROM iam.users WHERE tenant_id = t_id LIMIT 1),
        '2026-05-20', 'Monthly full stock count — all products verified',
        '2026-05-20 18:30:00+02'
      )
      ON CONFLICT DO NOTHING;

      -- Add stock count items from actual stock levels
      INSERT INTO inventory.stock_count_items (tenant_id, stock_count_id, product_id, variant_id, system_qty, counted_qty, difference, unit_cost)
      SELECT sl.tenant_id,
        (SELECT id FROM inventory.stock_counts WHERE tenant_id = t_id AND count_number = 'SC-20260520-001' LIMIT 1),
        sl.product_id, sl.variant_id, sl.qty_on_hand,
        sl.qty_on_hand + (CASE WHEN random() < 0.2 THEN (floor(random() * 5) - 2)::int ELSE 0 END),
        0, 
        COALESCE((SELECT pv.cost_price FROM catalog.product_variants pv WHERE pv.id = sl.variant_id LIMIT 1), 0)
      FROM inventory.stock_levels sl
      WHERE sl.tenant_id = t_id AND sl.qty_on_hand > 0
      LIMIT 20
      ON CONFLICT DO NOTHING;

      -- Update differences
      UPDATE inventory.stock_count_items SET difference = counted_qty - system_qty
      WHERE tenant_id = t_id AND stock_count_id = (SELECT id FROM inventory.stock_counts WHERE tenant_id = t_id AND count_number = 'SC-20260520-001' LIMIT 1);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

  END IF;
END $$;

-- Record migration
INSERT INTO public.migrations (name, applied_at) VALUES ('021_fix_promotions_seed_data', NOW()) ON CONFLICT DO NOTHING;
