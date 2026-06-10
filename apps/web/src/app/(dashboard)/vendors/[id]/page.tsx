'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api-client';
import { cn, formatEGP } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard, StatCardGrid } from '@/components/ui/stat-card';
import { SearchFilter } from '@/components/ui/search-filter';
import { BloomModal, BtnPrimary, BtnSecondary, BtnDanger } from '@/components/ui/bloom-modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState, TableSkeleton } from '@/components/ui/empty-state';
import { Table, Thead, Th, Td, Tr } from '@/components/ui/table';
import {
  Building2, ArrowLeft, Package, ShoppingCart, Phone, Mail, MapPin,
  MessageCircle, Plus, Trash2, Star, Search, X, Clock, Globe2, FileText,
} from 'lucide-react';

interface Vendor {
  id: string; vendor_number: string; name: string; name_ar?: string;
  contact_person: string; email: string; phone: string; whatsapp?: string;
  country: string; city: string; address?: string; payment_terms: string;
  lead_time_days: number; is_active: boolean; po_count: number;
  total_po_value: number; product_count: number;
}

interface VendorProduct {
  id: string; product_id: string; product_name: string; product_sku: string;
  category_name: string; base_price: number; cost_price: number; stock: number;
  vendor_sku: string; vendor_price: number; lead_time_days: number;
  is_preferred: boolean; min_order_qty: number; notes: string;
}

interface Product {
  id: string; name: string; sku: string; base_price: number; cost_price: number;
  category_name?: string;
}

const countryInfo: Record<string, { flag: string; label: string }> = {
  CN: { flag: '🇨🇳', label: 'China' }, EG: { flag: '🇪🇬', label: 'Egypt' },
  TR: { flag: '🇹🇷', label: 'Turkey' }, US: { flag: '🇺🇸', label: 'USA' },
  KR: { flag: '🇰🇷', label: 'South Korea' }, JP: { flag: '🇯🇵', label: 'Japan' },
  IN: { flag: '🇮🇳', label: 'India' },
};

