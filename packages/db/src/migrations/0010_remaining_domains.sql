-- Migration 0010: Promotions, HR, Exhibitions, WhatsApp, Settings
-- Schemas: promotions, hr, exhibitions, whatsapp, settings

-- ═══════════════════════════════════════════════════════════
-- PROMOTIONS DOMAIN
-- ═══════════════════════════════════════════════════════════
SET search_path TO promotions, shared, public;

CREATE TABLE promotions.promotions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    code            VARCHAR(50),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    
    promotion_type  VARCHAR(30) NOT NULL
                    CHECK (promotion_type IN (
                        'percentage_off', 'fixed_amount_off', 'buy_x_get_y',
                        'bundle_deal', 'free_shipping', 'free_gift',
                        'tiered_discount', 'flash_sale'
                    )),
    
    -- Discount
    discount_value  NUMERIC(10,2),
    discount_max    BIGINT,  -- Cap for percentage discounts
    
    -- Conditions
    min_purchase_amount BIGINT DEFAULT 0,
    min_quantity    INTEGER DEFAULT 0,
    
    -- Scope
    applies_to      VARCHAR(20) NOT NULL DEFAULT 'all'
                    CHECK (applies_to IN ('all', 'category', 'product', 'brand', 'customer_type')),
    applies_to_ids  UUID[] DEFAULT '{}',
    
    -- Buy X Get Y specifics
    buy_quantity    INTEGER,
    get_quantity    INTEGER,
    get_product_id  UUID,
    
    -- Validity
    start_date      TIMESTAMPTZ NOT NULL,
    end_date        TIMESTAMPTZ NOT NULL,
    
    -- Limits
    max_uses        INTEGER,
    max_uses_per_customer INTEGER,
    current_uses    INTEGER NOT NULL DEFAULT 0,
    
    -- Stacking
    is_stackable    BOOLEAN NOT NULL DEFAULT false,
    priority        INTEGER NOT NULL DEFAULT 0,
    
    -- Channels
    channels        TEXT[] DEFAULT '{pos,backoffice,whatsapp,online}',
    
    is_active       BOOLEAN NOT NULL DEFAULT true,
    
    created_by      UUID NOT NULL REFERENCES iam.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CHECK (end_date > start_date)
);

CREATE INDEX idx_promos_active ON promotions.promotions(tenant_id) 
    WHERE is_active = true AND now() BETWEEN start_date AND end_date;
CREATE INDEX idx_promos_code ON promotions.promotions(tenant_id, code) WHERE code IS NOT NULL;

CREATE TABLE promotions.promotion_redemptions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    promotion_id    UUID NOT NULL REFERENCES promotions.promotions(id),
    sales_order_id  UUID NOT NULL,
    customer_id     UUID,
    
    discount_applied BIGINT NOT NULL,
    redeemed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE promotions.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions.promotion_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_iso ON promotions.promotions USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON promotions.promotion_redemptions USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON promotions.promotions FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

-- ═══════════════════════════════════════════════════════════
-- HR DOMAIN (Commissions, Salespersons)
-- ═══════════════════════════════════════════════════════════
SET search_path TO hr, shared, public;

CREATE TABLE hr.salespersons (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    user_id         UUID REFERENCES iam.users(id),
    
    employee_code   VARCHAR(20) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100),
    
    phone           VARCHAR(20),
    email           VARCHAR(200),
    
    -- Commission
    default_commission_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
    commission_type VARCHAR(20) NOT NULL DEFAULT 'percentage'
                    CHECK (commission_type IN ('percentage', 'fixed_per_order', 'tiered')),
    
    -- Assignment
    assigned_branches TEXT[] DEFAULT '{}',
    
    is_active       BOOLEAN NOT NULL DEFAULT true,
    
    -- Stats
    total_sales     BIGINT NOT NULL DEFAULT 0,
    total_commission BIGINT NOT NULL DEFAULT 0,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, employee_code)
);

