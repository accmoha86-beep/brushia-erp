-- Migration 010: Seed Brushia Product Catalog + Warehouses + Chart of Accounts
-- SAFE: Uses only columns from migration 001, adds missing columns first

-- Ensure columns exist (in case earlier migrations failed)
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS selling_price BIGINT DEFAULT 0;
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS barcode VARCHAR(50);
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN DEFAULT true;
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS parent_id UUID;
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
ALTER TABLE accounting.chart_of_accounts ADD COLUMN IF NOT EXISTS code VARCHAR(20);
ALTER TABLE accounting.chart_of_accounts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE accounting.chart_of_accounts ADD COLUMN IF NOT EXISTS is_bank_account BOOLEAN DEFAULT false;

-- ═══════════════════════════════════════════════════════
-- CATEGORIES (6 main product categories)
-- Columns from 001: id, tenant_id, parent_id, name, name_ar, slug, description, image_url, sort_order, is_active
-- ═══════════════════════════════════════════════════════
INSERT INTO catalog.categories (id, tenant_id, name, name_ar, slug, sort_order, image_url, is_active)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Makeup', 'مكياج', 'makeup', 1, 'https://img.icons8.com/color/96/lipstick.png', true),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Lashes', 'رموش', 'lashes', 2, 'https://img.icons8.com/color/96/eyelash.png', true),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Concealer', 'كونسيلر', 'concealer', 3, 'https://img.icons8.com/color/96/concealer.png', true),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Brushes', 'فرش', 'brushes', 4, 'https://img.icons8.com/color/96/paint-brush.png', true),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Brush Sets', 'أطقم فرش', 'brush-sets', 5, 'https://img.icons8.com/color/96/paint-palette.png', true),
  ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Lip Products', 'منتجات الشفاه', 'lip-products', 6, 'https://img.icons8.com/color/96/lips.png', true)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- BRAND