export default function VendorDetailPage() {
  const { t } = useI18n();
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [linkForm, setLinkForm] = useState({ vendor_sku: '', vendor_price: '', lead_time_days: '', min_order_qty: '1', is_preferred: false, notes: '' });
  const [singleLinkProduct, setSingleLinkProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  const fetchVendor = useCallback(async () => {
    try {
      const res = await api.get<any>(`/purchasing/vendors/${vendorId}/detail`);
      setVendor(res);
    } catch { }
  }, [vendorId]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get<any>(`/purchasing/vendors/${vendorId}/products`);
      setProducts(Array.isArray(res) ? res : []);
    } catch { setProducts([]); }
  }, [vendorId]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get<any>(`/purchasing/orders?vendor_id=${vendorId}`);
      setOrders(Array.isArray(res) ? res : res?.data || []);
    } catch { setOrders([]); }
  }, [vendorId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchVendor(), fetchProducts(), fetchOrders()]).finally(() => setLoading(false));
  }, [fetchVendor, fetchProducts, fetchOrders]);

  const openLinkModal = async () => {
    try {
      const res = await api.get<any>('/catalog/products?limit=500');
      const all = Array.isArray(res) ? res : res?.data?.rows || res?.data || res?.rows || [];
      // Filter out already linked products
      const linkedIds = new Set(products.map(p => p.product_id));
      setAllProducts(all.filter((p: Product) => !linkedIds.has(p.id)));
    } catch { setAllProducts([]); }
    setProductSearch('');
    setSelectedProducts(new Set());
    setSingleLinkProduct(null);
    setLinkForm({ vendor_sku: '', vendor_price: '', lead_time_days: '', min_order_qty: '1', is_preferred: false, notes: '' });
    setShowLinkModal(true);
  };

  const handleLink = async () => {
    setSaving(true);
    try {
      const productIds = singleLinkProduct ? [singleLinkProduct.id] : Array.from(selectedProducts);
      for (const pid of productIds) {
        await api.post(`/purchasing/vendors/${vendorId}/products`, {
          product_id: pid,
          vendor_sku: linkForm.vendor_sku || undefined,
          vendor_price: linkForm.vendor_price ? Math.round(Number(linkForm.vendor_price) * 100) : 0,
          lead_time_days: linkForm.lead_time_days ? Number(linkForm.lead_time_days) : undefined,
          min_order_qty: Number(linkForm.min_order_qty) || 1,
          is_preferred: linkForm.is_preferred,
          notes: linkForm.notes || undefined,
        });
      }
      setShowLinkModal(false);
      fetchProducts();
      fetchVendor();
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  const handleUnlink = async (productId: string) => {
    if (!confirm('Remove this product from vendor?')) return;
    try {
      await api.delete(`/purchasing/vendors/${vendorId}/products/${productId}`);
      fetchProducts();
      fetchVendor();
    } catch (e: any) { alert(e.message); }
  };

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredAllProducts = allProducts.filter(p =>
    `${p.name} ${p.sku}`.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (loading || !vendor) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  const ci = countryInfo[vendor.country] || { flag: '🌍', label: vendor.country };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={vendor.name}
        subtitle={`${vendor.vendor_number} · ${ci.flag} ${ci.label}`}
        icon={<Building2 className="h-5 w-5" />}
        actions={
          <button onClick={() => router.push('/vendors')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition text-sm font-medium">
            <ArrowLeft className="h-4 w-4" /> Back to Vendors
          </button>
        }
      />

      {/* Vendor Info Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-2xl">
              {ci.flag}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{vendor.name}</h3>
              {vendor.name_ar && <p className="text-sm text-gray-500">{vendor.name_ar}</p>}
              <Badge color={vendor.is_active ? 'emerald' : 'gray'} dot>{vendor.is_active ? 'Active' : 'Inactive'}</Badge>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-100">
            {vendor.contact_person && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100"><Building2 className="h-4 w-4 text-gray-500" /></div>
                <span className="text-gray-700">{vendor.contact_person}</span>
              </div>
            )}
            {vendor.phone && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50"><Phone className="h-4 w-4 text-blue-500" /></div>
                <span className="text-gray-700">{vendor.phone}</span>
              </div>
            )}
            {vendor.email && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50"><Mail className="h-4 w-4 text-amber-500" /></div>
                <span className="text-gray-700">{vendor.email}</span>
              </div>
            )}
            {vendor.whatsapp && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50"><MessageCircle className="h-4 w-4 text-green-500" /></div>
                <span className="text-gray-700">{vendor.whatsapp}</span>
              </div>
            )}
            {vendor.city && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50"><MapPin className="h-4 w-4 text-purple-500" /></div>
                <span className="text-gray-700">{vendor.city}, {ci.label}</span>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment Terms</span>
              <Badge color="blue">{vendor.payment_terms}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Lead Time</span>
              <span className="font-medium">{vendor.lead_time_days} days</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <StatCardGrid cols={3}>
            <StatCard label="Linked Products" value={vendor.product_count} icon={<Package className="h-5 w-5" />} color="emerald" />
            <StatCard label="Purchase Orders" value={vendor.po_count} icon={<ShoppingCart className="h-5 w-5" />} color="blue" />
            <StatCard label="Total PO Value" value={formatEGP(vendor.total_po_value)} icon={<FileText className="h-5 w-5" />} color="amber" />
          </StatCardGrid>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {(['products', 'orders'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px',
                  tab === t ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700')}>
                {t === 'products' ? `📦 Products (${products.length})` : `🛒 Purchase Orders (${orders.length})`}
              </button>
            ))}
          </div>

          {/* Products Tab */}
          {tab === 'products' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <BtnPrimary onClick={openLinkModal} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Link Products
                </BtnPrimary>
              </div>

              {products.length === 0 ? (
                <EmptyState icon={<Package className="h-7 w-7" />} title="No products linked"
                  subtitle="Link products this vendor supplies"
                  action={<BtnPrimary onClick={openLinkModal} className="flex items-center gap-2"><Plus className="h-4 w-4" /> Link Products</BtnPrimary>}
                />
              ) : (
                <Table>
                  <Thead>
                    <tr>
                      <Th>Product</Th>
                      <Th>Category</Th>
                      <Th align="right">Our Price</Th>
                      <Th align="right">Vendor Price</Th>
                      <Th align="center">Stock</Th>
                      <Th align="center">Preferred</Th>
                      <Th align="right">Actions</Th>
                    </tr>
                  </Thead>
                  <tbody>
                    {products.map(p => (
                      <Tr key={p.id}>
                        <Td>
                          <div>
                            <p className="font-semibold text-gray-900">{p.product_name}</p>
                            <p className="text-xs text-gray-400 font-mono">{p.product_sku}</p>
                            {p.vendor_sku && <p className="text-xs text-blue-500">Vendor SKU: {p.vendor_sku}</p>}
                          </div>
                        </Td>
                        <Td><span className="text-sm text-gray-600">{p.category_name || '—'}</span></Td>
                        <Td align="right"><span className="font-medium">{formatEGP(p.base_price)}</span></Td>
                        <Td align="right">
                          <span className={cn('font-medium', p.vendor_price > 0 ? 'text-blue-600' : 'text-gray-400')}>
                            {p.vendor_price > 0 ? formatEGP(p.vendor_price) : '—'}
                          </span>
                        </Td>
                        <Td align="center"><span className="font-semibold">{p.stock}</span></Td>
                        <Td align="center">
                          {p.is_preferred && <Star className="h-4 w-4 text-amber-400 fill-amber-400 mx-auto" />}
                        </Td>
                        <Td align="right">
                          <button onClick={() => handleUnlink(p.product_id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {tab === 'orders' && (
            <div>
              {orders.length === 0 ? (
                <EmptyState icon={<ShoppingCart className="h-7 w-7" />} title="No purchase orders yet"
                  subtitle="Create a purchase order for this vendor"
                />
              ) : (
                <Table>
                  <Thead>
                    <tr>
                      <Th>PO Number</Th>
                      <Th>Status</Th>
                      <Th align="right">Total</Th>
                      <Th align="center">Items</Th>
                      <Th>Date</Th>
                    </tr>
                  </Thead>
                  <tbody>
                    {orders.map((o: any) => (
                      <Tr key={o.id}>
                        <Td><span className="font-mono font-semibold text-gray-900">{o.po_number}</span></Td>
                        <Td><Badge color={o.status === 'received' ? 'emerald' : o.status === 'draft' ? 'gray' : 'blue'}>{o.status}</Badge></Td>
                        <Td align="right"><span className="font-medium">{formatEGP(o.total)}</span></Td>
                        <Td align="center">{o.item_count || 0}</Td>
                        <Td><span className="text-sm text-gray-500">{new Date(o.created_at).toLocaleDateString()}</span></Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Link Products Modal */}
      <BloomModal open={showLinkModal} onClose={() => setShowLinkModal(false)}
        title="Link Products to Vendor" size="lg"
        footer={
          <>
            <BtnSecondary onClick={() => setShowLinkModal(false)}>Cancel</BtnSecondary>
            <BtnPrimary onClick={handleLink} disabled={saving || (selectedProducts.size === 0 && !singleLinkProduct)}>
              {saving ? 'Linking...' : `Link ${singleLinkProduct ? '1' : selectedProducts.size} Product(s)`}
            </BtnPrimary>
          </>
        }
      >
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)}
              placeholder="Search products by name or SKU..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Product list with checkboxes */}
          <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
            {filteredAllProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                {allProducts.length === 0 ? 'All products already linked!' : 'No matching products'}
              </div>
            ) : (
              filteredAllProducts.slice(0, 50).map(p => (
                <label key={p.id}
                  className={cn('flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition',
                    selectedProducts.has(p.id) && 'bg-emerald-50'
                  )}>
                  <input
                    type="checkbox" checked={selectedProducts.has(p.id)}
                    onChange={() => toggleProduct(p.id)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">{formatEGP(p.base_price)}</p>
                    {p.category_name && <p className="text-xs text-gray-400">{p.category_name}</p>}
                  </div>
                </label>
              ))
            )}
          </div>

          {selectedProducts.size > 0 && (
            <p className="text-sm text-emerald-600 font-medium">
              ✓ {selectedProducts.size} product(s) selected
            </p>
          )}

          {/* Link details */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Link Details (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Vendor SKU</label>
                <input type="text" value={linkForm.vendor_sku} onChange={e => setLinkForm({...linkForm, vendor_sku: e.target.value})}
                  placeholder="Vendor's product code"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Vendor Price (EGP)</label>
                <input type="number" value={linkForm.vendor_price} onChange={e => setLinkForm({...linkForm, vendor_price: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Lead Time (days)</label>
                <input type="number" value={linkForm.lead_time_days} onChange={e => setLinkForm({...linkForm, lead_time_days: e.target.value})}
                  placeholder={String(vendor.lead_time_days)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min Order Qty</label>
                <input type="number" value={linkForm.min_order_qty} onChange={e => setLinkForm({...linkForm, min_order_qty: e.target.value})}
                  placeholder="1"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={linkForm.is_preferred} onChange={e => setLinkForm({...linkForm, is_preferred: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500" />
              <Star className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-gray-700">Set as preferred vendor for these products</span>
            </label>
          </div>
        </div>
      </BloomModal>
    </div>
  );
}
