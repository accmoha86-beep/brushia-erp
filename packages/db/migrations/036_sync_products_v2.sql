-- Migration 036: Sync products with latest Excel data (June 2026)
-- Fixes English names, adds missing products, updates prices

SET search_path = catalog, public;

-- ============================================
-- 1. FIX ENGLISH NAME MISMATCHES (by Arabic name)
-- ============================================

-- Air Drop Foundation
UPDATE products SET name = 'Air Drop Foundation Degree 1' WHERE name_ar = 'ايردروب فاونديشن درجة 1' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Air Drop Foundation Degree 3' WHERE name_ar = 'ايردروب فاونديشن درجة 3' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';

-- Lashes combos
UPDATE products SET name = 'Lashes SRF05/SRF08' WHERE name LIKE '%SRF05/SRF08%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Lashes SRF07/SRF08' WHERE name LIKE '%SRF07/SRF08%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';

-- Blusher
UPDATE products SET name = 'Blusher Baby' WHERE name_ar = 'بلاشر Baby' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';

-- Glitter/Pigment renames
UPDATE products SET name = 'Glitter Single 42H' WHERE name_ar = 'بيجمنت سينجل 42H' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Pigment Single 45H' WHERE name_ar = 'بيجمنت سينجل 45H' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Glitter Single 11AH' WHERE name_ar = 'بيجمنت سينجل 11AH' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Lash Book H21' WHERE name_ar = 'لاش بوك H21' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';

-- Beauty Blenders — ORDER MATTERS to avoid name conflicts
UPDATE products SET name = 'Triangle Burgundy Sponge' WHERE name_ar = 'بيوتي بلندر مثلثة' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Beauty Blender S Brown' WHERE name_ar = 'بيوتي بلندر بني جديدة' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Beauty Blender JL Triangle & Circle' WHERE name_ar = 'بيوتي بلندر جيكوب مثلثة وبيضاوية' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';

-- Brush Sets
UPDATE products SET name = 'Esraa El Shaaer Set' WHERE name_ar = 'طقم إسراء الشاعر' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Jacob Silver Set' WHERE name_ar LIKE '%جيكوب السيلفر%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Dalia Darwish Set' WHERE name_ar = 'طقم داليا درويش' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Jacob Green Set' WHERE name_ar = 'طقم جيكوب' AND name LIKE '%Jacob%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Jacob Set (Live Numbered)' WHERE name_ar LIKE '%ترقيم اللايف%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Jacob White Set' WHERE name_ar LIKE '%جيكوب الأبيض%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Jacob Purple Set (Numbered)' WHERE name_ar LIKE '%جيكوب الموف%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'White Double Set' WHERE name_ar = 'طقم أبيض دابل' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';

-- Brushes
UPDATE products SET name = 'Eye Brow Black Brush' WHERE name_ar = 'فرشة حواجب سوداء' AND name LIKE '%Jacob%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Double Eye Brow Brush' WHERE name_ar = 'فرشة دابل حواجب' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Double Concealer & Powder Brush' WHERE name_ar = 'فرشة دابل كونسيلر وباودر' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Double Liquid & Powder Brush' WHERE name_ar = 'فرشة دابل ليكويد وباودر' AND name NOT LIKE '%Brown%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Double Liquid & Powder Brush Brown' WHERE name_ar = 'فرشة دابل ليكويد وباودر بني' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Double Blusher Brush Brown' WHERE name_ar = 'فرشة دبل بلاشر بني' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Massouma Brush' WHERE name_ar = 'فرشة معصومة' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Goat Hair Double Powder Brush' WHERE name_ar LIKE '%بودر%جوت هير%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Goat Hair Double Foundation Brush' WHERE name_ar LIKE '%فونديشن%جوت هير%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Jacob Double Black Brush' WHERE name_ar = 'فرشة جيكوب سوداء' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Jacob Blend Eye Brush' WHERE name_ar = 'فرشة دمج جيكوب' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';