CREATE TABLE hr.commissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    salesperson_id  UUID NOT NULL REFERENCES hr.salespersons(id),
    sales_order_id  UUID NOT NULL,
    
    order_total     BIGINT NOT NULL,
    commission_rate NUMERIC(5,2) NOT NULL,
    commission_amount BIGINT NOT NULL,
    
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'voided')),
    
    approved_by     UUID REFERENCES iam.users(id),
    approved_at     TIMESTAMPTZ,
    paid_at         TIMESTAMPTZ,
    payment_reference VARCHAR(100),
    
    period_start    DATE,
    period_end      DATE,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE hr.commission_rules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    name            VARCHAR(100) NOT NULL,
    rule_type       VARCHAR(20) NOT NULL DEFAULT 'flat'
                    CHECK (rule_type IN ('flat', 'tiered', 'category_based', 'target_based')),
    
    -- Flat rate
    rate            NUMERIC(5,2),
    
    -- Tiered: [{min: 0, max: 50000, rate: 3}, {min: 50000, max: null, rate: 5}]
    tiers           JSONB,
    
    -- Category rates: {"cat_id": 5.0, "cat_id2": 3.0}
    category_rates  JSONB,
    
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE hr.salespersons ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.commission_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_iso ON hr.salespersons USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON hr.commissions USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON hr.commission_rules USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON hr.salespersons FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

-- ═══════════════════════════════════════════════════════════
-- EXHIBITIONS DOMAIN
-- ═══════════════════════════════════════════════════════════
SET search_path TO exhibitions, shared, public;

CREATE TABLE exhibitions.events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    event_code      VARCHAR(20) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    
    venue           VARCHAR(200),
    city            VARCHAR(100),
    governorate     VARCHAR(50),
    
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    
    -- Budget
    budget_amount   BIGINT NOT NULL DEFAULT 0,
    actual_cost     BIGINT NOT NULL DEFAULT 0,
    
    -- Warehouse for stock
    warehouse_id    UUID,  -- Exhibition warehouse
    
    status          VARCHAR(20) NOT NULL DEFAULT 'planning'
                    CHECK (status IN ('planning', 'setup', 'active', 'teardown', 'completed', 'cancelled')),
    
    -- Results
    total_sales     BIGINT NOT NULL DEFAULT 0,
    total_orders    INTEGER NOT NULL DEFAULT 0,
    total_visitors  INTEGER NOT NULL DEFAULT 0,
    
    notes           TEXT,
    
    created_by      UUID NOT NULL REFERENCES iam.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, event_code),
    CHECK (end_date >= start_date)
);

CREATE TABLE exhibitions.event_expenses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    event_id        UUID NOT NULL REFERENCES exhibitions.events(id) ON DELETE CASCADE,
    
    category        VARCHAR(50) NOT NULL,
    description     TEXT NOT NULL,
    amount          BIGINT NOT NULL CHECK (amount >= 0),
    receipt_url     TEXT,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE exhibitions.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibitions.event_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_iso ON exhibitions.events USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON exhibitions.event_expenses USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON exhibitions.events FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

-- ═══════════════════════════════════════════════════════════
-- WHATSAPP DOMAIN
-- ═══════════════════════════════════════════════════════════
SET search_path TO whatsapp, shared, public;

