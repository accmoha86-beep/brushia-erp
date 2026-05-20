CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA IF NOT EXISTS iam;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS sales;
CREATE SCHEMA IF NOT EXISTS purchasing;
CREATE SCHEMA IF NOT EXISTS accounting;
CREATE SCHEMA IF NOT EXISTS shipping;
CREATE SCHEMA IF NOT EXISTS crm;

CREATE TABLE IF NOT EXISTS iam.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) NOT NULL, slug VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active', plan VARCHAR(50) NOT NULL DEFAULT 'trial',
  legal_name VARCHAR(255), tax_id VARCHAR(50), commercial_reg VARCHAR(50),
  email VARCHAR(255) NOT NULL, phone VARCHAR(20),
  address_line1 VARCHAR(255), city VARCHAR(100), governorate VARCHAR(100),
  country VARCHAR(2) NOT NULL DEFAULT 'EG', currency VARCHAR(3) NOT NULL DEFAULT 'EGP',
  timezone VARCHAR(50) NOT NULL DEFAULT 'Africa/Cairo', locale VARCHAR(10) NOT NULL DEFAULT 'ar-EG',
  vat_rate INTEGER NOT NULL DEFAULT 1400, fiscal_year_start INTEGER NOT NULL DEFAULT 1,
  max_users INTEGER NOT NULL DEFAULT 5, max_branches INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iam.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  email VARCHAR(255) NOT NULL, password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200), phone VARCHAR(20), avatar_url TEXT,
  language VARCHAR(10) NOT NULL DEFAULT 'en', theme VARCHAR(20) NOT NULL DEFAULT 'system',
  status VARCHAR(20) NOT NULL DEFAULT 'active', is_owner BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMPTZ, failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE TABLE IF NOT EXISTS iam.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  name VARCHAR(100) NOT NULL, description TEXT, is_system BOOLEAN NOT NULL DEFAULT false,
  permissions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS iam.user_roles (
  user_id UUID NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES iam.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS iam.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES iam.tenants(id), refresh_token_hash VARCHAR(255) NOT NULL,
  device_type VARCHAR(20) NOT NULL DEFAULT 'web', ip_address INET, user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL, is_revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iam.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL, user_id UUID,
  action VARCHAR(100) NOT NULL, entity_type VARCHAR(50), entity_id UUID,
  old_values JSONB, new_values JSONB, ip_address INET, metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog.brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  name VARCHAR(100) NOT NULL, name_ar VARCHAR(100), slug VARCHAR(120) NOT NULL,
  logo_url TEXT, is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS catalog.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  parent_id UUID REFERENCES catalog.categories(id),
  name VARCHAR(100) NOT NULL, name_ar VARCHAR(100), slug VARCHAR(120) NOT NULL,
  description TEXT, image_url TEXT, sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS catalog.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  category_id UUID NOT NULL REFERENCES catalog.categories(id),
  brand_id UUID REFERENCES catalog.brands(id),
  sku VARCHAR(50) NOT NULL, name VARCHAR(200) NOT NULL, name_ar VARCHAR(200),
  slug VARCHAR(220) NOT NULL, description TEXT,
  product_type VARCHAR(20) NOT NULL DEFAULT 'simple',
  base_price BIGINT NOT NULL DEFAULT 0, cost_price BIGINT NOT NULL DEFAULT 0,
  compare_at_price BIGINT, tax_inclusive BOOLEAN NOT NULL DEFAULT true,
  tax_rate VARCHAR(10) NOT NULL DEFAULT '14.00', weight_grams INTEGER,
  track_inventory BOOLEAN NOT NULL DEFAULT true, low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  status VARCHAR(20) NOT NULL DEFAULT 'active', is_active BOOLEAN NOT NULL DEFAULT true,
  tags TEXT[], images JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, sku), UNIQUE(tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS catalog.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  product_id UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
  sku VARCHAR(50) NOT NULL, name VARCHAR(200) NOT NULL,
  barcode VARCHAR(50), color VARCHAR(50), color_hex VARCHAR(7), size VARCHAR(20), shade VARCHAR(50),
  price_override BIGINT, cost_override BIGINT, is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0, images JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, sku)
);