-- Eye brow pencils
UPDATE products SET name = 'White Eye Brow Pencil Deep Brown' WHERE name_ar = 'قلم حواجب أبيض ديب براون' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'White Eye Brow Pencil Soft Black' WHERE name_ar = 'قلم حواجب أبيض سوفت بلاك' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'White Eye Brow Pencil Light Brown' WHERE name_ar = 'قلم حواجب أبيض لايت براون' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Gold Eye Brow Pencil JL1' WHERE name_ar = 'قلم حواجب جيكوب JL1' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Gold Eye Brow Pencil JL3' WHERE name_ar = 'قلم حواجب جيكوب JL3' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';

-- Gel Liners / Kohl
UPDATE products SET name = 'Kohl Green' WHERE name_ar = 'كحل أخضر' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Kohl Black' WHERE name_ar = 'كحل أسود' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Gel Liner Burgundy' WHERE name_ar = 'كحل برجندي' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Gel Liner Dark Brown' WHERE name_ar = 'كحل دارك براون' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';

-- Fix Arabic names for glitters
UPDATE products SET name_ar = 'بيجمنت 4H' WHERE name = 'Glitter H4' AND name_ar LIKE 'جليتر%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name_ar = 'بيجمنت 12H' WHERE name = 'Glitter H12' AND name_ar LIKE 'جليتر%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name_ar = 'بيجمنت 13H' WHERE name = 'Glitter H13' AND name_ar LIKE 'جليتر%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name_ar = 'بيجمنت 14H' WHERE name = 'Glitter H14' AND name_ar LIKE 'جليتر%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name_ar = 'بيجمنت 1H' WHERE name = 'Glitter H1' AND name_ar LIKE 'جليتر%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name_ar = 'بيجمنت درجة 11' WHERE name = 'Glitter H11' AND name_ar LIKE 'جليتر%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';

-- Puff/sponge names
UPDATE products SET name = 'Puff Set' WHERE name_ar = 'سيت باف' AND NOT name_ar LIKE '%أسود%' AND NOT name_ar LIKE '%بينك%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Puff Set Black' WHERE name_ar LIKE '%سيت باف أسود%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET name = 'Puff Set Pink' WHERE name_ar = 'سيت باف بينك' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';

-- ============================================
-- 2. ADD MISSING PRODUCTS
-- ============================================

-- Lashes
INSERT INTO products (id, tenant_id, category_id, name, name_ar, sku, slug, base_price, cost_price, is_active, track_inventory)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-00000000000c', 'Lashes 138', 'باكت 138', 'LASH-138', '138-lash-138', 27500, 0, true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name_ar = 'باكت 138' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO products (id, tenant_id, category_id, name, name_ar, sku, slug, base_price, cost_price, is_active, track_inventory)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-00000000000c', 'Lashes Mix', 'باكت ميكس', 'LASH-MIX', '-lash-mix', 27500, 0, true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name_ar = 'باكت ميكس' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

-- Blusher
INSERT INTO products (id, tenant_id, category_id, name, name_ar, sku, slug, base_price, cost_price, is_active, track_inventory)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000017', 'Blusher 014', 'بلاشر 014', 'BLSH-014', '014-blsh-014', 47500, 0, true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name_ar = 'بلاشر 014' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO products (id, tenant_id, category_id, name, name_ar, sku, slug, base_price, cost_price, is_active, track_inventory)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000017', 'Blusher Powder 014', 'بلاشر باودر 014', 'BLSH-PWD-014', '014-blsh-pwd-014', 47500, 0, true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name_ar = 'بلاشر باودر 014' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

