import { z } from 'zod';

// ─── Category DTOs ───────────────────────────────────────
export const CreateCategoryDto = z.object({
  name: z.string().min(1).max(100),
  name_ar: z.string().max(100).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  parent_id: z.string().uuid().optional(),
  sort_order: z.number().int().min(0).default(0),
  image_url: z.string().url().optional(),
  is_active: z.boolean().default(true),
});

export const UpdateCategoryDto = CreateCategoryDto.partial();

export const CategoryQueryDto = z.object({
  parent_id: z.string().uuid().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});

// ─── Product DTOs ────────────────────────────────────────
export const CreateProductDto = z.object({
  name: z.string().min(1).max(200),
  name_ar: z.string().max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  sku: z.string().min(1).max(50),
  barcode: z.string().max(50).optional(),
  category_id: z.string().uuid(),
  brand: z.string().max(100).optional(),
  description: z.string().optional(),
  description_ar: z.string().optional(),
  
  // Pricing (in piasters — minor currency unit)
  cost_price: z.number().int().min(0),
  selling_price: z.number().int().min(0),
  compare_at_price: z.number().int().min(0).optional(),
  
  // Product type
  product_type: z.enum(['simple', 'variable']).default('simple'),
  
  // Physical
  weight_grams: z.number().int().min(0).optional(),
  
  // Tax
  tax_rate: z.number().min(0).max(100).default(14), // Egypt VAT
  is_taxable: z.boolean().default(true),
  
  // Status
  is_active: z.boolean().default(true),
  
  // SEO / display
  image_url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateProductDto = CreateProductDto.partial();

export const ProductQueryDto = z.object({
  category_id: z.string().uuid().optional(),
  brand: z.string().optional(),
  product_type: z.enum(['simple', 'variable']).optional(),
  is_active: z.enum(['true', 'false']).optional(),
  min_price: z.string().regex(/^\d+$/).optional(),
  max_price: z.string().regex(/^\d+$/).optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).default('1'),
  limit: z.string().regex(/^\d+$/).default('50'),
  sort_by: z.enum(['name', 'sku', 'selling_price', 'created_at']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

// ─── Variant DTOs ────────────────────────────────────────
export const CreateVariantDto = z.object({
  product_id: z.string().uuid(),
  sku: z.string().min(1).max(50),
  barcode: z.string().max(50).optional(),
  name: z.string().min(1).max(200), // e.g. "Rose Gold", "Shade 03"
  
  // Variant attributes
  option1_name: z.string().max(50).optional(),  // e.g. "Color"
  option1_value: z.string().max(100).optional(), // e.g. "Rose Gold"
  option2_name: z.string().max(50).optional(),   // e.g. "Size"
  option2_value: z.string().max(100).optional(),
  
  // Pricing overrides (piasters)
  cost_price: z.number().int().min(0).optional(),
  selling_price: z.number().int().min(0).optional(),
  
  // Physical
  weight_grams: z.number().int().min(0).optional(),
  image_url: z.string().url().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export const UpdateVariantDto = CreateVariantDto.partial().omit({ product_id: true });

// ─── Barcode Lookup ──────────────────────────────────────
export const BarcodeLookupDto = z.object({
  barcode: z.string().min(1).max(50),
});

export type TCreateCategory = z.infer<typeof CreateCategoryDto>;
export type TUpdateCategory = z.infer<typeof UpdateCategoryDto>;
export type TCreateProduct = z.infer<typeof CreateProductDto>;
export type TUpdateProduct = z.infer<typeof UpdateProductDto>;
export type TProductQuery = z.infer<typeof ProductQueryDto>;
export type TCreateVariant = z.infer<typeof CreateVariantDto>;
export type TUpdateVariant = z.infer<typeof UpdateVariantDto>;