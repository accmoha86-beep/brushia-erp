-- Migration 0003: Catalog Domain
-- Schema: catalog
-- Tables: brands, categories, products, product_variants, product_images, barcodes

SET search_path TO catalog, shared, public;

-- ─── Brands ──────────────────────────────────────────────
CREATE TABLE catalog.brands (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    name            VARCHAR(100) NOT NULL,
    name_ar         VARCHAR(100),
    slug            VARCHAR(120) NOT NULL,
    logo_url        TEXT,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, slug)
);

-- ─── Categories ──────────────────────────────────────────
CREATE TABLE catalog.categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    parent_id       UUID REFERENCES catalog.categories(id),
    name            VARCHAR(100) NOT NULL,
    name_ar         VARCHAR(100),
    slug            VARCHAR(120) NOT NULL,
    description     TEXT,
    image_url       TEXT,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_categories_parent ON catalog.categories(tenant_id, parent_id);

-- ─── Products (Master) ──────────────────────────────────
CREATE TABLE catalog.products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    category_id     UUID NOT NULL REFERENCES catalog.categories(id),
    brand_id        UUID REFERENCES catalog.brands(id),
    sku             VARCHAR(50) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    name_ar         VARCHAR(200),
    slug            VARCHAR(220) NOT NULL,
    description     TEXT,
    description_ar  TEXT,
    product_type    VARCHAR(20) NOT NULL DEFAULT 'simple'
                    CHECK (product_type IN ('simple', 'variable', 'bundle', 'service')),
    
    -- Pricing (stored in minor units — piasters for EGP)
    base_price      BIGINT NOT NULL DEFAULT 0 CHECK (base_price >= 0),
    cost_price      BIGINT NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
    compare_at_price BIGINT CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
    
    -- Tax
    tax_inclusive    BOOLEAN NOT NULL DEFAULT true,
    tax_rate         NUMERIC(5,2) NOT NULL DEFAULT 14.00,
    
    -- Physical
    weight_grams    INTEGER,
    width_mm        INTEGER,
    height_mm       INTEGER,
    depth_mm        INTEGER,
    
    -- Inventory
    track_inventory BOOLEAN NOT NULL DEFAULT true,
    allow_backorder BOOLEAN NOT NULL DEFAULT false,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    
    -- Status
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'active', 'archived', 'discontinued')),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    published_at    TIMESTAMPTZ,
    
    -- SEO / Display
    tags            TEXT[] DEFAULT '{}',
    meta_title      VARCHAR(200),
    meta_description TEXT,
    
    -- Audit
    created_by      UUID REFERENCES iam.users(id),
    updated_by      UUID REFERENCES iam.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    
    UNIQUE(tenant_id, sku)
);

CREATE INDEX idx_products_category ON catalog.products(tenant_id, category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_brand ON catalog.products(tenant_id, brand_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_status ON catalog.products(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_search ON catalog.products USING gin(
    (setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
     setweight(to_tsvector('english', coalesce(sku, '')), 'B') ||
     setweight(to_tsvector('english', coalesce(description, '')), 'C'))
);
CREATE INDEX idx_products_tags ON catalog.products USING gin(tags);

-- ─── Product Variants ────────────────────────────────────
CREATE TABLE catalog.product_variants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    product_id      UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    sku             VARCHAR(50) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    
    -- Variant attributes (e.g., {"color": "Ruby Red", "shade": "Dark"})
    attributes      JSONB NOT NULL DEFAULT '{}',
    
    -- Pricing overrides (NULL = inherit from parent)
    price_override  BIGINT CHECK (price_override IS NULL OR price_override >= 0),
    cost_override   BIGINT CHECK (cost_override IS NULL OR cost_override >= 0),
    
    -- Physical overrides
    weight_grams    INTEGER,
    
    -- Status
    is_active       BOOLEAN NOT NULL DEFAULT true,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    
    -- Barcode
    barcode         VARCHAR(50),
    barcode_type    VARCHAR(10) DEFAULT 'EAN13'
                    CHECK (barcode_type IN ('EAN13', 'UPC', 'CODE128', 'QR')),
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    
    UNIQUE(tenant_id, sku)
);

CREATE INDEX idx_variants_product ON catalog.product_variants(tenant_id, product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_variants_barcode ON catalog.product_variants(tenant_id, barcode) WHERE barcode IS NOT NULL;

-- ─── Product Images ──────────────────────────────────────
CREATE TABLE catalog.product_images (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    product_id      UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    variant_id      UUID REFERENCES catalog.product_variants(id) ON DELETE SET NULL,
    url             TEXT NOT NULL,
    alt_text        VARCHAR(200),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_primary      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_images_product ON catalog.product_images(tenant_id, product_id);

-- ─── Barcodes (for quick POS scanning) ──────────────────
CREATE TABLE catalog.barcodes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    barcode         VARCHAR(50) NOT NULL,
    barcode_type    VARCHAR(10) NOT NULL DEFAULT 'EAN13',
    product_id      UUID REFERENCES catalog.products(id),
    variant_id      UUID REFERENCES catalog.product_variants(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, barcode),
    CHECK (product_id IS NOT NULL OR variant_id IS NOT NULL)
);

CREATE INDEX idx_barcodes_lookup ON catalog.barcodes(tenant_id, barcode);

-- ─── RLS Policies ────────────────────────────────────────
ALTER TABLE catalog.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.barcodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_brands ON catalog.brands
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_categories ON catalog.categories
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_products ON catalog.products
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_variants ON catalog.product_variants
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_images ON catalog.product_images
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_barcodes ON catalog.barcodes
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ─── Triggers ────────────────────────────────────────────
CREATE TRIGGER set_updated_at BEFORE UPDATE ON catalog.brands
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON catalog.categories
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON catalog.products
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON catalog.product_variants
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