-- ═══════════════════════════════════════════════════════
INSERT INTO catalog.brands (id, tenant_id, name, name_ar, slug)
VALUES ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Brushia', 'بروشيا', 'brushia')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- PRODUCTS (24 Brushia products)
-- Using ONLY columns from migration 001: id, tenant_id, category_id, brand_id, sku, name, name_ar, slug, description, product_type, base_price, cost_price, tax_rate, status
-- ═══════════════════════════════════════════════════════
INSERT INTO catalog.products (id, tenant_id, category_id, brand_id, sku, name, name_ar, slug, description, product_type, base_price, cost_price, tax_rate, status) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'BRS-FDN-001', 'Full Coverage Foundation', 'فاونديشن تغطية كاملة', 'full-coverage-foundation', 'Long-lasting full coverage foundation', 'variable', 35000, 12000, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'BRS-PWD-001', 'Setting Powder Matte', 'بودرة تثبيت مات', 'setting-powder-matte', 'Ultra-fine matte setting powder', 'simple', 25000, 8000, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'BRS-BLH-001', 'Blush Palette 4-Color', 'باليت بلاشر 4 ألوان', 'blush-palette-4-color', '4 buildable blush shades', 'simple', 22000, 7000, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'BRS-CTR-001', 'Contour Kit 3-in-1', 'كيت كونتور 3 في 1', 'contour-kit-3-in-1', 'Contour, highlight and bronzer trio', 'simple', 28000, 9000, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'BRS-EYE-001', 'Eyeshadow Palette 18-Color', 'باليت ايشادو 18 لون', 'eyeshadow-palette-18-color', 'Versatile 18-shade eyeshadow palette', 'simple', 38000, 12000, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'BRS-PRM-001', 'Face Primer Hydrating', 'برايمر مرطب للوجه', 'face-primer-hydrating', 'Hydrating primer for smooth application', 'simple', 20000, 6500, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'BRS-SPR-001', 'Setting Spray Long-Wear', 'سبراي تثبيت طويل الأمد', 'setting-spray-long-wear', '16-hour long-wear setting spray', 'simple', 16000, 5000, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'BRS-MSC-001', 'Volumizing Mascara', 'ماسكارا تكثيف', 'volumizing-mascara', 'Dramatic volume mascara', 'simple', 14000, 4500, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'BRS-ELN-001', 'Liquid Eyeliner Pen', 'قلم آيلاينر سائل', 'liquid-eyeliner-pen', 'Precision tip waterproof eyeliner', 'simple', 10000, 3000, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'BRS-BRW-001', 'Brow Pencil Micro', 'قلم حواجب دقيق', 'brow-pencil-micro', 'Ultra-fine micro brow pencil', 'simple', 8000, 2500, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'BRS-CON-001', 'Liquid Concealer HD', 'كونسيلر سائل HD', 'liquid-concealer-hd', 'Full coverage HD liquid concealer', 'variable', 18000, 6000, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'BRS-CON-002', 'Creamy Concealer Stick', 'كونسيلر كريمي ستيك', 'creamy-concealer-stick', 'Easy-blend creamy concealer', 'simple', 15000, 5000, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'BRS-LSH-001', '3D Mink Lashes Natural', 'رموش مينك 3D طبيعية', '3d-mink-lashes-natural', 'Lightweight natural lashes', 'simple', 12000, 3000, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'BRS-LSH-002', '3D Mink Lashes Dramatic', 'رموش مينك 3D دراماتيك', '3d-mink-lashes-dramatic', 'Bold dramatic lashes', 'simple', 15000, 4000, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'BRS-LSH-003', 'Magnetic Lashes Set', 'طقم رموش مغناطيسية', 'magnetic-lashes-set', 'Reusable magnetic lashes with eyeliner', 'simple', 22000, 7000, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'BRS-BRH-001', 'Foundation Brush Pro', 'فرشة فاونديشن احترافية', 'foundation-brush-pro', 'Pro-grade foundation brush', 'simple', 8000, 2500, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'BRS-BRH-002', 'Powder Brush Large', 'فرشة بودرة كبيرة', 'powder-brush-large', 'Large fluffy powder brush', 'simple', 7000, 2200, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'BRS-BRH-003', 'Contour Brush Angled', 'فرشة كونتور مائلة', 'contour-brush-angled', 'Angled contour brush', 'simple', 6500, 2000, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'BRS-BRH-004', 'Eyeshadow Brush Set (3pc)', 'طقم فرش ايشادو', 'eyeshadow-brush-set-3pc', 'Essential eyeshadow brush trio', 'simple', 12000, 3500, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001', 'BRS-SET-001', 'Complete Brush Set 12pc', 'طقم فرش كامل 12 قطعة', 'complete-brush-set-12pc', 'Professional 12-piece collection', 'simple', 45000, 15000, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001', 'BRS-SET-002', 'Travel Brush Set 6pc', 'طقم فرش سفر 6 قطع', 'travel-brush-set-6pc', 'Compact 6-piece travel set', 'simple', 28000, 9000, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001', 'BRS-SET-003', 'Luxury Rose Gold Set 15pc', 'طقم فرش روز جولد فاخر', 'luxury-rose-gold-set-15pc', 'Premium 15-piece rose gold set', 'simple', 65000, 22000, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000001', 'BRS-LIP-001', 'Matte Liquid Lipstick', 'روج سائل مات', 'matte-liquid-lipstick', 'Intensely pigmented matte lipstick', 'variable', 12000, 3500, '14.00', 'active'),
  ('f0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000001', 'BRS-LIP-002', 'Lip Gloss Shimmer', 'جلوس شيمر', 'lip-gloss-shimmer', 'High-shine shimmer lip gloss', 'simple', 10000, 3000, '14.00', 'active')
ON CONFLICT (id) DO NOTHING;

-- Populate selling_price from base_price for all inserted products
UPDATE catalog.products SET selling_price = base_price WHERE selling_price IS NULL OR selling_price = 0;

