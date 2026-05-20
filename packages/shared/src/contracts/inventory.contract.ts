/**
 * Inventory Module Contract
 * Other modules call these methods to read/write stock.
 * All stock mutations go through the Inventory Transaction Engine.
 */

export interface StockLevel {
  productId: string;
  variantId?: string;
  warehouseId: string;
  qtyOnHand: number;
  qtyReserved: number;
  qtyAvailable: number;
  qtyIncoming: number;
  weightedAvgCost: number;  // Minor units
}

export interface StockMutationRequest {
  tenantId: string;
  productId: string;
  variantId?: string;
  warehouseId: string;
  movementType: string;
  quantity: number;           // Positive = in, Negative = out
  unitCost: number;
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  reason?: string;
  performedBy: string;
  idempotencyKey: string;    // REQUIRED — prevents double-processing
}

export interface ReservationRequest {
  tenantId: string;
  productId: string;
  variantId?: string;
  warehouseId: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  expiresAt?: Date;
}

export interface IInventoryService {
  /** Get stock level for a product at a warehouse */
  getStockLevel(tenantId: string, productId: string, variantId: string | null, warehouseId: string): Promise<StockLevel | null>;
  
  /** Get all stock levels for a product across all warehouses */
  getStockLevels(tenantId: string, productId: string, variantId?: string): Promise<StockLevel[]>;
  
  /** Execute a stock mutation (the core inventory transaction) */
  mutateStock(request: StockMutationRequest): Promise<{ movementId: string; balanceAfter: number; avgCostAfter: number }>;
  
  /** Reserve stock for a pending order */
  reserveStock(request: ReservationRequest): Promise<{ reservationId: string }>;
  
  /** Release a reservation (order cancelled) */
  releaseReservation(tenantId: string, reservationId: string): Promise<void>;
  
  /** Fulfill a reservation (order shipped) */
  fulfillReservation(tenantId: string, reservationId: string): Promise<void>;
  
  /** Check if quantity is available (non-blocking check) */
  checkAvailability(tenantId: string, productId: string, variantId: string | null, warehouseId: string, quantity: number): Promise<boolean>;
}