CREATE TABLE IF NOT EXISTS catalog.price_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  name VARCHAR(100) NOT NULL, code VARCHAR(20) NOT NULL, type VARCHAR(20) NOT NULL DEFAULT 'wholesale',
  is_active BOOLEAN NOT NULL DEFAULT true, valid_from TIMESTAMPTZ, valid_to TIMESTAMPTZ,
  min_order_amount BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS catalog.price_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  price_list_id UUID NOT NULL REFERENCES catalog.price_lists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES catalog.products(id),
  variant_id UUID REFERENCES catalog.product_variants(id),
  price BIGINT NOT NULL, min_quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory.warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  code VARCHAR(20) NOT NULL, name VARCHAR(100) NOT NULL, name_ar VARCHAR(100),
  warehouse_type VARCHAR(20) NOT NULL DEFAULT 'standard',
  city VARCHAR(100), governorate VARCHAR(50), country VARCHAR(2) NOT NULL DEFAULT 'EG',
  phone VARCHAR(20), is_active BOOLEAN NOT NULL DEFAULT true, is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS inventory.stock_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  product_id UUID NOT NULL REFERENCES catalog.products(id),
  variant_id UUID REFERENCES catalog.product_variants(id),
  warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
  qty_on_hand INTEGER NOT NULL DEFAULT 0, qty_reserved INTEGER NOT NULL DEFAULT 0,
  qty_incoming INTEGER NOT NULL DEFAULT 0, weighted_avg_cost BIGINT NOT NULL DEFAULT 0,
  reorder_point INTEGER NOT NULL DEFAULT 10, reorder_qty INTEGER NOT NULL DEFAULT 50,
  last_movement_at TIMESTAMPTZ, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'), warehouse_id)
);

CREATE TABLE IF NOT EXISTS inventory.stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  product_id UUID NOT NULL REFERENCES catalog.products(id),
  variant_id UUID REFERENCES catalog.product_variants(id),
  warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
  movement_type VARCHAR(30) NOT NULL, quantity INTEGER NOT NULL,
  unit_cost BIGINT NOT NULL DEFAULT 0, total_cost BIGINT NOT NULL DEFAULT 0,
  balance_after INTEGER NOT NULL, avg_cost_after BIGINT NOT NULL DEFAULT 0,
  reference_type VARCHAR(30), reference_id UUID, reference_number VARCHAR(50),
  reason TEXT, performed_by UUID NOT NULL, idempotency_key VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory.stock_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  transfer_number VARCHAR(20) NOT NULL, from_warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
  to_warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
  status VARCHAR(20) NOT NULL DEFAULT 'draft', requested_by UUID NOT NULL,
  approved_by UUID, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, transfer_number)
);

CREATE TABLE IF NOT EXISTS inventory.stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id UUID NOT NULL REFERENCES inventory.stock_transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES catalog.products(id),
  variant_id UUID REFERENCES catalog.product_variants(id),
  quantity INTEGER NOT NULL, received_qty INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sales.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  customer_number VARCHAR(20) NOT NULL, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100),
  email VARCHAR(255), phone VARCHAR(20), whatsapp VARCHAR(20),
  customer_type VARCHAR(20) NOT NULL DEFAULT 'retail', company_name VARCHAR(200),
  city VARCHAR(100), governorate VARCHAR(100),
  loyalty_points INTEGER NOT NULL DEFAULT 0, loyalty_tier VARCHAR(20) NOT NULL DEFAULT 'bronze',
  total_orders INTEGER NOT NULL DEFAULT 0, total_spent BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, customer_number)
);

