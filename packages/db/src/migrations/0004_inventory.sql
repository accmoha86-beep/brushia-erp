-- Migration 0004: Inventory Domain
-- Schema: inventory
-- Tables: warehouses, locations, stock_levels, stock_movements, 
--         stock_reservations, stock_takes, stock_take_items,
--         landed_cost_allocations

SET search_path TO inventory, shared, public;

-- ─── Warehouses ──────────────────────────────────────────
CREATE TABLE inventory.warehouses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    code            VARCHAR(20) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    name_ar         VARCHAR(100),
    warehouse_type  VARCHAR(20) NOT NULL DEFAULT 'standard'
                    CHECK (warehouse_type IN ('standard', 'exhibition', 'transit', 'returns', 'damaged')),
    
    -- Address
    address_line1   VARCHAR(200),
    address_line2   VARCHAR(200),
    city            VARCHAR(100),
    governorate     VARCHAR(50),
    postal_code     VARCHAR(10),
    country         VARCHAR(2) NOT NULL DEFAULT 'EG',
    
    -- Contact
    phone           VARCHAR(20),
    manager_id      UUID REFERENCES iam.users(id),
    
    -- Status
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_default      BOOLEAN NOT NULL DEFAULT false,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, code)
);

-- ─── Warehouse Locations (Bin/Shelf) ────────────────────
CREATE TABLE inventory.locations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    warehouse_id    UUID NOT NULL REFERENCES inventory.warehouses(id),
    code            VARCHAR(30) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    location_type   VARCHAR(20) NOT NULL DEFAULT 'shelf'
                    CHECK (location_type IN ('shelf', 'bin', 'floor', 'display', 'cold_storage')),
    zone            VARCHAR(50),
    aisle           VARCHAR(10),
    rack            VARCHAR(10),
    shelf_level     VARCHAR(10),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, warehouse_id, code)
);

-- ─── Stock Levels (Materialized) ─────────────────────────
-- Denormalized for fast reads; authoritative source is stock_movements
CREATE TABLE inventory.stock_levels (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    product_id      UUID NOT NULL,  -- References catalog.products
    variant_id      UUID,           -- References catalog.product_variants
    warehouse_id    UUID NOT NULL REFERENCES inventory.warehouses(id),
    location_id     UUID REFERENCES inventory.locations(id),
    
    -- Quantities
    qty_on_hand     INTEGER NOT NULL DEFAULT 0,
    qty_reserved    INTEGER NOT NULL DEFAULT 0,
    qty_available   INTEGER GENERATED ALWAYS AS (qty_on_hand - qty_reserved) STORED,
    qty_incoming    INTEGER NOT NULL DEFAULT 0,  -- From pending POs
    
    -- Weighted Average Cost (in minor units — piasters)
    weighted_avg_cost BIGINT NOT NULL DEFAULT 0,
    
    -- Thresholds
    reorder_point   INTEGER NOT NULL DEFAULT 10,
    reorder_qty     INTEGER NOT NULL DEFAULT 50,
    max_stock       INTEGER,
    
    -- Tracking
    last_counted_at TIMESTAMPTZ,
    last_movement_at TIMESTAMPTZ,
    
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, product_id, variant_id, warehouse_id, location_id),
    CHECK (qty_on_hand >= 0),
    CHECK (qty_reserved >= 0),
    CHECK (qty_reserved <= qty_on_hand)
);

CREATE INDEX idx_stock_product ON inventory.stock_levels(tenant_id, product_id, variant_id);
CREATE INDEX idx_stock_warehouse ON inventory.stock_levels(tenant_id, warehouse_id);
CREATE INDEX idx_stock_low ON inventory.stock_levels(tenant_id) 
    WHERE qty_on_hand <= reorder_point AND qty_on_hand > 0;