-- Glitter
INSERT INTO products (id, tenant_id, category_id, name, name_ar, sku, slug, base_price, cost_price, is_active, track_inventory)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-00000000000a', 'Pigment Single 1H', 'بيجمنت سينجل 1H', 'GLIT-SGL-1H', '1h-glit-sgl-1h', 28500, 0, true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name_ar = 'بيجمنت سينجل 1H' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO products (id, tenant_id, category_id, name, name_ar, sku, slug, base_price, cost_price, is_active, track_inventory)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-00000000000a', 'Pink Palette', 'باليت بينك', 'PALETTE-PINK', '-palette-pink', 180000, 0, true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name_ar = 'باليت بينك' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

-- Beauty Blender
INSERT INTO products (id, tenant_id, category_id, name, name_ar, sku, slug, base_price, cost_price, is_active, track_inventory)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000006', 'Beauty Blender Lemon', 'بيوتي بلندر ليموني', 'BB-LEMON', '-bb-lemon', 26000, 0, true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name_ar = 'بيوتي بلندر ليموني' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO products (id, tenant_id, category_id, name, name_ar, sku, slug, base_price, cost_price, is_active, track_inventory)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000006', 'Jacob Puff Set', 'سيت باف جيكوب', 'BB-JL-PUFF-SET', '-bb-jl-puff-set', 45000, 0, true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name_ar = 'سيت باف جيكوب' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

-- Brushes
INSERT INTO products (id, tenant_id, category_id, name, name_ar, sku, slug, base_price, cost_price, is_active, track_inventory)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-00000000000e', 'Amal Wagih Brush', 'فرشة أمل وجيه', 'BRSH-AMAL', '-brsh-amal', 45000, 0, true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name_ar = 'فرشة أمل وجيه' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO products (id, tenant_id, category_id, name, name_ar, sku, slug, base_price, cost_price, is_active, track_inventory)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-00000000000e', 'Amal Wagih Brush — Exchange', 'فرشة أمل وجيه — مقايضة', 'BRSH-AMAL-EX', '-brsh-amal-ex', 0, 0, true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name_ar LIKE '%أمل وجيه%مقايضة%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO products (id, tenant_id, category_id, name, name_ar, sku, slug, base_price, cost_price, is_active, track_inventory)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-00000000000e', 'Double Blush Brush Brown', 'فرشة بلاشر دابل بني', 'BRSH-DBL-BLUSH-BRN', '-brsh-dbl-blush-brn', 35000, 0, true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name_ar = 'فرشة بلاشر دابل بني' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO products (id, tenant_id, category_id, name, name_ar, sku, slug, base_price, cost_price, is_active, track_inventory)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-00000000000e', 'Gold Eyebrow Cleaning Brush', 'فرشة تنظيف حواجب جولد', 'BRSH-GOLD-EB-CLN', '-brsh-gold-eb-cln', 25000, 0, true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name_ar LIKE '%تنظيف حواجب جولد%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO products (id, tenant_id, category_id, name, name_ar, sku, slug, base_price, cost_price, is_active, track_inventory)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-00000000000e', 'Single Eyeshadow Brush', 'فرشة ايشادو سينجل', 'BRSH-EYESHD-SGL', '-brsh-eyeshd-sgl', 30000, 0, true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name_ar LIKE '%ايشادو سينجل%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

-- Brush Sets
INSERT INTO products (id, tenant_id, category_id, name, name_ar, sku, slug, base_price, cost_price, is_active, track_inventory)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-00000000000f', 'Jacob Green Full Set', 'طقم جيكوب الأخضر', 'BSET-JACOB-GRN-FULL', '-bset-jacob-grn-full', 600000, 0, true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name_ar = 'طقم جيكوب الأخضر' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

INSERT INTO products (id, tenant_id, category_id, name, name_ar, sku, slug, base_price, cost_price, is_active, track_inventory)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-00000000000f', 'Jacob Set Brushes — Exchange', 'فرشة طقم جيكوب — مقايضة', 'BSET-JACOB-EX', '-bset-jacob-ex', 0, 0, true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name_ar LIKE '%طقم جيكوب%مقايضة%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