CREATE TABLE IF NOT EXISTS sales.sales_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  order_number VARCHAR(20) NOT NULL, customer_id UUID REFERENCES sales.customers(id),
  status VARCHAR(20) NOT NULL DEFAULT 'draft', order_type VARCHAR(20) NOT NULL DEFAULT 'retail',
  channel VARCHAR(20) NOT NULL DEFAULT 'pos', warehouse_id UUID REFERENCES inventory.warehouses(id),
  salesperson_id UUID REFERENCES iam.users(id), price_list_id UUID REFERENCES catalog.price_lists(id),
  subtotal BIGINT NOT NULL DEFAULT 0, discount_amount BIGINT NOT NULL DEFAULT 0,
  tax_amount BIGINT NOT NULL DEFAULT 0, shipping_amount BIGINT NOT NULL DEFAULT 0,
  total BIGINT NOT NULL DEFAULT 0, paid_amount BIGINT NOT NULL DEFAULT 0,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid', currency VARCHAR(3) NOT NULL DEFAULT 'EGP',
  notes TEXT, shipping_address JSONB, metadata JSONB DEFAULT '{}',
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, order_number)
);

CREATE TABLE IF NOT EXISTS sales.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES sales.sales_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES catalog.products(id),
  variant_id UUID REFERENCES catalog.product_variants(id),
  sku VARCHAR(50) NOT NULL, name VARCHAR(200) NOT NULL, quantity INTEGER NOT NULL,
  unit_price BIGINT NOT NULL, discount_amount BIGINT NOT NULL DEFAULT 0,
  tax_amount BIGINT NOT NULL DEFAULT 0, total BIGINT NOT NULL, cost_price BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sales.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  order_id UUID NOT NULL REFERENCES sales.sales_orders(id),
  payment_number VARCHAR(20) NOT NULL, method VARCHAR(20) NOT NULL,
  amount BIGINT NOT NULL, currency VARCHAR(3) NOT NULL DEFAULT 'EGP',
  status VARCHAR(20) NOT NULL DEFAULT 'completed', reference VARCHAR(100),
  received_by UUID REFERENCES iam.users(id),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, payment_number)
);

CREATE TABLE IF NOT EXISTS sales.returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  return_number VARCHAR(20) NOT NULL, order_id UUID NOT NULL REFERENCES sales.sales_orders(id),
  customer_id UUID REFERENCES sales.customers(id), status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reason VARCHAR(50), refund_amount BIGINT NOT NULL DEFAULT 0, refund_method VARCHAR(20),
  processed_by UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, return_number)
);

CREATE TABLE IF NOT EXISTS sales.return_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id UUID NOT NULL REFERENCES sales.returns(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES sales.order_items(id),
  quantity INTEGER NOT NULL, condition VARCHAR(20) NOT NULL DEFAULT 'good', restock BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS sales.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  name VARCHAR(200) NOT NULL, code VARCHAR(50), type VARCHAR(30) NOT NULL, value BIGINT NOT NULL,
  min_order_amount BIGINT DEFAULT 0, max_discount BIGINT, usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0, applies_to VARCHAR(20) NOT NULL DEFAULT 'all',
  is_active BOOLEAN NOT NULL DEFAULT true, starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchasing.vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  vendor_number VARCHAR(20) NOT NULL, name VARCHAR(200) NOT NULL, name_ar VARCHAR(200),
  contact_person VARCHAR(100), email VARCHAR(255), phone VARCHAR(20), whatsapp VARCHAR(20),
  country VARCHAR(2) NOT NULL DEFAULT 'CN', city VARCHAR(100), address TEXT,
  payment_terms VARCHAR(50), lead_time_days INTEGER DEFAULT 14,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, vendor_number)
);

CREATE TABLE IF NOT EXISTS purchasing.purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  po_number VARCHAR(20) NOT NULL, vendor_id UUID NOT NULL REFERENCES purchasing.vendors(id),
  warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
  status VARCHAR(20) NOT NULL DEFAULT 'draft', currency VARCHAR(3) NOT NULL DEFAULT 'EGP',
  subtotal BIGINT NOT NULL DEFAULT 0, shipping_cost BIGINT NOT NULL DEFAULT 0,
  customs_cost BIGINT NOT NULL DEFAULT 0, other_costs BIGINT NOT NULL DEFAULT 0,
  tax_amount BIGINT NOT NULL DEFAULT 0, total BIGINT NOT NULL DEFAULT 0,
  landed_cost_total BIGINT NOT NULL DEFAULT 0, notes TEXT, expected_date TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, po_number)
);

