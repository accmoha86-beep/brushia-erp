-- Migration 035: Bilingual product names
-- Adds name_ar to product_variants for full i18n support

-- 1. Add name_ar column to product_variants
ALTER TABLE catalog.product_variants ADD COLUMN IF NOT EXISTS name_ar VARCHAR(200);

-- 2. Update any products that have incomplete name_ar from Excel data mapping
-- These are products imported from real data where name_ar may be missing or incomplete

-- Fix products where name_ar contains English mixed in (from original seed)
UPDATE catalog.products SET name_ar = 'بيوتي بلندر أسود' WHERE sku = 'BB-BLACK' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' AND (name_ar IS NULL OR name_ar LIKE '%Black%');
UPDATE catalog.products SET name_ar = 'بيوتي بلندر جيكوب أسود' WHERE sku = 'BB-JL-BLACK' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' AND (name_ar IS NULL OR name_ar LIKE '%Jl Black%');
UPDATE catalog.products SET name_ar = 'بيوتي بلندر بني داكن' WHERE sku = 'BB-DARK-BROWN' AND tenant_id = 'a0000000-0000-0000-0000-000000000001' AND (name_ar IS NULL OR name_ar LIKE '%Dark Brown%');

-- Ensure all products have name_ar populated (copy from name if missing)
UPDATE catalog.products 
SET name_ar = name 
WHERE name_ar IS NULL AND tenant_id = 'a0000000-0000-0000-0000-000000000001';

-- Migration tracking
INSERT INTO public.migrations (name, applied_at) VALUES ('035_bilingual_names', NOW())
ON CONFLICT DO NOTHING;

-- 3. Add name_ar to order_items for future bilingual order records
ALTER TABLE sales.order_items ADD COLUMN IF NOT EXISTS name_ar VARCHAR(200);

-- Update existing order items with name_ar from products
UPDATE sales.order_items oi
SET name_ar = p.name_ar
FROM catalog.products p
WHERE oi.product_id = p.id AND oi.name_ar IS NULL;
