import { pgSchema, uuid, varchar, text, bigint, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const inventorySchema = pgSchema('inventory');

export const warehouses = inventorySchema.table('warehouses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  nameAr: varchar('name_ar', { length: 100 }),
  warehouseType: varchar('warehouse_type', { length: 20 }).notNull().default('standard'),
  city: varchar('city', { length: 100 }),
  governorate: varchar('governorate', { length: 50 }),
  country: varchar('country', { length: 2 }).notNull().default('EG'),
  phone: varchar('phone', { length: 20 }),
  managerId: uuid('manager_id'),
  isActive: boolean('is_active').notNull().default(true),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const stockLevels = inventorySchema.table('stock_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  productId: uuid('product_id').notNull(),
  variantId: uuid('variant_id'),
  warehouseId: uuid('warehouse_id').notNull(),
  locationId: uuid('location_id'),
  qtyOnHand: integer('qty_on_hand').notNull().default(0),
  qtyReserved: integer('qty_reserved').notNull().default(0),
  qtyIncoming: integer('qty_incoming').notNull().default(0),
  weightedAvgCost: bigint('weighted_avg_cost', { mode: 'number' }).notNull().default(0),
  reorderPoint: integer('reorder_point').notNull().default(10),
  reorderQty: integer('reorder_qty').notNull().default(50),
  lastCountedAt: timestamp('last_counted_at', { withTimezone: true }),
  lastMovementAt: timestamp('last_movement_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const stockMovements = inventorySchema.table('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  productId: uuid('product_id').notNull(),
  variantId: uuid('variant_id'),
  warehouseId: uuid('warehouse_id').notNull(),
  locationId: uuid('location_id'),
  movementType: varchar('movement_type', { length: 30 }).notNull(),
  quantity: integer('quantity').notNull(),
  unitCost: bigint('unit_cost', { mode: 'number' }).notNull().default(0),
  totalCost: bigint('total_cost', { mode: 'number' }).notNull().default(0),
  balanceAfter: integer('balance_after').notNull(),
  avgCostAfter: bigint('avg_cost_after', { mode: 'number' }).notNull().default(0),
  referenceType: varchar('reference_type', { length: 30 }),
  referenceId: uuid('reference_id'),
  referenceNumber: varchar('reference_number', { length: 50 }),
  reason: text('reason'),
  performedBy: uuid('performed_by').notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const stockReservations = inventorySchema.table('stock_reservations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  productId: uuid('product_id').notNull(),
  variantId: uuid('variant_id'),
  warehouseId: uuid('warehouse_id').notNull(),
  quantity: integer('quantity').notNull(),
  referenceType: varchar('reference_type', { length: 30 }).notNull(),
  referenceId: uuid('reference_id').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  fulfilledAt: timestamp('fulfilled_at', { withTimezone: true }),
  releasedAt: timestamp('released_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const warehouseRelations = relations(warehouses, ({ many }) => ({
  stockLevels: many(stockLevels),
}));
