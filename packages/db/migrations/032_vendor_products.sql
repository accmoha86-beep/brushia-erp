-- Migration 032: Vendor-Product linking
-- Links vendors to the products they supply with cost/lead-time overrides

CREATE TABLE IF NOT EXISTS purchasing.vendor_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  vendor_id UUID NOT NULL REFERENCES purchasing.vendors(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
  vendor_sku VARCHAR(100),
  vendor_price BIGINT DEFAULT 0,
  lead_time_days INTEGER,
  is_preferred BOOLEAN NOT NULL DEFAULT false,
  min_order_qty INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, vendor_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor ON purchasing.vendor_products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_products_product ON purchasing.vendor_products(product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_products_tenant ON purchasing.vendor_products(tenant_id);

-- Ensure only one preferred vendor per product per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_products_preferred 
  ON purchasing.vendor_products(tenant_id, product_id) WHERE is_preferred = true;

INSERT INTO public.migrations (name) VALUES ('032_vendor_products');