CREATE TABLE IF NOT EXISTS purchasing.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchasing.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES catalog.products(id),
  variant_id UUID REFERENCES catalog.product_variants(id),
  sku VARCHAR(50) NOT NULL, name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL, received_qty INTEGER NOT NULL DEFAULT 0,
  unit_cost BIGINT NOT NULL, total_cost BIGINT NOT NULL, landed_unit_cost BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS accounting.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  account_number VARCHAR(20) NOT NULL, name VARCHAR(200) NOT NULL, name_ar VARCHAR(200),
  account_type VARCHAR(30) NOT NULL, parent_id UUID REFERENCES accounting.chart_of_accounts(id),
  is_system BOOLEAN NOT NULL DEFAULT false, is_active BOOLEAN NOT NULL DEFAULT true,
  balance BIGINT NOT NULL DEFAULT 0, currency VARCHAR(3) NOT NULL DEFAULT 'EGP',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, account_number)
);

CREATE TABLE IF NOT EXISTS accounting.journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  entry_number VARCHAR(20) NOT NULL, date DATE NOT NULL, description TEXT,
  reference_type VARCHAR(30), reference_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  total_debit BIGINT NOT NULL DEFAULT 0, total_credit BIGINT NOT NULL DEFAULT 0,
  is_auto BOOLEAN NOT NULL DEFAULT false, posted_by UUID, posted_at TIMESTAMPTZ,
  created_by UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, entry_number)
);

CREATE TABLE IF NOT EXISTS accounting.journal_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES accounting.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounting.chart_of_accounts(id),
  debit BIGINT NOT NULL DEFAULT 0, credit BIGINT NOT NULL DEFAULT 0,
  description TEXT, sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS accounting.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  expense_number VARCHAR(20) NOT NULL, account_id UUID NOT NULL REFERENCES accounting.chart_of_accounts(id),
  vendor_id UUID REFERENCES purchasing.vendors(id),
  amount BIGINT NOT NULL, tax_amount BIGINT NOT NULL DEFAULT 0, total BIGINT NOT NULL,
  category VARCHAR(50), description TEXT, date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'approved', created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, expense_number)
);

CREATE TABLE IF NOT EXISTS shipping.shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  order_id UUID NOT NULL REFERENCES sales.sales_orders(id),
  tracking_number VARCHAR(100), carrier VARCHAR(50) NOT NULL DEFAULT 'bosta',
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  recipient_name VARCHAR(200), recipient_phone VARCHAR(20),
  address_line1 VARCHAR(255), city VARCHAR(100), governorate VARCHAR(100),
  cod_amount BIGINT DEFAULT 0, shipping_cost BIGINT DEFAULT 0,
  carrier_ref VARCHAR(100),
  shipped_at TIMESTAMPTZ, delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES iam.tenants(id),
  customer_id UUID NOT NULL REFERENCES sales.customers(id),
  type VARCHAR(20) NOT NULL, points INTEGER NOT NULL, balance_after INTEGER NOT NULL,
  reference_type VARCHAR(30), reference_id UUID, description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.outbox_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL, aggregate_id UUID NOT NULL,
  event_type VARCHAR(100) NOT NULL, payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', retry_count INTEGER NOT NULL DEFAULT 0,
  processed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.migrations (
  id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_tenant ON iam.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON catalog.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON catalog.products(category_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON catalog.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_lookup ON inventory.stock_levels(tenant_id, product_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON inventory.stock_movements(tenant_id, product_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON sales.sales_orders(tenant_id, ordered_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON sales.sales_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON sales.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON sales.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_po_tenant ON purchasing.purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipping.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_outbox_status ON public.outbox_events(status, created_at);
