-- Migration 038: Update inventory/stock levels from June 2026 Excel
-- Sets qty_on_hand in inventory.stock_levels to match physical count

SET search_path = inventory, catalog, public;

-- FOUNDATION: HD001 = 45
UPDATE inventory.stock_levels SET qty_on_hand = 45
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Foundation HD001%' OR name LIKE 'Foundation %HD001%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- FOUNDATION: HD002 = 29
UPDATE inventory.stock_levels SET qty_on_hand = 29
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Foundation HD002%' OR name LIKE 'Foundation %HD002%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- FOUNDATION: HD004 = 8
UPDATE inventory.stock_levels SET qty_on_hand = 8
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Foundation HD004%' OR name LIKE 'Foundation %HD004%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- FOUNDATION: HD005 = 29
UPDATE inventory.stock_levels SET qty_on_hand = 29
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Foundation HD005%' OR name LIKE 'Foundation %HD005%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- FOUNDATION: GD006 = 31
UPDATE inventory.stock_levels SET qty_on_hand = 31
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Foundation GD006%' OR name LIKE 'Foundation %GD006%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- FOUNDATION: HD008 = 50
UPDATE inventory.stock_levels SET qty_on_hand = 50
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Foundation HD008%' OR name LIKE 'Foundation %HD008%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- FOUNDATION: HD009 = 79
UPDATE inventory.stock_levels SET qty_on_hand = 79
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Foundation HD009%' OR name LIKE 'Foundation %HD009%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- FOUNDATION: HD011 = 66
UPDATE inventory.stock_levels SET qty_on_hand = 66
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Foundation HD011%' OR name LIKE 'Foundation %HD011%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- FOUNDATION: HD012 = 39
UPDATE inventory.stock_levels SET qty_on_hand = 39
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Foundation HD012%' OR name LIKE 'Foundation %HD012%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- CONCEALER: #5 = 7
UPDATE inventory.stock_levels SET qty_on_hand = 7
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Concealer #5%' OR name LIKE 'Concealer %#5%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- CONCEALER: #6 = 58
UPDATE inventory.stock_levels SET qty_on_hand = 58
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Concealer #6%' OR name LIKE 'Concealer %#6%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- CONCEALER: #9 = 49
UPDATE inventory.stock_levels SET qty_on_hand = 49
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Concealer #9%' OR name LIKE 'Concealer %#9%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- CONCEALER: #14 = 65
UPDATE inventory.stock_levels SET qty_on_hand = 65
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Concealer #14%' OR name LIKE 'Concealer %#14%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- CONCEALER: #15 = 156
UPDATE inventory.stock_levels SET qty_on_hand = 156
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Concealer #15%' OR name LIKE 'Concealer %#15%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- CONCEALER: #135 = 83
UPDATE inventory.stock_levels SET qty_on_hand = 83
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Concealer #135%' OR name LIKE 'Concealer %#135%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- COMPACT POWDER: C01 = 57
UPDATE inventory.stock_levels SET qty_on_hand = 57
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Compact Powder C01%' OR name LIKE 'Compact Powder %C01%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- COMPACT POWDER: C02 = 1
UPDATE inventory.stock_levels SET qty_on_hand = 1
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Compact Powder C02%' OR name LIKE 'Compact Powder %C02%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- COMPACT POWDER: C03 = 86
UPDATE inventory.stock_levels SET qty_on_hand = 86
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Compact Powder C03%' OR name LIKE 'Compact Powder %C03%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- COMPACT POWDER: C04 = 218
UPDATE inventory.stock_levels SET qty_on_hand = 218
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Compact Powder C04%' OR name LIKE 'Compact Powder %C04%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- COMPACT POWDER: C05 = 99
UPDATE inventory.stock_levels SET qty_on_hand = 99
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Compact Powder C05%' OR name LIKE 'Compact Powder %C05%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- COMPACT POWDER: C06 = 122
UPDATE inventory.stock_levels SET qty_on_hand = 122
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Compact Powder C06%' OR name LIKE 'Compact Powder %C06%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- COMPACT POWDER: C07 = 14
UPDATE inventory.stock_levels SET qty_on_hand = 14
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Compact Powder C07%' OR name LIKE 'Compact Powder %C07%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- FILTERS: Primer = 25
UPDATE inventory.stock_levels SET qty_on_hand = 25
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Primer%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- FILTERS: Tan #5 = 85
UPDATE inventory.stock_levels SET qty_on_hand = 85
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Tan%#5%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- AIR DROP FOUNDATION: B01 = 862
UPDATE inventory.stock_levels SET qty_on_hand = 862
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Air Drop Foundation B01%' OR name LIKE 'Air Drop Foundation %B01%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- AIR DROP FOUNDATION: B02 = 578
UPDATE inventory.stock_levels SET qty_on_hand = 578
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Air Drop Foundation B02%' OR name LIKE 'Air Drop Foundation %B02%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- AIR DROP FOUNDATION: S1 = 433
UPDATE inventory.stock_levels SET qty_on_hand = 433
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Air Drop Foundation S1%' OR name LIKE 'Air Drop Foundation %S1%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- AIR DROP FOUNDATION: S2 = 274
UPDATE inventory.stock_levels SET qty_on_hand = 274
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Air Drop Foundation S2%' OR name LIKE 'Air Drop Foundation %S2%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BEAUTY BLENDER: Dalia = 504
UPDATE inventory.stock_levels SET qty_on_hand = 504
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Dalia%' AND category_id = 'c1000000-0000-0000-0000-000000000006') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BEAUTY BLENDER: Green = 250
UPDATE inventory.stock_levels SET qty_on_hand = 250
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Green%' AND category_id = 'c1000000-0000-0000-0000-000000000006') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BEAUTY BLENDER: Black = 478
UPDATE inventory.stock_levels SET qty_on_hand = 478
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Black%' AND category_id = 'c1000000-0000-0000-0000-000000000006') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BEAUTY BLENDER: JL Circle = 141
UPDATE inventory.stock_levels SET qty_on_hand = 141
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%JL Circle%' AND category_id = 'c1000000-0000-0000-0000-000000000006') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BEAUTY BLENDER: JL Triangle = 82
UPDATE inventory.stock_levels SET qty_on_hand = 82
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%JL Triangle%' AND category_id = 'c1000000-0000-0000-0000-000000000006') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BEAUTY BLENDER: Dark Brown = 214
UPDATE inventory.stock_levels SET qty_on_hand = 214
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Dark Brown%' AND category_id = 'c1000000-0000-0000-0000-000000000006') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BEAUTY BLENDER: Big Brown = 39
UPDATE inventory.stock_levels SET qty_on_hand = 39
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Big Brown%' AND category_id = 'c1000000-0000-0000-0000-000000000006') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BEAUTY BLENDER: S Brown = 180
UPDATE inventory.stock_levels SET qty_on_hand = 180
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%S Brown%' AND category_id = 'c1000000-0000-0000-0000-000000000006') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BEAUTY BLENDER: JL Puff = 379
UPDATE inventory.stock_levels SET qty_on_hand = 379
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%JL Puff%' AND category_id = 'c1000000-0000-0000-0000-000000000006') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BEAUTY BLENDER: Puff Set = 137
UPDATE inventory.stock_levels SET qty_on_hand = 137
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Puff Set%' AND category_id = 'c1000000-0000-0000-0000-000000000006') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BEAUTY BLENDER: JL Black = 1
UPDATE inventory.stock_levels SET qty_on_hand = 1
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%JL Black%' AND category_id = 'c1000000-0000-0000-0000-000000000006') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GEL LINER: Burgundy = 142
UPDATE inventory.stock_levels SET qty_on_hand = 142
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Burgundy%' AND category_id = 'c1000000-0000-0000-0000-000000000007') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GEL LINER: Black = 531
UPDATE inventory.stock_levels SET qty_on_hand = 531
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Black%' AND category_id = 'c1000000-0000-0000-0000-000000000007') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GEL LINER: Dark Brown = 501
UPDATE inventory.stock_levels SET qty_on_hand = 501
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Dark Brown%' AND category_id = 'c1000000-0000-0000-0000-000000000007') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GEL LINER: Light Brown = 1141
UPDATE inventory.stock_levels SET qty_on_hand = 1141
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Light Brown%' AND category_id = 'c1000000-0000-0000-0000-000000000007') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GEL LINER: Green = 14
UPDATE inventory.stock_levels SET qty_on_hand = 14
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Green%' AND category_id = 'c1000000-0000-0000-0000-000000000007') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- WHITE EYE BROW PENCIL: Soft Black = 127
UPDATE inventory.stock_levels SET qty_on_hand = 127
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Soft Black%' AND category_id = 'c1000000-0000-0000-0000-000000000008') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- WHITE EYE BROW PENCIL: Light Brown = 20
UPDATE inventory.stock_levels SET qty_on_hand = 20
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Light Brown%' AND category_id = 'c1000000-0000-0000-0000-000000000008') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- WHITE EYE BROW PENCIL: Medium Brown = 16
UPDATE inventory.stock_levels SET qty_on_hand = 16
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Medium Brown%' AND category_id = 'c1000000-0000-0000-0000-000000000008') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- WHITE EYE BROW PENCIL: Deep Brown = 80
UPDATE inventory.stock_levels SET qty_on_hand = 80
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Deep Brown%' AND category_id = 'c1000000-0000-0000-0000-000000000008') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GOLD EYE BROW PENCIL: Dark Brown = 19
UPDATE inventory.stock_levels SET qty_on_hand = 19
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Dark Brown%' AND category_id = 'c1000000-0000-0000-0000-000000000009') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GOLD EYE BROW PENCIL: Light Brown = 33
UPDATE inventory.stock_levels SET qty_on_hand = 33
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Light Brown%' AND category_id = 'c1000000-0000-0000-0000-000000000009') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GOLD EYE BROW PENCIL: Black = 13
UPDATE inventory.stock_levels SET qty_on_hand = 13
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Black%' AND category_id = 'c1000000-0000-0000-0000-000000000009') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GOLD EYE BROW PENCIL: Khaki = 47
UPDATE inventory.stock_levels SET qty_on_hand = 47
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Khaki%' AND category_id = 'c1000000-0000-0000-0000-000000000009') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H46 = 38
UPDATE inventory.stock_levels SET qty_on_hand = 38
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H46%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H45 = 35
UPDATE inventory.stock_levels SET qty_on_hand = 35
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H45%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H40 = 64
UPDATE inventory.stock_levels SET qty_on_hand = 64
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H40%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H48 = 82
UPDATE inventory.stock_levels SET qty_on_hand = 82
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H48%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H14 = 85
UPDATE inventory.stock_levels SET qty_on_hand = 85
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H14%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H42 = 85
UPDATE inventory.stock_levels SET qty_on_hand = 85
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H42%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H47 = 95
UPDATE inventory.stock_levels SET qty_on_hand = 95
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H47%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H44 = 67
UPDATE inventory.stock_levels SET qty_on_hand = 67
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H44%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H2 = 125
UPDATE inventory.stock_levels SET qty_on_hand = 125
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H2%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H36 = 31
UPDATE inventory.stock_levels SET qty_on_hand = 31
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H36%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H21 = 29
UPDATE inventory.stock_levels SET qty_on_hand = 29
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H21%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H34 = 11
UPDATE inventory.stock_levels SET qty_on_hand = 11
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H34%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H13 = 70
UPDATE inventory.stock_levels SET qty_on_hand = 70
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H13%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H17 = 33
UPDATE inventory.stock_levels SET qty_on_hand = 33
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H17%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H4 = 29
UPDATE inventory.stock_levels SET qty_on_hand = 29
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H4%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H1 = 12
UPDATE inventory.stock_levels SET qty_on_hand = 12
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H1%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H12 = 7
UPDATE inventory.stock_levels SET qty_on_hand = 7
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H12%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H11 = 5
UPDATE inventory.stock_levels SET qty_on_hand = 5
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H11%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H16 = 7
UPDATE inventory.stock_levels SET qty_on_hand = 7
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H16%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H9 = 8
UPDATE inventory.stock_levels SET qty_on_hand = 8
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H9%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H7 = 1
UPDATE inventory.stock_levels SET qty_on_hand = 1
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H7%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H8 = 6
UPDATE inventory.stock_levels SET qty_on_hand = 6
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H8%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLITTER: H3 = 23
UPDATE inventory.stock_levels SET qty_on_hand = 23
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Glitter H3%' AND category_id = 'c1000000-0000-0000-0000-00000000000a') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- TRIANGLE BURGUNDY SPONGE: Packet = 51
UPDATE inventory.stock_levels SET qty_on_hand = 51
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name_ar = 'بيوتي بلندر مثلثة') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF140 = 44
UPDATE inventory.stock_levels SET qty_on_hand = 44
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF140%' OR sku ILIKE '%SF140%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF136 = 11
UPDATE inventory.stock_levels SET qty_on_hand = 11
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF136%' OR sku ILIKE '%SF136%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF30 = 148
UPDATE inventory.stock_levels SET qty_on_hand = 148
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF30%' OR sku ILIKE '%SF30%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF106 = 4
UPDATE inventory.stock_levels SET qty_on_hand = 4
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF106%' OR sku ILIKE '%SF106%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF103 = 27
UPDATE inventory.stock_levels SET qty_on_hand = 27
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF103%' OR sku ILIKE '%SF103%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF21 = 2
UPDATE inventory.stock_levels SET qty_on_hand = 2
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF21%' OR sku ILIKE '%SF21%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF138 = 146
UPDATE inventory.stock_levels SET qty_on_hand = 146
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF138%' OR sku ILIKE '%SF138%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF20 = 49
UPDATE inventory.stock_levels SET qty_on_hand = 49
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF20%' OR sku ILIKE '%SF20%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF10 = 44
UPDATE inventory.stock_levels SET qty_on_hand = 44
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF10%' OR sku ILIKE '%SF10%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF104 = 7
UPDATE inventory.stock_levels SET qty_on_hand = 7
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF104%' OR sku ILIKE '%SF104%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF135 = 59
UPDATE inventory.stock_levels SET qty_on_hand = 59
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF135%' OR sku ILIKE '%SF135%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF22 = 22
UPDATE inventory.stock_levels SET qty_on_hand = 22
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF22%' OR sku ILIKE '%SF22%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF102 = 32
UPDATE inventory.stock_levels SET qty_on_hand = 32
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF102%' OR sku ILIKE '%SF102%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF32 = 45
UPDATE inventory.stock_levels SET qty_on_hand = 45
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF32%' OR sku ILIKE '%SF32%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF134 = 35
UPDATE inventory.stock_levels SET qty_on_hand = 35
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF134%' OR sku ILIKE '%SF134%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF108 = 54
UPDATE inventory.stock_levels SET qty_on_hand = 54
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF108%' OR sku ILIKE '%SF108%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF207 = 36
UPDATE inventory.stock_levels SET qty_on_hand = 36
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF207%' OR sku ILIKE '%SF207%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF107 = 3
UPDATE inventory.stock_levels SET qty_on_hand = 3
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF107%' OR sku ILIKE '%SF107%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF112 = 2
UPDATE inventory.stock_levels SET qty_on_hand = 2
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF112%' OR sku ILIKE '%SF112%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF201 = 2
UPDATE inventory.stock_levels SET qty_on_hand = 2
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF201%' OR sku ILIKE '%SF201%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SF204 = 4
UPDATE inventory.stock_levels SET qty_on_hand = 4
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SF204%' OR sku ILIKE '%SF204%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SRF01 = 43
UPDATE inventory.stock_levels SET qty_on_hand = 43
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SRF01%' OR sku ILIKE '%SRF01%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SRF02 = 75
UPDATE inventory.stock_levels SET qty_on_hand = 75
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SRF02%' OR sku ILIKE '%SRF02%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SRF03 = 178
UPDATE inventory.stock_levels SET qty_on_hand = 178
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SRF03%' OR sku ILIKE '%SRF03%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SRF04 = 170
UPDATE inventory.stock_levels SET qty_on_hand = 170
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SRF04%' OR sku ILIKE '%SRF04%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SRF05 = 121
UPDATE inventory.stock_levels SET qty_on_hand = 121
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SRF05%' OR sku ILIKE '%SRF05%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SRF06 = 121
UPDATE inventory.stock_levels SET qty_on_hand = 121
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SRF06%' OR sku ILIKE '%SRF06%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SRF07 = 13
UPDATE inventory.stock_levels SET qty_on_hand = 13
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SRF07%' OR sku ILIKE '%SRF07%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SRF08 = 18
UPDATE inventory.stock_levels SET qty_on_hand = 18
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SRF08%' OR sku ILIKE '%SRF08%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SRF09 = 149
UPDATE inventory.stock_levels SET qty_on_hand = 149
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SRF09%' OR sku ILIKE '%SRF09%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SRF10 = 95
UPDATE inventory.stock_levels SET qty_on_hand = 95
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SRF10%' OR sku ILIKE '%SRF10%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SRF11 = 149
UPDATE inventory.stock_levels SET qty_on_hand = 149
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SRF11%' OR sku ILIKE '%SRF11%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SRF12 = 154
UPDATE inventory.stock_levels SET qty_on_hand = 154
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SRF12%' OR sku ILIKE '%SRF12%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: HD08 = 20
UPDATE inventory.stock_levels SET qty_on_hand = 20
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%HD08%' OR sku ILIKE '%HD08%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: Ayla = 3
UPDATE inventory.stock_levels SET qty_on_hand = 3
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%Ayla%' OR sku ILIKE '%Ayla%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: LiLi = 4
UPDATE inventory.stock_levels SET qty_on_hand = 4
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%LiLi%' OR sku ILIKE '%LiLi%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: S5 = 5
UPDATE inventory.stock_levels SET qty_on_hand = 5
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%S5%' OR sku ILIKE '%S5%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SR109 = 4
UPDATE inventory.stock_levels SET qty_on_hand = 4
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SR109%' OR sku ILIKE '%SR109%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: 3DHB31 = 4
UPDATE inventory.stock_levels SET qty_on_hand = 4
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%3DHB31%' OR sku ILIKE '%3DHB31%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: R8 = 4
UPDATE inventory.stock_levels SET qty_on_hand = 4
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%R8%' OR sku ILIKE '%R8%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: Pink Packet = 6
UPDATE inventory.stock_levels SET qty_on_hand = 6
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%Pink Packet%' OR sku ILIKE '%Pink Packet%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: 02 Packet = 3
UPDATE inventory.stock_levels SET qty_on_hand = 3
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%02 Packet%' OR sku ILIKE '%02 Packet%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: W1 = 4
UPDATE inventory.stock_levels SET qty_on_hand = 4
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%W1%' OR sku ILIKE '%W1%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: #11 = 8
UPDATE inventory.stock_levels SET qty_on_hand = 8
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%11%' OR sku ILIKE '%11%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SR125 = 1
UPDATE inventory.stock_levels SET qty_on_hand = 1
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SR125%' OR sku ILIKE '%SR125%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SR129 = 1
UPDATE inventory.stock_levels SET qty_on_hand = 1
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SR129%' OR sku ILIKE '%SR129%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SR128 = 1
UPDATE inventory.stock_levels SET qty_on_hand = 1
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SR128%' OR sku ILIKE '%SR128%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: SR127 = 1
UPDATE inventory.stock_levels SET qty_on_hand = 1
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%SR127%' OR sku ILIKE '%SR127%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: PF07 = 2
UPDATE inventory.stock_levels SET qty_on_hand = 2
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%PF07%' OR sku ILIKE '%PF07%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: Packet #4 = 1
UPDATE inventory.stock_levels SET qty_on_hand = 1
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%Packet 4%' OR sku ILIKE '%Packet 4%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: 3D01 = 2
UPDATE inventory.stock_levels SET qty_on_hand = 2
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%3D01%' OR sku ILIKE '%3D01%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- LASHES: 3D09 = 0
UPDATE inventory.stock_levels SET qty_on_hand = 0
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE ((name ILIKE '%3D09%' OR sku ILIKE '%3D09%') AND category_id = 'c1000000-0000-0000-0000-00000000000c') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BLUSHER HIGHLIGHTER: Copper = 14
UPDATE inventory.stock_levels SET qty_on_hand = 14
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Copper%' AND category_id = 'c1000000-0000-0000-0000-00000000000d') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BLUSHER HIGHLIGHTER: Passion = 158
UPDATE inventory.stock_levels SET qty_on_hand = 158
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Passion%' AND category_id = 'c1000000-0000-0000-0000-00000000000d') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BLUSHER HIGHLIGHTER: Baby = 48
UPDATE inventory.stock_levels SET qty_on_hand = 48
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Baby%' AND category_id = 'c1000000-0000-0000-0000-00000000000d') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BLUSHER HIGHLIGHTER: Pretty = 3
UPDATE inventory.stock_levels SET qty_on_hand = 3
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Pretty%' AND category_id = 'c1000000-0000-0000-0000-00000000000d') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BLUSHER HIGHLIGHTER: Mood = 59
UPDATE inventory.stock_levels SET qty_on_hand = 59
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Mood%' AND category_id = 'c1000000-0000-0000-0000-00000000000d') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Singles): Double Liquid & Powder = 148
UPDATE inventory.stock_levels SET qty_on_hand = 148
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name_ar = 'فرشة دابل ليكويد وباودر') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Singles): Brown Double Blusher = 113
UPDATE inventory.stock_levels SET qty_on_hand = 113
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name_ar = 'فرشة دبل بلاشر بني') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Singles): Goat Hair Black Blusher = 13
UPDATE inventory.stock_levels SET qty_on_hand = 13
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Goat Hair%Blusher%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Singles): Goat Hair Black Powder = 58
UPDATE inventory.stock_levels SET qty_on_hand = 58
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Goat Hair%Powder%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Singles): Goat Hair Contour Double = 39
UPDATE inventory.stock_levels SET qty_on_hand = 39
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name_ar = 'فرشة دابل كونسيلر وباودر') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Singles): Jacob Double Black Brush = 134
UPDATE inventory.stock_levels SET qty_on_hand = 134
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name_ar = 'فرشة جيكوب سوداء') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Singles): Brush Eyebrow Black Jacob = 21
UPDATE inventory.stock_levels SET qty_on_hand = 21
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name_ar = 'فرشة حواجب سوداء') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Singles): Maasoma Eyeliner Brush = 352
UPDATE inventory.stock_levels SET qty_on_hand = 352
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name_ar = 'فرشة معصومة') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Singles): Jacob Blend Eye Brush = 450
UPDATE inventory.stock_levels SET qty_on_hand = 450
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name_ar = 'فرشة دمج جيكوب') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Singles): Brown Brush (Single) = 11
UPDATE inventory.stock_levels SET qty_on_hand = 11
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Brown Brush%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Singles): Under Eye Brown Brush = 90
UPDATE inventory.stock_levels SET qty_on_hand = 90
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Under Eye%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Singles): Nose Contour Brush = 11
UPDATE inventory.stock_levels SET qty_on_hand = 11
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Nose Contour%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Singles): Big Gold Eye Brow Brush = 59
UPDATE inventory.stock_levels SET qty_on_hand = 59
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name_ar = 'فرشة دابل حواجب') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Singles): Silicon Glitter Brush = 39
UPDATE inventory.stock_levels SET qty_on_hand = 39
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Silicon Glitter%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Singles): Small Eyebrow Black = 25
UPDATE inventory.stock_levels SET qty_on_hand = 25
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Small Eyebrow%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Singles): Large Eyebrow Black = 44
UPDATE inventory.stock_levels SET qty_on_hand = 44
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Large Eyebrow%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Singles): Cut Crease Black Large = 36
UPDATE inventory.stock_levels SET qty_on_hand = 36
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Cut C%Large%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Singles): Cut Crease Black Small = 5
UPDATE inventory.stock_levels SET qty_on_hand = 5
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Cut C%Small%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Sets): Dalia = 50
UPDATE inventory.stock_levels SET qty_on_hand = 50
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name_ar = 'طقم داليا درويش') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Sets): Face Brown Set = 10
UPDATE inventory.stock_levels SET qty_on_hand = 10
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Face Brown%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Sets): Silver Set = 2
UPDATE inventory.stock_levels SET qty_on_hand = 2
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name_ar LIKE '%جيكوب السيلفر%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Sets): Esraa El Shaaer = 2
UPDATE inventory.stock_levels SET qty_on_hand = 2
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name_ar = 'طقم إسراء الشاعر') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Sets): Pink Set = 3
UPDATE inventory.stock_levels SET qty_on_hand = 3
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Pink Brush%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Sets): Jacob Green Set = 19
UPDATE inventory.stock_levels SET qty_on_hand = 19
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name_ar = 'طقم جيكوب' AND category_id = 'c1000000-0000-0000-0000-00000000000f') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Sets): Yellow Set = 3
UPDATE inventory.stock_levels SET qty_on_hand = 3
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE 'Yellow%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Sets): Eye Set Black (7p) = 1
UPDATE inventory.stock_levels SET qty_on_hand = 1
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Eye Set%7%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BRUSHES (Sets): Black Set (33p) = 1
UPDATE inventory.stock_levels SET qty_on_hand = 1
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Black%Set%33%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BLUSHER MATTE: Love Joey 002 = 41
UPDATE inventory.stock_levels SET qty_on_hand = 41
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Love Joey 002%' AND category_id = 'c1000000-0000-0000-0000-000000000017') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BLUSHER MATTE: Caramel Latte 004 = 32
UPDATE inventory.stock_levels SET qty_on_hand = 32
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Caramel Latte 004%' AND category_id = 'c1000000-0000-0000-0000-000000000017') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BLUSHER MATTE: Nude Truffle 005 = 41
UPDATE inventory.stock_levels SET qty_on_hand = 41
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Nude Truffle 005%' AND category_id = 'c1000000-0000-0000-0000-000000000017') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BLUSHER MATTE: Berry Juicy 006 = 31
UPDATE inventory.stock_levels SET qty_on_hand = 31
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Berry Juicy 006%' AND category_id = 'c1000000-0000-0000-0000-000000000017') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BLUSHER MATTE: Latte 008 = 40
UPDATE inventory.stock_levels SET qty_on_hand = 40
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Latte 008%' AND category_id = 'c1000000-0000-0000-0000-000000000017') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BLUSHER MATTE: Cappuccino 010 = 5
UPDATE inventory.stock_levels SET qty_on_hand = 5
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Cappuccino 010%' AND category_id = 'c1000000-0000-0000-0000-000000000017') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BLUSHER MATTE: Perfect Pink 014 = 24
UPDATE inventory.stock_levels SET qty_on_hand = 24
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Perfect Pink 014%' AND category_id = 'c1000000-0000-0000-0000-000000000017') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- BLUSHER MATTE: Forbidden 015 = 46
UPDATE inventory.stock_levels SET qty_on_hand = 46
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name LIKE '%Forbidden 015%' AND category_id = 'c1000000-0000-0000-0000-000000000017') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLUE SUPER STRONG: Glue 10ml = 2301
UPDATE inventory.stock_levels SET qty_on_hand = 2301
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name_ar LIKE 'جلو سوبر استرونج 10%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);

-- GLUE SUPER STRONG: Glue 5ml = 0
UPDATE inventory.stock_levels SET qty_on_hand = 0
WHERE warehouse_id = 'd0000000-0000-0000-0000-000000000001' AND product_id = (
  SELECT id FROM catalog.products WHERE (name_ar LIKE 'جلو سوبر استرونج 5%') AND tenant_id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1
);