CREATE TABLE whatsapp.conversations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    customer_phone  VARCHAR(20) NOT NULL,
    customer_name   VARCHAR(200),
    customer_id     UUID,  -- Link to crm.customers when matched
    
    status          VARCHAR(20) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'pending', 'converted', 'closed', 'spam')),
    
    -- Conversion
    sales_order_id  UUID,  -- Link when converted to order
    
    assigned_to     UUID REFERENCES iam.users(id),
    
    last_message_at TIMESTAMPTZ,
    message_count   INTEGER NOT NULL DEFAULT 0,
    
    tags            TEXT[] DEFAULT '{}',
    notes           TEXT,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE whatsapp.messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    conversation_id UUID NOT NULL REFERENCES whatsapp.conversations(id) ON DELETE CASCADE,
    
    direction       VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_type    VARCHAR(20) NOT NULL DEFAULT 'text'
                    CHECK (message_type IN ('text', 'image', 'document', 'audio', 'video', 'location', 'catalog')),
    
    content         TEXT,
    media_url       TEXT,
    
    -- Product references
    product_ids     UUID[] DEFAULT '{}',
    
    sent_by         UUID REFERENCES iam.users(id),
    read_at         TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wa_conversations ON whatsapp.conversations(tenant_id, status, updated_at DESC);
CREATE INDEX idx_wa_messages ON whatsapp.messages(tenant_id, conversation_id, created_at DESC);

ALTER TABLE whatsapp.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_iso ON whatsapp.conversations USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON whatsapp.messages USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON whatsapp.conversations FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

-- ═══════════════════════════════════════════════════════════
-- SETTINGS DOMAIN
-- ═══════════════════════════════════════════════════════════
SET search_path TO settings, shared, public;

CREATE TABLE settings.company_settings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    -- Basic
    company_name    VARCHAR(200) NOT NULL DEFAULT 'Brushia',
    company_name_ar VARCHAR(200),
    logo_url        TEXT,
    
    -- Contact
    email           VARCHAR(200),
    phone           VARCHAR(20),
    website         TEXT,
    
    -- Address
    address         TEXT,
    city            VARCHAR(100) DEFAULT 'Cairo',
    governorate     VARCHAR(50) DEFAULT 'Cairo',
    country         VARCHAR(2) NOT NULL DEFAULT 'EG',
    
    -- Tax
    tax_number      VARCHAR(50),
    commercial_register VARCHAR(50),
    default_tax_rate NUMERIC(5,2) NOT NULL DEFAULT 14.00,
    prices_include_tax BOOLEAN NOT NULL DEFAULT true,
    
    -- Currency
    currency        VARCHAR(3) NOT NULL DEFAULT 'EGP',
    currency_symbol VARCHAR(10) NOT NULL DEFAULT 'ج.م',
    
    -- Sequences
    next_order_number INTEGER NOT NULL DEFAULT 1001,
    next_invoice_number INTEGER NOT NULL DEFAULT 1001,
    next_po_number INTEGER NOT NULL DEFAULT 1001,
    next_return_number INTEGER NOT NULL DEFAULT 1001,
    next_shipment_number INTEGER NOT NULL DEFAULT 1001,
    
    -- Order prefix
    order_prefix    VARCHAR(10) DEFAULT 'SO-',
    invoice_prefix  VARCHAR(10) DEFAULT 'INV-',
    po_prefix       VARCHAR(10) DEFAULT 'PO-',
    return_prefix   VARCHAR(10) DEFAULT 'RET-',
    
    -- Receipt
    receipt_header  TEXT,
    receipt_footer  TEXT,
    receipt_show_logo BOOLEAN NOT NULL DEFAULT true,
    
    -- Notifications
    low_stock_alerts BOOLEAN NOT NULL DEFAULT true,
    order_notifications BOOLEAN NOT NULL DEFAULT true,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id)
);

-- ─── Branches / Locations ────────────────────────────────
CREATE TABLE settings.branches (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    branch_code     VARCHAR(20) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    
    address         TEXT,
    city            VARCHAR(100),
    governorate     VARCHAR(50),
    phone           VARCHAR(20),
    
    warehouse_id    UUID,
    
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_main         BOOLEAN NOT NULL DEFAULT false,
    
    operating_hours JSONB,  -- {mon: {open: "10:00", close: "22:00"}, ...}
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, branch_code)
);

ALTER TABLE settings.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_iso ON settings.company_settings USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON settings.branches USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON settings.company_settings FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON settings.branches FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
