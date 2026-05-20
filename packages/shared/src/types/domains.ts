/**
 * Domain-specific types shared between frontend and backend.
 */

import type { TenantEntity, Money, EntityId } from './common.js';

// ─── User & Auth ───
export type UserRole = 'super_admin' | 'tenant_admin' | 'manager' | 'accountant' | 'warehouse' | 'cashier' | 'viewer';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface User extends TenantEntity {
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  branchIds: EntityId[];
  lastLoginAt: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

// ─── Tenant ───
export type SubscriptionTier = 'starter' | 'professional' | 'enterprise';

export interface Tenant {
  id: EntityId;
  name: string;
  slug: string;
  tier: SubscriptionTier;
  currency: 'EGP';
  vatRate: number;     // 14 for Egypt
  timezone: string;    // Africa/Cairo
  locale: string;      // ar-EG
  isActive: boolean;
  createdAt: string;
}

// ─── Branch & Warehouse ───
export interface Branch extends TenantEntity {
  name: string;
  code: string;
  address: string;
  governorate: EgyptGovernorates;
  phone: string;
  isActive: boolean;
}

export interface Warehouse extends TenantEntity {
  name: string;
  code: string;
  branchId: EntityId;
  type: 'main' | 'transit' | 'returns' | 'exhibition';
  isActive: boolean;
}

// ─── Catalog ───
export type ProductType = 'simple' | 'variable';
export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Product extends TenantEntity {
  sku: string;
  name: string;
  nameAr?: string;
  type: ProductType;
  categoryId: EntityId;
  brandId?: EntityId;
  status: ProductStatus;
  description?: string;
  imageUrl?: string;
  barcode?: string;
  costPrice: Money;
  sellingPrice: Money;
  wholesalePrice?: Money;
  vatInclusive: boolean;
  weight?: number;
  parentId?: EntityId;     // For variants
  attributes?: Record<string, string>; // e.g., { shade: 'Rose', size: '30ml' }
}

export interface Category extends TenantEntity {
  name: string;
  nameAr?: string;
  slug: string;
  parentId?: EntityId;
  sortOrder: number;
  imageUrl?: string;
}

// ─── Inventory ───
export type MovementType =
  | 'purchase_receive'
  | 'sale'
  | 'sale_return'
  | 'transfer_out'
  | 'transfer_in'
  | 'adjustment_add'
  | 'adjustment_remove'
  | 'damage'
  | 'stock_take';

export interface InventoryLevel {
  productId: EntityId;
  warehouseId: EntityId;
  onHand: number;
  reserved: number;
  available: number;  // onHand - reserved
}

export interface StockMovement extends TenantEntity {
  productId: EntityId;
  warehouseId: EntityId;
  type: MovementType;
  quantity: number;     // Positive for in, negative for out
  referenceType: string;
  referenceId: EntityId;
  unitCost: Money;
  notes?: string;
  performedBy: EntityId;
}

// ─── Sales ───
export type OrderStatus = 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'vodafone_cash' | 'instapay' | 'fawry';
export type OrderSource = 'pos' | 'backoffice' | 'whatsapp' | 'online' | 'exhibition';

export interface SalesOrder extends TenantEntity {
  orderNumber: string;
  customerId?: EntityId;
  branchId: EntityId;
  source: OrderSource;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: Money;
  vatAmount: Money;
  discountAmount: Money;
  shippingAmount: Money;
  total: Money;
  notes?: string;
  salespersonId?: EntityId;
}

export interface SalesOrderItem {
  id: EntityId;
  orderId: EntityId;
  productId: EntityId;
  quantity: number;
  unitPrice: Money;
  discount: Money;
  vatAmount: Money;
  total: Money;
}

// ─── Egyptian Governorates ───
export type EgyptGovernorates =
  | 'Cairo' | 'Giza' | 'Alexandria' | 'Qalyubia'
  | 'Dakahlia' | 'Sharqia' | 'Gharbia' | 'Monufia'
  | 'Beheira' | 'Kafr El Sheikh' | 'Damietta' | 'Port Said'
  | 'Ismailia' | 'Suez' | 'North Sinai' | 'South Sinai'
  | 'Red Sea' | 'New Valley' | 'Matrouh' | 'Fayoum'
  | 'Beni Suef' | 'Minya' | 'Assiut' | 'Sohag'
  | 'Qena' | 'Luxor' | 'Aswan';