-- ─── Stock Movements (Immutable Ledger) ──────────────────
-- This is the source of truth. Every stock change creates a movement.
CREATE TABLE inventory.stock_movements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    -- What moved
    product_id      UUID NOT NULL,
    variant_id      UUID,
    warehouse_id    UUID NOT NULL REFERENCES inventory.warehouses(id),
    location_id     UUID REFERENCES inventory.locations(id),
    
    -- Movement
    movement_type   VARCHAR(30) NOT NULL
                    CHECK (movement_type IN (
                        'purchase_receive', 'purchase_return',
                        'sale', 'sale_return',
                        'transfer_out', 'transfer_in',
                        'adjustment_up', 'adjustment_down',
                        'damage', 'expiry',
                        'stock_take_adjust',
                        'exhibition_out', 'exhibition_return',
                        'initial_stock'
                    )),
    quantity        INTEGER NOT NULL,  -- Positive = in, Negative = out
    
    -- Cost at time of movement (minor units)
    unit_cost       BIGINT NOT NULL DEFAULT 0,
    total_cost      BIGINT NOT NULL DEFAULT 0,
    
    -- Running balance AFTER this movement
    balance_after   INTEGER NOT NULL,
    avg_cost_after  BIGINT NOT NULL DEFAULT 0,
    
    -- Reference
    reference_type  VARCHAR(30),  -- 'purchase_order', 'sales_order', 'transfer', 'stock_take'
    reference_id    UUID,
    reference_number VARCHAR(50),
    
    -- Context
    reason          TEXT,
    performed_by    UUID NOT NULL REFERENCES iam.users(id),
    
    -- Immutable
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Idempotency
    idempotency_key VARCHAR(100),
    UNIQUE(tenant_id, idempotency_key)
);

CREATE INDEX idx_movements_product ON inventory.stock_movements(tenant_id, product_id, variant_id, created_at DESC);
CREATE INDEX idx_movements_warehouse ON inventory.stock_movements(tenant_id, warehouse_id, created_at DESC);
CREATE INDEX idx_movements_reference ON inventory.stock_movements(tenant_id, reference_type, reference_id);
CREATE INDEX idx_movements_date ON inventory.stock_movements(tenant_id, created_at DESC);

-- ─── Stock Reservations ──────────────────────────────────
CREATE TABLE inventory.stock_reservations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    product_id      UUID NOT NULL,
    variant_id      UUID,
    warehouse_id    UUID NOT NULL REFERENCES inventory.warehouses(id),
    
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    
    -- What reserved it
    reference_type  VARCHAR(30) NOT NULL,  -- 'sales_order', 'pos_transaction'
    reference_id    UUID NOT NULL,
    
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'fulfilled', 'released', 'expired')),
    
    expires_at      TIMESTAMPTZ,
    fulfilled_at    TIMESTAMPTZ,
    released_at     TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservations_active ON inventory.stock_reservations(tenant_id, product_id, variant_id, warehouse_id) 
    WHERE status = 'active';

-- ─── Stock Takes ─────────────────────────────────────────
CREATE TABLE inventory.stock_takes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    stock_take_number VARCHAR(30) NOT NULL,
    warehouse_id    UUID NOT NULL REFERENCES inventory.warehouses(id),
    
    take_type       VARCHAR(20) NOT NULL DEFAULT 'full'
                    CHECK (take_type IN ('full', 'partial', 'cycle', 'spot')),
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'in_progress', 'counting', 'review', 'approved', 'applied', 'cancelled')),
    
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    approved_by     UUID REFERENCES iam.users(id),
    approved_at     TIMESTAMPTZ,
    
    notes           TEXT,
    
    -- Variance summary (filled after counting)
    total_items_counted INTEGER DEFAULT 0,
    total_variance_qty  INTEGER DEFAULT 0,
    total_variance_cost BIGINT DEFAULT 0,
    
    created_by      UUID NOT NULL REFERENCES iam.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, stock_take_number)
);

