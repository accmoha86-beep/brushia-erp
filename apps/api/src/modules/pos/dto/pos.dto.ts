import { z } from 'zod';

// ─── Register Management ─────────────────────────────────
export const CreateRegisterDto = z.object({
  name: z.string().min(1).max(100),
  location_id: z.string().uuid(),
  device_name: z.string().max(100).optional(),
  receipt_header: z.string().optional(),
  receipt_footer: z.string().optional(),
});

// ─── Session Management ──────────────────────────────────
export const OpenSessionDto = z.object({
  register_id: z.string().uuid(),
  opening_cash: z.number().int().min(0), // In piasters
  notes: z.string().optional(),
});

export const CloseSessionDto = z.object({
  closing_cash: z.number().int().min(0), // In piasters
  notes: z.string().optional(),
  cash_denominations: z.object({
    p200: z.number().int().min(0).default(0),  // 200 EGP notes
    p100: z.number().int().min(0).default(0),
    p50: z.number().int().min(0).default(0),
    p20: z.number().int().min(0).default(0),
    p10: z.number().int().min(0).default(0),
    p5: z.number().int().min(0).default(0),
    p1: z.number().int().min(0).default(0),
    coins: z.number().int().min(0).default(0),
  }).optional(),
});

// ─── POS Transaction (Sale) ──────────────────────────────
export const POSItemDto = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  quantity: z.number().int().min(1),
  unit_price: z.number().int().min(0),
  discount_amount: z.number().int().min(0).default(0),
  discount_percentage: z.number().min(0).max(100).default(0),
});

export const POSTransactionDto = z.object({
  session_id: z.string().uuid(),
  customer_id: z.string().uuid().optional(),
  
  items: z.array(POSItemDto).min(1),
  
  // Discounts
  order_discount_amount: z.number().int().min(0).default(0),
  order_discount_percentage: z.number().min(0).max(100).default(0),
  promotion_id: z.string().uuid().optional(),
  coupon_code: z.string().optional(),
  
  // Payment
  payments: z.array(z.object({
    method: z.enum(['cash', 'card', 'vodafone_cash', 'instapay']),
    amount: z.number().int().min(1),
    reference: z.string().optional(),
  })).min(1),
  
  // Loyalty
  loyalty_points_used: z.number().int().min(0).default(0),
  
  // Salesperson
  salesperson_id: z.string().uuid().optional(),
  
  notes: z.string().optional(),
});

// ─── Held Orders ─────────────────────────────────────────
export const HoldOrderDto = z.object({
  session_id: z.string().uuid(),
  customer_name: z.string().optional(),
  items: z.array(POSItemDto).min(1),
  notes: z.string().optional(),
});

// ─── Cash Movement ───────────────────────────────────────
export const CashMovementDto = z.object({
  session_id: z.string().uuid(),
  type: z.enum(['cash_in', 'cash_out']),
  amount: z.number().int().min(1),
  reason: z.string().min(1).max(200),
  reference: z.string().optional(),
});

export type TOpenSession = z.infer<typeof OpenSessionDto>;
export type TCloseSession = z.infer<typeof CloseSessionDto>;
export type TPOSTransaction = z.infer<typeof POSTransactionDto>;
export type THoldOrder = z.infer<typeof HoldOrderDto>;
export type TCashMovement = z.infer<typeof CashMovementDto>;
