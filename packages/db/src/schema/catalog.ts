import { pgSchema, uuid, varchar, text, bigint, integer, boolean, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const catalogSchema = pgSchema('catalog');

export const brands = catalogSchema.table('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  nameAr: varchar('name_ar', { length: 100 }),
  slug: varchar('slug', { length: 120 }).notNull(),
  logoUrl: text('logo_url'),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const categories = catalogSchema.table('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  parentId: uuid('parent_id'),
  name: varchar('name', { length: 100 }).notNull(),
  nameAr: varchar('name_ar', { length: 100 }),
  slug: varchar('slug', { length: 120 }).notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const products = catalogSchema.table('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  categoryId: uuid('category_id').notNull(),
  brandId: uuid('brand_id'),
  sku: varchar('sku', { length: 50 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  nameAr: varchar('name_ar', { length: 200 }),
  slug: varchar('slug', { length: 220 }).notNull(),
  description: text('description'),
  productType: varchar('product_type', { length: 20 }).notNull().default('simple'),
  basePrice: bigint('base_price', { mode: 'number' }).notNull().default(0),
  costPrice: bigint('cost_price', { mode: 'number' }).notNull().default(0),
  compareAtPrice: bigint('compare_at_price', { mode: 'number' }),
  taxInclusive: boolean('tax_inclusive').notNull().default(true),
  taxRate: varchar('tax_rate').notNull().default('14.00'),
  weightGrams: integer('weight_grams'),
  trackInventory: boolean('track_inventory').notNull().default(true),
  allowBackorder: boolean('allow_backorder').notNull().default(false),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(10),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  isActive: boolean('is_active').notNull().default(true),
  tags: text('tags').array(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const productVariants = catalogSchema.table('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  productId: uuid('product_id').notNull(),
  sku: varchar('sku', { length: 50 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  attributes: jsonb('attributes').notNull().default({}),
  priceOverride: bigint('price_override', { mode: 'number' }),
  costOverride: bigint('cost_override', { mode: 'number' }),
  weightGrams: integer('weight_grams'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  barcode: varchar('barcode', { length: 50 }),
  barcodeType: varchar('barcode_type', { length: 10 }).default('EAN13'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const productImages = catalogSchema.table('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  productId: uuid('product_id').notNull(),
  variantId: uuid('variant_id'),
  url: text('url').notNull(),
  altText: varchar('alt_text', { length: 200 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isPrimary: boolean('is_primary').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  variants: many(productVariants),
  images: many(productImages),
}));

export const variantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));
