import { z } from 'zod';

export const MovementType = z.enum([
  'purchase_receive',  // Goods receipt from PO
  'sale',              // Deduction from sale
  'sale_return',       // Customer return
  'transfer_out',      // Transfer from location
  'transfer_in',       // Transfer to location
  'adjustment_in',     // Manual positive adjustment
  'adjustment_out',    // Manual negative adjustment
  'damage',            // Damaged goods write-off
  'stock_take',        // Correction from physical count
  'initial',           // Initial stock load
]);

export const RecordMovementDto = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  location_id: z.string().uuid(),
  movement_type: MovementType,
  quantity: z.number().int(), // Positive for IN, negative for OUT
  unit_cost: z.number().int().min(0).optional(), // In piasters
  reference_type: z.string().max(50).optional(), // 'sales_order', 'purchase_order', etc.
  reference_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const BulkMovementDto = z.object({
  movements: z.array(RecordMovementDto).min(1).max(500),
  reference_type: z.string().max(50).optional(),
  reference_id: z.string().uuid().optional(),
});

export const ReserveStockDto = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  location_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  reference_type: z.string().max(50),
  reference_id: z.string().uuid(),
  expires_at: z.string().datetime().optional(),
});

export const ReleaseReservationDto = z.object({
  reservation_id: z.string().uuid(),
  convert_to_movement: z.boolean().default(false), // true = convert reservation to actual deduction
});

export const TransferStockDto = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  from_location_id: z.string().uuid(),
  to_location_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  notes: z.string().optional(),
});

export const StockQueryDto = z.object({
  location_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  below_reorder: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).default('1'),
  limit: z.string().regex(/^\d+$/).default('50'),
});

export const MovementQueryDto = z.object({
  product_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  movement_type: MovementType.optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).default('1'),
  limit: z.string().regex(/^\d+$/).default('50'),
});

export const StockTakeDto = z.object({
  location_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  notes: z.string().optional(),
});

export const StockTakeCountDto = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    variant_id: z.string().uuid().optional(),
    counted_quantity: z.number().int().min(0),
  })).min(1),
});

export type TRecordMovement = z.infer<typeof RecordMovementDto>;
export type TBulkMovement = z.infer<typeof BulkMovementDto>;
export type TReserveStock = z.infer<typeof ReserveStockDto>;
export type TTransferStock = z.infer<typeof TransferStockDto>;
export type TStockQuery = z.infer<typeof StockQueryDto>;
export type TMovementQuery = z.infer<typeof MovementQueryDto>;