-- Migration 0009: CRM + Shipping Domains
-- Schemas: crm, shipping

-- ═══════════════════════════════════════════════════════════
-- CRM DOMAIN
-- ═══════════════════════════════════════════════════════════
SET search_path TO crm, shared, public;

-- ─── Customers ───────────────────────────────────────────
CREATE TABLE crm.customers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    customer_code   VARCHAR(20) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100),
    company_name    VARCHAR(200),
    
    email           VARCHAR(200),
    phone           VARCHAR(20),
    whatsapp        VARCHAR(20),
    
    -- Address
    address_line1   VARCHAR(200),
    address_line2   VARCHAR(200),
    city            VARCHAR(100),
    governorate     VARCHAR(50),
    postal_code     VARCHAR(10),
    country         VARCHAR(2) NOT NULL DEFAULT 'EG',
    
    -- Classification
    customer_type   VARCHAR(20) NOT NULL DEFAULT 'retail'
                    CHECK (customer_type IN ('retail', 'wholesale', 'vip', 'corporate', 'exhibition')),
    
    -- Wholesale
    price_list_id   UUID,
    credit_limit    BIGINT DEFAULT 0,
    payment_terms   VARCHAR(30) DEFAULT 'immediate',
    tax_number      VARCHAR(50),
    
    -- Loyalty
    loyalty_tier    VARCHAR(20) DEFAULT 'bronze'
                    CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),
    loyalty_points  INTEGER NOT NULL DEFAULT 0,
    
    -- Stats (denormalized)
    total_orders    INTEGER NOT NULL DEFAULT 0,
    total_spent     BIGINT NOT NULL DEFAULT 0,
    last_order_at   TIMESTAMPTZ,
    avg_order_value BIGINT NOT NULL DEFAULT 0,
    
    -- Marketing
    accepts_marketing BOOLEAN NOT NULL DEFAULT false,
    acquisition_source VARCHAR(30),
    tags            TEXT[] DEFAULT '{}',
    
    -- Status
    is_active       BOOLEAN NOT NULL DEFAULT true,
    
    notes           TEXT,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    
    UNIQUE(tenant_id, customer_code)
);

CREATE INDEX idx_customers_phone ON crm.customers(tenant_id, phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_email ON crm.customers(tenant_id, email) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_type ON crm.customers(tenant_id, customer_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_search ON crm.customers USING gin(
    (setweight(to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '')), 'A') ||
     setweight(to_tsvector('english', coalesce(phone, '')), 'B') ||
     setweight(to_tsvector('english', coalesce(company_name, '')), 'C'))
);

-- ─── Customer Addresses ──────────────────────────────────
CREATE TABLE crm.customer_addresses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    customer_id     UUID NOT NULL REFERENCES crm.customers(id) ON DELETE CASCADE,
    
    label           VARCHAR(50) NOT NULL DEFAULT 'Home',
    address_line1   VARCHAR(200) NOT NULL,
    address_line2   VARCHAR(200),
    city            VARCHAR(100) NOT NULL,
    governorate     VARCHAR(50) NOT NULL,
    postal_code     VARCHAR(10),
    country         VARCHAR(2) NOT NULL DEFAULT 'EG',
    
    phone           VARCHAR(20),
    is_default      BOOLEAN NOT NULL DEFAULT false,
    
    -- Bosta-specific
    zone_id         VARCHAR(50),
    district_id     VARCHAR(50),
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Loyalty Program ─────────────────────────────────────
CREATE TABLE crm.loyalty_programs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    name            VARCHAR(100) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    
    -- Earn rules
    points_per_egp  NUMERIC(5,2) NOT NULL DEFAULT 1.0,  -- Points earned per EGP spent
    
    -- Tier thresholds (lifetime points)
    silver_threshold INTEGER NOT NULL DEFAULT 500,
    gold_threshold   INTEGER NOT NULL DEFAULT 2000,
    platinum_threshold INTEGER NOT NULL DEFAULT 5000,
    
    -- Redemption
    point_value_piasters INTEGER NOT NULL DEFAULT 100,  -- 1 point = 1 EGP (100 piasters)
    min_redeem_points INTEGER NOT NULL DEFAULT 100,
    max_redeem_percent NUMERIC(5,2) NOT NULL DEFAULT 50.00,  -- Max 50% of order
    
    -- Tier multipliers
    silver_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.5,
    gold_multiplier  NUMERIC(3,2) NOT NULL DEFAULT 2.0,
    platinum_multiplier NUMERIC(3,2) NOT NULL DEFAULT 3.0,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Loyalty Transactions ────────────────────────────────