CREATE TABLE inventory.stock_take_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    stock_take_id   UUID NOT NULL REFERENCES inventory.stock_takes(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL,
    variant_id      UUID,
    location_id     UUID REFERENCES inventory.locations(id),
    
    -- Counts
    system_qty      INTEGER NOT NULL,
    counted_qty     INTEGER,
    variance_qty    INTEGER GENERATED ALWAYS AS (counted_qty - system_qty) STORED,
    
    -- Cost impact
    unit_cost       BIGINT NOT NULL DEFAULT 0,
    variance_cost   BIGINT GENERATED ALWAYS AS ((counted_qty - system_qty) * unit_cost) STORED,
    
    -- Tracking
    counted_by      UUID REFERENCES iam.users(id),
    counted_at      TIMESTAMPTZ,
    notes           TEXT,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_take_items ON inventory.stock_take_items(tenant_id, stock_take_id);

-- ─── Landed Cost Allocations ─────────────────────────────
CREATE TABLE inventory.landed_cost_allocations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    
    -- Reference to PO or shipment
    reference_type  VARCHAR(30) NOT NULL,  -- 'purchase_order', 'shipment'
    reference_id    UUID NOT NULL,
    
    -- Cost breakdown
    cost_type       VARCHAR(30) NOT NULL
                    CHECK (cost_type IN (
                        'freight_china', 'agent_fee', 'insurance',
                        'customs_duty', 'clearance_fee', 'local_shipping',
                        'inspection', 'other'
                    )),
    description     TEXT,
    amount          BIGINT NOT NULL CHECK (amount >= 0),  -- Minor units
    currency        VARCHAR(3) NOT NULL DEFAULT 'EGP',
    exchange_rate   NUMERIC(10,4) DEFAULT 1.0,
    amount_egp      BIGINT NOT NULL CHECK (amount_egp >= 0),
    
    -- Allocation method
    allocation_method VARCHAR(20) NOT NULL DEFAULT 'by_value'
                    CHECK (allocation_method IN ('by_value', 'by_quantity', 'by_weight', 'manual')),
    
    created_by      UUID REFERENCES iam.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_landed_costs ON inventory.landed_cost_allocations(tenant_id, reference_type, reference_id);

-- ─── Inventory Transfers ─────────────────────────────────
CREATE TABLE inventory.transfers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    transfer_number VARCHAR(30) NOT NULL,
    
    from_warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
    to_warehouse_id   UUID NOT NULL REFERENCES inventory.warehouses(id),
    
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'in_transit', 'received', 'cancelled')),
    
    notes           TEXT,
    shipped_at      TIMESTAMPTZ,
    received_at     TIMESTAMPTZ,
    
    created_by      UUID NOT NULL REFERENCES iam.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, transfer_number),
    CHECK (from_warehouse_id != to_warehouse_id)
);

CREATE TABLE inventory.transfer_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES iam.tenants(id),
    transfer_id     UUID NOT NULL REFERENCES inventory.transfers(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL,
    variant_id      UUID,
    quantity_sent    INTEGER NOT NULL CHECK (quantity_sent > 0),
    quantity_received INTEGER DEFAULT 0,
    unit_cost       BIGINT NOT NULL DEFAULT 0,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── RLS ─────────────────────────────────────────────────
ALTER TABLE inventory.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.stock_takes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.stock_take_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.landed_cost_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.transfer_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_iso ON inventory.warehouses USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON inventory.locations USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON inventory.stock_levels USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON inventory.stock_movements USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON inventory.stock_reservations USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON inventory.stock_takes USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON inventory.stock_take_items USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON inventory.landed_cost_allocations USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON inventory.transfers USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
CREATE POLICY tenant_iso ON inventory.transfer_items USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ─── Triggers ────────────────────────────────────────────
CREATE TRIGGER set_updated_at BEFORE UPDATE ON inventory.warehouses
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON inventory.stock_levels
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON inventory.stock_takes
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON inventory.transfers
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

-- ─── Safety: Prevent mutation of stock_movements ─────────
CREATE OR REPLACE FUNCTION inventory.prevent_movement_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'stock_movements are immutable — cannot % rows', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_update ON inventory.stock_movements
    BEFORE UPDATE FOR EACH ROW
    EXECUTE FUNCTION inventory.prevent_movement_mutation();

CREATE TRIGGER no_delete ON inventory.stock_movements
    BEFORE DELETE FOR EACH ROW
    EXECUTE FUNCTION inventory.prevent_movement_mutation();
