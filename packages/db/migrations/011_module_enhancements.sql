-- Migration 011: Module enhancements for new API endpoints
-- Adds missing columns and seed data for customers, vendors, promotions, shipping

-- ═══ Fix sales_orders table (missing columns used by sales/POS service) ═══
ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'pos';
ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);
ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS tax_rate INTEGER DEFAULT 1400;
ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS loyalty_discount BIGINT DEFAULT 0;
ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS grand_total BIGINT DEFAULT 0;

-- ═══ Fix loyalty_transactions table ═══
ALTER TABLE crm.loyalty_transactions ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'earn';
ALTER TABLE crm.loyalty_transactions ADD COLUMN IF NOT EXISTS reason TEXT;

-- ═══ Fix shipping.shipments table ═══
ALTER TABLE shipping.shipments ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(200);
ALTER TABLE shipping.shipments ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(20);
ALTER TABLE shipping.shipments ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE shipping.shipments ADD COLUMN IF NOT EXISTS governorate VARCHAR(100);
ALTER TABLE shipping.shipments ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE shipping.shipments ADD COLUMN IF NOT EXISTS cod_amount BIGINT DEFAULT 0;
ALTER TABLE shipping.shipments ADD COLUMN IF NOT EXISTS weight_grams INTEGER DEFAULT 0;
ALTER TABLE shipping.shipments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE shipping.shipments ADD COLUMN IF NOT EXISTS created_by UUID;

-- ═══ Fix purchasing tables ═══
ALTER TABLE purchasing.vendors ADD COLUMN IF NOT EXISTS categories TEXT;
ALTER TABLE purchasing.purchase_orders ADD COLUMN IF NOT EXISTS shipping_cost BIGINT DEFAULT 0;
ALTER TABLE purchasing.purchase_orders ADD COLUMN IF NOT EXISTS customs_duty BIGINT DEFAULT 0;
ALTER TABLE purchasing.purchase_orders ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE purchasing.purchase_order_items ADD COLUMN IF NOT EXISTS received_qty INTEGER DEFAULT 0;

-- ═══ Fix promotions table ═══
ALTER TABLE sales.promotions ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE sales.promotions ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'percentage';
ALTER TABLE sales.promotions ADD COLUMN IF NOT EXISTS value BIGINT DEFAULT 0;
ALTER TABLE sales.promotions ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE sales.promotions ADD COLUMN IF NOT EXISTS usage_limit INTEGER;
ALTER TABLE sales.promotions ADD COLUMN IF NOT EXISTS min_order_amount BIGINT DEFAULT 0;
ALTER TABLE sales.promotions ADD COLUMN IF NOT EXISTS applies_to VARCHAR(20) DEFAULT 'all';
ALTER TABLE sales.promotions ADD COLUMN IF NOT EXISTS description TEXT;

