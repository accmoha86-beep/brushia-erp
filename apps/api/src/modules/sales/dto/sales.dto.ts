import { z } from 'zod';

export const OrderItemDto = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  quantity: z.number().int().min(1),
  unit_price: z.number().int().min(0), // In piasters — can override for wholesale
  discount_amount: z.number().int().min(0).default(0), // Per-item discount in piasters
  discount_percentage: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
});

export const CreateSalesOrderDto = z.object({
  customer_id: z.string().uuid().optional(), // Walk-in if not provided
  location_id: z.string().uuid(),
  source: z.enum(['pos', 'web', 'whatsapp', 'phone', 'exhibition', 'wholesale']),
  
  items: z.array(OrderItemDto).min(1),
  
  // Discounts
  order_discount_amount: z.number().int().min(0).default(0),
  order_discount_percentage: z.number().min(0).max(100).default(0),
  coupon_code: z.string().optional(),
  
  // Tax
  is_taxable: z.boolean().default(true),
  tax_rate: z.number().min(0).max(100).default(14), // Egypt VAT
  
  // Shipping
  shipping_amount: z.number().int().min(0).default(0),
  shipping_address_id: z.string().uuid().optional(),
  
  // Payment
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'vodafone_cash', 'instapay', 'split', 'credit']),
  
  // For split payments
  payments: z.array(z.object({
    method: z.enum(['cash', 'card', 'bank_transfer', 'vodafone_cash', 'instapay']),
    amount: z.number().int().min(1),
    reference: z.string().optional(),
  })).optional(),
  
  // Loyalty
  loyalty_points_used: z.number().int().min(0).default(0),
  
  // Wholesale
  price_list_id: z.string().uuid().optional(),
  
  // Salesperson
  salesperson_id: z.string().uuid().optional(),
  
  notes: z.string().optional(),
});

export const CancelOrderDto = z.object({
  reason: z.string().min(1).max(500),
  restock: z.boolean().default(true),
});

export const OrderQueryDto = z.object({
  status: z.enum(['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).optional(),
  source: z.string().optional(),
  customer_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).default('1'),
  limit: z.string().regex(/^\d+$/).default('50'),
});

export type TCreateSalesOrder = z.infer<typeof CreateSalesOrderDto>;
export type TCancelOrder = z.infer<typeof CancelOrderDto>;
export type TOrderQuery = z.infer<typeof OrderQueryDto>;