CREATE TABLE crm.loyalty_transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    customer_id     UUID NOT NULL REFERENCES crm.customers(id),
    
    transaction_type VARCHAR(20) NOT NULL
                    CHECK (transaction_type IN ('earn', 'redeem', 'adjust', 'expire', 'tier_bonus')),
    points          INTEGER NOT NULL,  -- Positive = earn, Negative = redeem
    balance_after   INTEGER NOT NULL,
    
    -- Reference
    reference_type  VARCHAR(30),
    reference_id    UUID,
    
    description     TEXT,
    expires_at      TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loyalty_tx ON crm.loyalty_transactions(tenant_id, customer_id, created_at DESC);

-- ─── Wholesale Price Lists ───────────────────────────────
CREATE TABLE crm.price_lists (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    
    discount_type   VARCHAR(10) NOT NULL DEFAULT 'percentage'
                    CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value  NUMERIC(10,2) NOT NULL DEFAULT 0,
    
    min_order_amount BIGINT DEFAULT 0,
    
    is_active       BOOLEAN NOT NULL DEFAULT true,
    valid_from      DATE,
    valid_to        DATE,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, name)
);

CREATE TABLE crm.price_list_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    price_list_id   UUID NOT NULL REFERENCES crm.price_lists(id) ON DELETE CASCADE,
    
    product_id      UUID NOT NULL,
    variant_id      UUID,
    
    custom_price    BIGINT,  -- Override price (minor units)
    discount_percentage NUMERIC(5,2),  -- Or percentage off base
    
    min_quantity    INTEGER DEFAULT 1,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, price_list_id, product_id, variant_id)
);

-- CRM RLS
ALTER TABLE crm.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.price_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_iso ON crm.customers USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON crm.customer_addresses USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON crm.loyalty_programs USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON crm.loyalty_transactions USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON crm.price_lists USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON crm.price_list_items USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON crm.customers FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON crm.price_lists FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON crm.loyalty_programs FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

-- ═══════════════════════════════════════════════════════════
-- SHIPPING DOMAIN
-- ═══════════════════════════════════════════════════════════
SET search_path TO shipping, shared, public;

-- ─── Couriers ────────────────────────────────────────────
CREATE TABLE shipping.couriers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    name            VARCHAR(100) NOT NULL,
    code            VARCHAR(20) NOT NULL,
    
    -- API integration
    api_provider    VARCHAR(30)
                    CHECK (api_provider IN ('bosta', 'aramex', 'dhl', 'fedex', 'custom', 'manual')),
    api_key_encrypted TEXT,
    api_base_url    TEXT,
    
    -- Settings
    default_service_type VARCHAR(30),
    supports_cod    BOOLEAN NOT NULL DEFAULT true,
    supports_tracking BOOLEAN NOT NULL DEFAULT true,
    
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, code)
);

-- ─── Shipments ───────────────────────────────────────────
CREATE TABLE shipping.shipments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    shipment_number VARCHAR(30) NOT NULL,
    sales_order_id  UUID NOT NULL,
    courier_id      UUID REFERENCES shipping.couriers(id),
    
    -- Tracking
    tracking_number VARCHAR(100),
    tracking_url    TEXT,
    
    -- Addresses
    ship_from       JSONB,
    ship_to         JSONB NOT NULL,
    
    -- Package
    weight_grams    INTEGER,
    dimensions      JSONB,  -- {length, width, height}
    package_count   INTEGER NOT NULL DEFAULT 1,
    
    -- Costs
    shipping_cost   BIGINT NOT NULL DEFAULT 0,
    insurance_cost  BIGINT NOT NULL DEFAULT 0,
    cod_amount      BIGINT NOT NULL DEFAULT 0,
    is_cod          BOOLEAN NOT NULL DEFAULT false,
    
    -- Status
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'label_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'failed', 'cancelled')),
    
    -- Dates
    estimated_delivery DATE,
    shipped_at      TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    
    -- External ref
    external_id     VARCHAR(100),  -- Bosta order ID etc.
    
    notes           TEXT,
    
    created_by      UUID NOT NULL REFERENCES iam.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, shipment_number)
);

CREATE INDEX idx_shipments_order ON shipping.shipments(tenant_id, sales_order_id);
CREATE INDEX idx_shipments_tracking ON shipping.shipments(tenant_id, tracking_number);
CREATE INDEX idx_shipments_status ON shipping.shipments(tenant_id, status);

-- ─── Shipment Events (Tracking History) ──────────────────
CREATE TABLE shipping.shipment_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    shipment_id     UUID NOT NULL REFERENCES shipping.shipments(id) ON DELETE CASCADE,
    
    event_type      VARCHAR(30) NOT NULL,
    description     TEXT,
    location        VARCHAR(200),
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- From webhook/API
    raw_data        JSONB,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shipment_events ON shipping.shipment_events(tenant_id, shipment_id, occurred_at DESC);

-- Shipping RLS
ALTER TABLE shipping.couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping.shipment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_iso ON shipping.couriers USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON shipping.shipments USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON shipping.shipment_events USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON shipping.shipments FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