-- Gel Liner
INSERT INTO products (id, tenant_id, category_id, name, name_ar, sku, slug, base_price, cost_price, is_active, track_inventory)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000007', 'Kohl Light Brown', 'كحل لايت براون', 'KOHL-LB', '-kohl-lb', 45000, 0, true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name_ar = 'كحل لايت براون' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

-- Gift item
INSERT INTO products (id, tenant_id, category_id, name, name_ar, sku, slug, base_price, cost_price, is_active, track_inventory)
SELECT gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-00000000000a', 'Gift — Loose Glitter', 'هدية لوس جليتر', 'GIFT-LOOSE-GLIT', '-gift-loose-glit', 0, 0, true, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name_ar = 'هدية لوس جليتر' AND tenant_id = 'a0000000-0000-0000-0000-000000000001');

-- ============================================
-- 3. UPDATE PRICES (base_price in piasters)
-- ============================================
UPDATE products SET base_price = 45000 WHERE name_ar = 'ايردروب فاونديشن درجة 1' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 45000 WHERE name_ar = 'ايردروب فاونديشن درجة 3' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 55000 WHERE name_ar = 'بلاشر Baby' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 40000 WHERE name_ar = 'بلاشر Love Joey' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 40000 WHERE name_ar = 'بلاشر Perfect Pink' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 40000 WHERE name_ar = 'بلاشر كابتشينو' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 55000 WHERE name_ar = 'بلاشر هايلايتر Mood' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 65000 WHERE name_ar = 'فاونديشن HD001' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 65000 WHERE name_ar = 'فاونديشن HD003' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 65000 WHERE name_ar = 'فاونديشن HD005' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 65000 WHERE name_ar = 'فاونديشن HD006' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 40000 WHERE name_ar = 'فاونديشن HD009' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 60000 WHERE name_ar = 'دروبس 15 مللي' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 25000 WHERE name_ar = 'كونسيلر درجة 14' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 25000 WHERE name_ar = 'كونسيلر درجة 15' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 35000 WHERE name_ar = 'كونسيلر درجة 5' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 35000 WHERE name_ar = 'كونسيلر درجة 7' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 35000 WHERE name_ar = 'كونسيلر درجة 9' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 58000 WHERE name_ar = 'كومباكت باودر بينك' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 45000 WHERE name_ar = 'كومباكت باودر درجة 1' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 55000 WHERE name_ar = 'كومباكت باودر درجة 3' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 55000 WHERE name_ar = 'كومباكت باودر درجة 5' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 15000 WHERE name_ar = 'قلم حواجب جيكوب JL1' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 30000 WHERE name_ar = 'قلم حواجب جيكوب JL3' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 25000 WHERE name_ar LIKE 'قلم حواجب أبيض%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 45000 WHERE name_ar LIKE 'كحل%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 45000 WHERE name_ar LIKE 'جلو سوبر استرونج 10%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 25000 WHERE name_ar LIKE 'جلو سوبر استرونج 5%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 35000 WHERE name_ar LIKE 'بيجمنت%H' AND name_ar NOT LIKE '%سينجل%' AND name_ar NOT LIKE '%درجة%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE products SET base_price = 15000 WHERE name_ar LIKE 'باكت%' AND name_ar NOT LIKE '%خماسي%' AND name_ar NOT LIKE '%ميكس%' AND name_ar NOT LIKE '%DOLL%' AND name_ar NOT LIKE '%SF134%' AND name_ar NOT LIKE '%SF20%' AND name_ar NOT LIKE '%SF22%' AND name_ar NOT LIKE '%SF140%' AND name_ar NOT LIKE '%SF30%' AND name_ar NOT LIKE '%SF32%' AND name_ar NOT LIKE '%SR123%' AND name_ar NOT LIKE '%SR86%' AND name_ar NOT LIKE '%SRF05/SRF08%' AND name_ar NOT LIKE '%SRF07/SRF08%' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';

