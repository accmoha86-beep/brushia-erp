-- Migration 008: Final comprehensive column alignment

-- ═══════════════════════════════════════════════════════════
-- ACCOUNTING: chart_of_accounts
-- ═══════════════════════════════════════════════════════════
ALTER TABLE accounting.chart_of_accounts ADD COLUMN IF NOT EXISTS code VARCHAR(20);
UPDATE accounting.chart_of_accounts SET code = account_number WHERE code IS NULL;
ALTER TABLE accounting.chart_of_accounts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE accounting.chart_of_accounts ADD COLUMN IF NOT EXISTS is_bank_account BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_coa_code ON accounting.chart_of_accounts(tenant_id, code);

-- ═══════════════════════════════════════════════════════════
-- SALES: sales_orders — additional columns
-- ═══════════════════════════════════════════════════════════
ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS tax_rate VARCHAR(10) DEFAULT '14.00';
ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS loyalty_discount BIGINT DEFAULT 0;
ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS grand_total BIGINT DEFAULT 0;
ALTER TABLE sales.sales_orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30);
UPDATE sales.sales_orders SET grand_total = total WHERE grand_total IS NULL OR grand_total = 0;

-- ═══════════════════════════════════════════════════════════
-- CATALOG: products — POS-required columns
-- ═══════════════════════════════════════════════════════════
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS selling_price BIGINT DEFAULT 0;
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS barcode VARCHAR(50);
ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN DEFAULT true;
-- Populate selling_price from base_price
UPDATE catalog.products SET selling_price = base_price WHERE selling_price IS NULL OR selling_price = 0;
-- Populate image_url from images JSONB array
UPDATE catalog.products SET image_url = (images->0->>'url') WHERE image_url IS NULL AND images IS NOT NULL AND jsonb_array_length(images) > 0;

-- ═══════════════════════════════════════════════════════════
-- Done
-- ═══════════════════════════════════════════════════════════
