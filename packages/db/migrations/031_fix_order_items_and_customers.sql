-- Migration 031: Fix order_items tenant_id + customer name display
-- ═══════════════════════════════════════════════════════════════
-- Bug 1: Migration 030 inserted order_items without tenant_id (column is nullable)
--         API filters by tenant_id, so items never appear
-- Bug 2: Migration 030 inserted customers with first_name/last_name but not name column
--         API joins on c.name which returns NULL → shows "Walk-in Customer"

-- Fix 1: Set tenant_id on all order_items that are missing it
UPDATE sales.order_items 
SET tenant_id = 'a0000000-0000-0000-0000-000000000001' 
WHERE tenant_id IS NULL;

-- Fix 2: Populate name column from first_name + last_name for all customers missing name
UPDATE sales.customers 
SET name = TRIM(CONCAT(first_name, ' ', COALESCE(last_name, '')))
WHERE name IS NULL AND tenant_id = 'a0000000-0000-0000-0000-000000000001';

-- Fix 3: Also update customer last_order_at and total_orders/total_spent from actual orders
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