-- ═══ Seed sample customers ═══
DO $$ DECLARE t_id UUID; BEGIN
  SELECT id INTO t_id FROM iam.tenants WHERE slug = 'brushia' LIMIT 1;
  IF t_id IS NOT NULL THEN
    INSERT INTO sales.customers (tenant_id, customer_number, first_name, last_name, email, phone, whatsapp, customer_type, city, governorate, loyalty_points, loyalty_tier, total_orders, total_spent) VALUES
    (t_id, 'CUS-00001', 'Sara', 'Ahmed', 'sara@email.com', '+201012345678', '+201012345678', 'retail', 'Cairo', 'Cairo', 1856, 'gold', 24, 1856000),
    (t_id, 'CUS-00002', 'Nour', 'ElSayed', 'nour@email.com', '+201098765432', '+201098765432', 'retail', 'Alexandria', 'Alexandria', 1245, 'gold', 18, 1245000),
    (t_id, 'CUS-00003', 'Fatma', 'Hassan', 'fatma@email.com', '+201155667788', NULL, 'retail', 'Giza', 'Giza', 524, 'silver', 8, 524000),
    (t_id, 'CUS-00004', 'Mariam', 'Adel', 'mariam@email.com', '+201233445566', '+201233445566', 'wholesale', 'Cairo', 'Cairo', 8920, 'platinum', 45, 8920000),
    (t_id, 'CUS-00005', 'Yasmin', 'Khaled', 'yasmin@email.com', '+201177889900', NULL, 'retail', 'Mansoura', 'Dakahlia', 876, 'silver', 12, 876000),
    (t_id, 'CUS-00006', 'Hana', 'Mostafa', 'hana@email.com', '+201066778899', NULL, 'retail', 'Tanta', 'Gharbia', 345, 'bronze', 6, 345000),
    (t_id, 'CUS-00007', 'Aya', 'Ibrahim', 'aya@email.com', '+201244556677', '+201244556677', 'retail', 'Cairo', 'Cairo', 2340, 'platinum', 31, 2340000),
    (t_id, 'CUS-00008', 'Dina', 'Fawzy', 'dina@email.com', '+201099887766', NULL, 'retail', 'Cairo', 'Cairo', 156, 'bronze', 4, 156000),
    (t_id, 'CUS-00009', 'Reem', 'Gamal', 'reem@email.com', '+201122334455', '+201122334455', 'wholesale', 'Aswan', 'Aswan', 4560, 'platinum', 22, 4560000),
    (t_id, 'CUS-00010', 'Layla', 'Osman', 'layla@email.com', '+201088776655', NULL, 'retail', 'Luxor', 'Luxor', 230, 'bronze', 3, 230000)
    ON CONFLICT DO NOTHING;

    -- Seed vendors
    INSERT INTO purchasing.vendors (tenant_id, name, contact_person, email, phone, country, city, payment_terms, lead_time_days, status) VALUES
    (t_id, 'Guangzhou Beauty Supply', 'Li Wei', 'liwei@gzbeauty.cn', '+8613800138000', 'CN', 'Guangzhou', 'net_30', 21, 'active'),
    (t_id, 'Qingdao Lash Factory', 'Zhang Mei', 'zhang@qdlash.cn', '+8613900139000', 'CN', 'Qingdao', 'net_30', 18, 'active'),
    (t_id, 'Shenzhen Brush Co.', 'Wang Jun', 'wang@szbrush.cn', '+8613700137000', 'CN', 'Shenzhen', 'tt_advance', 25, 'active'),
    (t_id, 'Cairo Packaging House', 'Ahmed Samir', 'ahmed@cairopkg.com', '+201050505050', 'EG', 'Cairo', 'net_15', 5, 'active'),
    (t_id, 'Yiwu Cosmetics Mall', 'Chen Ling', 'chen@ywcos.cn', '+8613600136000', 'CN', 'Yiwu', 'net_45', 30, 'active')
    ON CONFLICT DO NOTHING;

    -- Seed promotions
    INSERT INTO sales.promotions (tenant_id, name, type, value, code, status, start_date, end_date, usage_count, usage_limit, min_order_amount) VALUES
    (t_id, 'Summer Sale 2026', 'percentage', 20, 'SUMMER20', 'active', '2026-05-01', '2026-06-30', 145, NULL, 20000),
    (t_id, 'New Customer Welcome', 'percentage', 15, 'WELCOME15', 'active', '2026-01-01', '2026-12-31', 312, NULL, 15000),
    (t_id, 'Lash Bundle Deal', 'fixed', 5000, 'LASH50', 'active', '2026-05-15', '2026-05-31', 28, 100, 30000),
    (t_id, 'VIP Exclusive', 'percentage', 25, 'VIP25', 'active', '2026-05-01', '2026-05-31', 67, 200, 50000),
    (t_id, 'Eid Collection Launch', 'percentage', 10, 'EID10', 'scheduled', '2026-06-15', '2026-06-30', 0, 500, 25000)
    ON CONFLICT DO NOTHING;

    -- Seed wholesale price list
    INSERT INTO catalog.price_lists (tenant_id, name, code, type, is_active, min_order_amount) VALUES
    (t_id, 'Wholesale Tier 1', 'WS-T1', 'wholesale', true, 500000),
    (t_id, 'Wholesale Tier 2 (VIP)', 'WS-T2', 'wholesale', true, 1000000)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Migration tracking is handled automatically by the migration runner