-- ═══════════════════════════════════════════════════════
-- PRODUCT VARIANTS (13 color variants)
-- Columns from 001: id, tenant_id, product_id, sku, name, color, color_hex, sort_order
-- ═══════════════════════════════════════════════════════
INSERT INTO catalog.product_variants (id, tenant_id, product_id, sku, name, color, color_hex, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'BRS-FDN-001-IV', 'Ivory', 'Ivory', '#FFFFF0', 1),
  ('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'BRS-FDN-001-BG', 'Beige', 'Beige', '#F5F5DC', 2),
  ('10000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'BRS-FDN-001-SD', 'Sand', 'Sand', '#C2B280', 3),
  ('10000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'BRS-FDN-001-HN', 'Honey', 'Honey', '#EB9605', 4),
  ('10000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'BRS-FDN-001-CR', 'Caramel', 'Caramel', '#FFD59A', 5),
  ('10000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'BRS-CON-001-LT', 'Light', 'Light', '#FAE7D0', 1),
  ('10000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'BRS-CON-001-MD', 'Medium', 'Medium', '#D2A679', 2),
  ('10000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'BRS-CON-001-DK', 'Dark', 'Dark', '#8B6914', 3),
  ('10000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000015', 'BRS-LIP-001-RD', 'Ruby Red', 'Ruby Red', '#9B111E', 1),
  ('10000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000015', 'BRS-LIP-001-ND', 'Nude Rose', 'Nude Rose', '#E8C4B8', 2),
  ('10000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000015', 'BRS-LIP-001-BR', 'Berry', 'Berry', '#8E4585', 3),
  ('10000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000015', 'BRS-LIP-001-MV', 'Mauve', 'Mauve', '#E0B0FF', 4),
  ('10000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000015', 'BRS-LIP-001-PK', 'Pink', 'Pink', '#FF69B4', 5)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- WAREHOUSES
-- Columns from 001: id, tenant_id, code, name, name_ar, warehouse_type, city, governorate, is_active, is_default
-- ═══════════════════════════════════════════════════════
INSERT INTO inventory.warehouses (id, tenant_id, code, name, name_ar, warehouse_type, city, governorate, is_active, is_default) VALUES
  ('20000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'WH-MAIN', 'Main Warehouse', 'المستودع الرئيسي', 'standard', 'Cairo', 'Cairo', true, true),
  ('20000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'WH-ALEX', 'Alexandria Branch', 'فرع الإسكندرية', 'standard', 'Alexandria', 'Alexandria', true, false),
  ('20000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'WH-EXPO', 'Exhibition Stock', 'مخزون المعارض', 'standard', 'Cairo', 'Cairo', true, false)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- STOCK LEVELS
-- Columns from 001: tenant_id, product_id, variant_id, warehouse_id, qty_on_hand, qty_reserved, reorder_point, reorder_qty
-- ═══════════════════════════════════════════════════════
INSERT INTO inventory.stock_levels (tenant_id, product_id, variant_id, warehouse_id, qty_on_hand, qty_reserved, reorder_point, reorder_qty) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 50, 0, 10, 30),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 45, 0, 10, 30),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 60, 0, 10, 30),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 35, 0, 10, 30),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 40, 0, 10, 30),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', NULL, '20000000-0000-0000-0000-000000000001', 80, 0, 15, 40),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000005', NULL, '20000000-0000-0000-0000-000000000001', 150, 0, 30, 80),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000006', NULL, '20000000-0000-0000-0000-000000000001', 120, 0, 25, 60),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000008', NULL, '20000000-0000-0000-0000-000000000001', 45, 0, 10, 25),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000012', NULL, '20000000-0000-0000-0000-000000000001', 15, 0, 5, 10),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000014', NULL, '20000000-0000-0000-0000-000000000001', 8, 0, 3, 5),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000001', 45, 0, 10, 25),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000001', 60, 0, 10, 25),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000016', NULL, '20000000-0000-0000-0000-000000000001', 65, 0, 15, 30)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- POS REGISTERS
-- Columns from 006: id, tenant_id, name, code, location_id, is_active
-- ═══════════════════════════════════════════════════════
INSERT INTO pos.registers (id, tenant_id, name, code, location_id, is_active) VALUES
  ('30000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Cairo Main Register', 'POS-001', '20000000-0000-0000-0000-000000000001', true),
  ('30000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Alexandria Register', 'POS-002', '20000000-0000-0000-0000-000000000002', true)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- CHART OF ACCOUNTS
-- Columns from 001: id, tenant_id, account_number, name, name_ar, account_type, parent_id, is_system, is_active, currency
-- ═══════════════════════════════════════════════════════
INSERT INTO accounting.chart_of_accounts (id, tenant_id, account_number, name, name_ar, account_type, parent_id, is_system, is_active, currency) VALUES
  ('40000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '1000', 'Assets', 'الأصول', 'asset', NULL, true, true, 'EGP'),
  ('40000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '1100', 'Cash and Bank', 'النقدية والبنوك', 'asset', '40000000-0000-0000-0000-000000000001', false, true, 'EGP'),
  ('40000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '1200', 'Accounts Receivable', 'ذمم مدينة', 'asset', '40000000-0000-0000-0000-000000000001', false, true, 'EGP'),
  ('40000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '1300', 'Inventory', 'المخزون', 'asset', '40000000-0000-0000-0000-000000000001', true, true, 'EGP'),
  ('40000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '2000', 'Liabilities', 'الالتزامات', 'liability', NULL, true, true, 'EGP'),
  ('40000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', '2100', 'Accounts Payable', 'ذمم دائنة', 'liability', '40000000-0000-0000-0000-000000000005', false, true, 'EGP'),
  ('40000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', '2200', 'VAT Payable 14 Percent', 'ضريبة القيمة المضافة', 'liability', '40000000-0000-0000-0000-000000000005', true, true, 'EGP'),
  ('40000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', '3000', 'Equity', 'حقوق الملكية', 'equity', NULL, true, true, 'EGP'),
  ('40000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', '3100', 'Owner Capital', 'رأس المال', 'equity', '40000000-0000-0000-0000-000000000008', false, true, 'EGP'),
  ('40000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', '3200', 'Retained Earnings', 'أرباح محتجزة', 'equity', '40000000-0000-0000-0000-000000000008', true, true, 'EGP'),
  ('40000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', '4000', 'Revenue', 'الإيرادات', 'revenue', NULL, true, true, 'EGP'),
  ('40000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', '4100', 'Sales Revenue', 'إيرادات المبيعات', 'revenue', '40000000-0000-0000-0000-000000000011', true, true, 'EGP'),
  ('40000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', '5000', 'Cost of Goods Sold', 'تكلفة البضاعة المباعة', 'expense', NULL, true, true, 'EGP'),
  ('40000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', '5100', 'COGS Products', 'تكلفة المنتجات', 'expense', '40000000-0000-0000-0000-000000000013', true, true, 'EGP'),
  ('40000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', '6000', 'Operating Expenses', 'مصاريف تشغيلية', 'expense', NULL, true, true, 'EGP'),
  ('40000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', '6100', 'Rent Expense', 'مصاريف إيجار', 'expense', '40000000-0000-0000-0000-000000000015', false, true, 'EGP'),
  ('40000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000001', '6200', 'Salaries and Wages', 'رواتب وأجور', 'expense', '40000000-0000-0000-0000-000000000015', false, true, 'EGP'),
  ('40000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000001', '6300', 'Shipping Costs', 'مصاريف شحن', 'expense', '40000000-0000-0000-0000-000000000015', false, true, 'EGP')
ON CONFLICT (id) DO NOTHING;

-- Set code = account_number for accounting
UPDATE accounting.chart_of_accounts SET code = account_number WHERE code IS NULL;
