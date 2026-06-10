-- Migration 034: Clear import notes from orders
-- These notes were added during Excel import and are not real customer notes

UPDATE sales.sales_orders 
SET notes = NULL 
WHERE notes = 'Imported from Excel sheet';

INSERT INTO public.migrations (name, applied_at) 
VALUES ('034_clear_import_notes', NOW());
