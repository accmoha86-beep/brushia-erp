/**
 * Catalog Module Contract
 * Defines the public interface that other modules can use to interact with Catalog.
 * No direct database access across module boundaries — only through contracts.
 */

export interface ProductInfo {
  id: string;
  sku: string;
  name: string;
  basePrice: number;    // Minor units (piasters)
  costPrice: number;    // Minor units
  taxRate: number;
  trackInventory: boolean;
  isActive: boolean;
}

export interface VariantInfo {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: number;        // Effective price (override or parent)
  cost: number;
  attributes: Record<string, string>;
  barcode?: string;
}

export interface ICatalogService {
  /** Get product by ID */
  getProduct(tenantId: string, productId: string): Promise<ProductInfo | null>;
  
  /** Get variant by ID */
  getVariant(tenantId: string, variantId: string): Promise<VariantInfo | null>;
  
  /** Resolve barcode to product/variant */
  resolveBarcode(tenantId: string, barcode: string): Promise<{ productId: string; variantId?: string } | null>;
  
  /** Get products by IDs (batch) */
  getProductsByIds(tenantId: string, productIds: string[]): Promise<ProductInfo[]>;
  
  /** Search products */
  searchProducts(tenantId: string, query: string, limit?: number): Promise<ProductInfo[]>;
}
