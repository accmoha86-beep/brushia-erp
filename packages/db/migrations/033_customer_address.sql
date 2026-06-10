-- Migration 033: Add address field to customers for invoice
-- Adds street-level address to complement existing city + governorate

ALTER TABLE sales.customers ADD COLUMN IF NOT EXISTS address TEXT;

-- Also ensure customer address fields are available on orders
COMMENT ON COLUMN sales.customers.address IS 'Street address for invoicing';

-- Update migration tracking
INSERT INTO public.migrations (name, applied_at) 
VALUES ('033_customer_address', NOW())
ON CONFLICT DO NOTHING;
