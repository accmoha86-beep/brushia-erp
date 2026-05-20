/**
 * Domain Events
 * Written to the transactional outbox table for eventual consistency.
 * Consumers process these events asynchronously.
 */

// ─── Base Event ──────────────────────────────────────────
export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  tenantId: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
  metadata?: {
    correlationId?: string;
    causationId?: string;
    userId?: string;
  };
}

// ─── Catalog Events ──────────────────────────────────────
export interface ProductCreatedEvent extends DomainEvent {
  eventType: 'catalog.product.created';
  aggregateType: 'product';
  payload: {
    productId: string;
    sku: string;
    name: string;
    categoryId: string;
    basePrice: number;
  };
}

export interface ProductPriceChangedEvent extends DomainEvent {
  eventType: 'catalog.product.price_changed';
  aggregateType: 'product';
  payload: {
    productId: string;
    oldPrice: number;
    newPrice: number;
  };
}

// ─── Inventory Events ────────────────────────────────────
export interface StockMovedEvent extends DomainEvent {
  eventType: 'inventory.stock.moved';
  aggregateType: 'stock_level';
  payload: {
    productId: string;
    variantId?: string;
    warehouseId: string;
    movementType: string;
    quantity: number;
    balanceAfter: number;
  };
}

export interface LowStockAlertEvent extends DomainEvent {
  eventType: 'inventory.stock.low_alert';
  aggregateType: 'stock_level';
  payload: {
    productId: string;
    variantId?: string;
    warehouseId: string;
    currentQty: number;
    reorderPoint: number;
  };
}

// ─── Sales Events ────────────────────────────────────────
export interface OrderCreatedEvent extends DomainEvent {
  eventType: 'sales.order.created';
  aggregateType: 'sales_order';
  payload: {
    orderId: string;
    orderNumber: string;
    customerId?: string;
    total: number;
    itemCount: number;
    orderSource: string;
  };
}

export interface OrderCancelledEvent extends DomainEvent {
  eventType: 'sales.order.cancelled';
  aggregateType: 'sales_order';
  payload: {
    orderId: string;
    orderNumber: string;
    reason: string;
  };
}

export interface PaymentReceivedEvent extends DomainEvent {
  eventType: 'sales.payment.received';
  aggregateType: 'payment';
  payload: {
    paymentId: string;
    orderId: string;
    amount: number;
    method: string;
  };
}

// ─── Purchasing Events ───────────────────────────────────
export interface PurchaseOrderReceivedEvent extends DomainEvent {
  eventType: 'purchasing.po.received';
  aggregateType: 'purchase_order';
  payload: {
    purchaseOrderId: string;
    poNumber: string;
    vendorId: string;
    itemsReceived: number;
  };
}

// ─── CRM Events ──────────────────────────────────────────
export interface CustomerTierChangedEvent extends DomainEvent {
  eventType: 'crm.customer.tier_changed';
  aggregateType: 'customer';
  payload: {
    customerId: string;
    oldTier: string;
    newTier: string;
    totalPoints: number;
  };
}

// ─── All Events Union ────────────────────────────────────
export type BrushiaEvent =
  | ProductCreatedEvent
  | ProductPriceChangedEvent
  | StockMovedEvent
  | LowStockAlertEvent
  | OrderCreatedEvent
  | OrderCancelledEvent
  | PaymentReceivedEvent
  | PurchaseOrderReceivedEvent
  | CustomerTierChangedEvent;

// ─── Event Type Registry ─────────────────────────────────
export const EVENT_TYPES = {
  // Catalog
  PRODUCT_CREATED: 'catalog.product.created',
  PRODUCT_PRICE_CHANGED: 'catalog.product.price_changed',
  
  // Inventory
  STOCK_MOVED: 'inventory.stock.moved',
  LOW_STOCK_ALERT: 'inventory.stock.low_alert',
  
  // Sales
  ORDER_CREATED: 'sales.order.created',
  ORDER_CANCELLED: 'sales.order.cancelled',
  PAYMENT_RECEIVED: 'sales.payment.received',
  
  // Purchasing
  PO_RECEIVED: 'purchasing.po.received',
  
  // CRM
  CUSTOMER_TIER_CHANGED: 'crm.customer.tier_changed',
} as const;
