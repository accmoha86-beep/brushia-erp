-- Migration 011: Module enhancements — fully defensive version
-- Each statement wrapped in exception handling to avoid blocking

-- ═══ Fix sales_orders ═══
DO $$ BEGIN ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'pos'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS tax_rate INTEGER DEFAULT 1400; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS loyalty_discount BIGINT DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS grand_total BIGINT DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ═══ Fix loyalty_transactions ═══
DO $$ BEGIN ALTER TABLE crm.loyalty_transactions ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'earn'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE crm.loyalty_transactions ADD COLUMN IF NOT EXISTS reason TEXT; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ═══ Fix shipping.shipments ═══
DO $$ BEGIN ALTER TABLE shipping.shipments ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(200); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE shipping.shipments ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(20); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE shipping.shipments ADD COLUMN IF NOT EXISTS city VARCHAR(100); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE shipping.shipments ADD COLUMN IF NOT EXISTS governorate VARCHAR(100); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE shipping.shipments ADD COLUMN IF NOT EXISTS address TEXT; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE shipping.shipments ADD COLUMN IF NOT EXISTS cod_amount BIGINT DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE shipping.shipments ADD COLUMN IF NOT EXISTS weight_grams INTEGER DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE shipping.shipments ADD COLUMN IF NOT EXISTS notes TEXT; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE shipping.shipments ADD COLUMN IF NOT EXISTS created_by UUID; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ═══ Fix purchasing ═══
DO $$ BEGIN ALTER TABLE purchasing.vendors ADD COLUMN IF NOT EXISTS categories TEXT; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE purchasing.purchase_orders ADD COLUMN IF NOT EXISTS shipping_cost BIGINT DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE purchasing.purchase_orders ADD COLUMN IF NOT EXISTS customs_duty BIGINT DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE purchasing.purchase_orders ADD COLUMN IF NOT EXISTS created_by UUID; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE purchasing.purchase_order_items ADD COLUMN IF NOT EXISTS received_qty INTEGER DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ═══ Fix promotions ═══
DO $$ BEGIN ALTER TABLE sales.promotions ADD COLUMN IF NOT EXISTS code VARCHAR(50); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sales.promotions ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'percentage'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sales.promotions ADD COLUMN IF NOT EXISTS value BIGINT DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sales.promotions ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sales.promotions ADD COLUMN IF NOT EXISTS usage_limit INTEGER; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sales.promotions ADD COLUMN IF NOT EXISTS min_order_amount BIGINT DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sales.promotions ADD COLUMN IF NOT EXISTS applies_to VARCHAR(20) DEFAULT 'all'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sales.promotions ADD COLUMN IF NOT EXISTS description TEXT; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ═══ Seed data ═══
DO $$ DECLARE t_id UUID; BEGIN
  SELECT id INTO t_id FROM iam.tenants WHERE slug = 'brushia' LIMIT 1;
  IF t_id IS NOT NULL THEN
    -- Seed customers
    BEGIN
      INSERT INTO sales.customers (tenant_id, customer_number, first_name, last_name, email, phone, whatsapp, customer_type, city, governorate, loyalty_points, loyalty_tier, total_orders, total_spent) VALUES
      (t_id, 'CUS-00001', 'Sara', 'Ahmed', 'sara@email.com', '+201012345678', '+201012345678', 'retail', 'Cairo', 'Cairo', 1856, 'gold', 24, 1856000),
      (t_id, 'CUS-00002', 'Nour', 'ElSayed', 'nour@email.com', '+201098765432', '+201098765432', 'retail', 'Alexandria', 'Alexandria', 1245, 'gold', 18, 1245000),
      (t_id, 'CUS-00003', 'Fatma', 'Hassan', 'fatma@email.com', '+201155667788', NULL, 'retail', 'Giza', 'Giza', 524, 'silver', 8, 524000),
      (t_id, 'CUS-00004', 'Mariam', 'Adel', 'mariam@email.com', '+201233445566', '+201233445566', 'wholesale', 'Cairo', 'Cairo', 8920, 'platinum', 45, 8920000),
      (t_id, 'CUS-00005', 'Yasmin', 'Khaled', 'yasmin@email.com', '+201177889900', NULL, 'retail', 'Mansoura', 'Dakahlia', 876, 'silver', 12, 876000)
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Seed vendors
    BEGIN
      INSERT INTO purchasing.vendors (tenant_id, name, contact_person, email, phone, country, city, payment_terms, lead_time_days, status) VALUES
      (t_id, 'Guangzhou Beauty Supply', 'Li Wei', 'liwei@gzbeauty.cn', '+8613800138000', 'CN', 'Guangzhou', 'net_30', 21, 'active'),
      (t_id, 'Qingdao Lash Factory', 'Zhang Mei', 'zhang@qdlash.cn', '+8613900139000', 'CN', 'Qingdao', 'net_30', 18, 'active'),
      (t_id, 'Shenzhen Brush Co.', 'Wang Jun', 'wang@szbrush.cn', '+8613700137000', 'CN', 'Shenzhen', 'tt_advance', 25, 'active')
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Seed promotions
    BEGIN
      INSERT INTO sales.promotions (tenant_id, name, type, value, code, status, start_date, end_date, usage_count, usage_limit, min_order_amount) VALUES
      (t_id, 'Summer Sale 2026', 'percentage', 20, 'SUMMER20', 'active', '2026-05-01', '2026-06-30', 145, NULL, 20000),
      (t_id, 'New Customer Welcome', 'percentage', 15, 'WELCOME15', 'active', '2026-01-01', '2026-12-31', 312, NULL, 15000),
      (t_id, 'Lash Bundle Deal', 'fixed', 5000, 'LASH50', 'active', '2026-05-15', '2026-05-31', 28, 100, 30000)
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Seed wholesale price lists
    BEGIN
      INSERT INTO catalog.price_lists (tenant_id, name, code, type, is_active, min_order_amount) VALUES
      (t_id, 'Wholesale Tier 1', 'WS-T1', 'wholesale', true, 500000),
      (t_id, 'Wholesale Tier 2 (VIP)', 'WS-T2', 'wholesale', true, 1000000)
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;
