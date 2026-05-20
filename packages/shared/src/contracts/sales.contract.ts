/**
 * Sales Module Contract
 */

export interface CreateSalesOrderRequest {
  tenantId: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  orderSource: 'pos' | 'backoffice' | 'whatsapp' | 'exhibition' | 'wholesale' | 'online';
  warehouseId: string;
  posSessionId?: string;
  exhibitionId?: string;
  salespersonId?: string;
  priceListId?: string;
  promotionId?: string;
  loyaltyPointsRedeemed?: number;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;      // Minor units
    discountAmount?: number;
  }>;
  discountAmount?: number;
  internalNotes?: string;
  customerNotes?: string;
  idempotencyKey: string;
  createdBy: string;
}

export interface SalesOrderResult {
  orderId: string;
  orderNumber: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

export interface ISalesService {
  /** Create a new sales order */
  createOrder(request: CreateSalesOrderRequest): Promise<SalesOrderResult>;
  
  /** Cancel an order (reverses stock, accounting) */
  cancelOrder(tenantId: string, orderId: string, reason: string, cancelledBy: string): Promise<void>;
  
  /** Record a payment against an order */
  recordPayment(tenantId: string, orderId: string, amount: number, method: string, bankAccountId?: string, receivedBy?: string): Promise<{ paymentId: string }>;
  
  /** Get order status */
  getOrderStatus(tenantId: string, orderId: string): Promise<{ status: string; paymentStatus: string }>;
}
