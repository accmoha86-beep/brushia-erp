-- Migration 031: Fix order_items tenant_id + customer data
-- ═══════════════════════════════════════════════════════
-- Bug: Migration 030 order_items have NULL tenant_id
--      API filters by tenant_id, so items never appear

-- Step 1: Add last_order_at column if missing
ALTER TABLE sales.customers ADD COLUMN IF NOT EXISTS last_order_at TIMESTAMPTZ;

-- Step 2: Fix tenant_id on ALL order_items that are missing it
UPDATE sales.order_items 
SET tenant_id = 'a0000000-0000-0000-0000-000000000001' 
WHERE tenant_id IS NULL;

-- Step 3: Populate name column from first_name + last_name where missing
UPDATE sales.customers 
SET name = TRIM(CONCAT(first_name, ' ', COALESCE(last_name, '')))
WHERE name IS NULL AND tenant_id = 'a0000000-0000-0000-0000-000000000001';

-- Step 4: Update customer stats from actual orders
UPDATE sales.customers c
SET 
  total_orders = sub.order_count,
  total_spent = sub.total_spent,
  last_order_at = sub.last_order
FROM (
  SELECT customer_id, 
         COUNT(*) as order_count, 
         SUM(grand_total) as total_spent,
         MAX(ordered_at) as last_order
  FROM sales.sales_orders 
  WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001'
    AND status != 'cancelled'
  GROUP BY customer_id
) sub
WHERE c.id = sub.customer_id 
  AND c.tenant_id = 'a0000000-0000-0000-0000-000000000001';

-- Migration 031 complete
