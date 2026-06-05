'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { formatEGP, cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { exportToCSV, exportToExcelXML } from '@/lib/export-data';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard, StatCardGrid } from '@/components/ui/stat-card';
import { SearchFilter, FilterTabs } from '@/components/ui/search-filter';
import { BloomModal, BtnPrimary, BtnSecondary, BtnDanger } from '@/components/ui/bloom-modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState, TableSkeleton } from '@/components/ui/empty-state';
import { Table, Thead, Th, Td, Tr } from '@/components/ui/table';
import {
  Package, Plus, RefreshCw, Search, Eye, Edit, Trash2, X, Download,
  Tag, DollarSign, Archive, ChevronLeft, ChevronRight, Save, AlertTriangle,
  Check, Palette, Barcode, Layers,
} from 'lucide-react';

interface Product {
  id: string; sku: string; name: string; name_ar?: string; description?: string;
  category_id?: string; category_name?: string; base_price: number; cost_price: number;
  total_stock?: number; status: string; barcode?: string; is_active?: boolean;
  variant_count?: number; created_at?: string;
  variants?: Array<{ id: string; name: string; sku: string; color_code?: string; cost_override?: number; price_override?: number; stock?: number; }>;
}

interface Category { id: string; name: string; slug: string; product_count?: number; }

const emptyForm = { name: '', name_ar: '', sku: '', description: '', category_id: '', base_price: '', cost_price: '', barcode: '', status: 'active' };

export default function ProductsPage() {
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const limit = 50;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/catalog/products', { limit, page });
      setProducts(Array.isArray(res) ? res : res?.data || []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [page]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get<any>('/catalog/categories');
      setCategories(Array.isArray(res) ? res : res?.data || []);
    } catch {}
  }, []);

  useEffect(() => { fetchProducts(); fetchCategories(); }, [fetchProducts, fetchCategories]);

  const openCreate = () => { setEditProduct(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name, name_ar: p.name_ar || '', sku: p.sku, description: p.description || '',
      category_id: p.category_id || '', base_price: String(Number(p.base_price) / 100 || ''),
      cost_price: String(Number(p.cost_price) / 100 || ''), barcode: p.barcode || '', status: p.status || 'active',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { ...form, base_price: Math.round(Number(form.base_price) * 100), cost_price: Math.round(Number(form.cost_price) * 100) };
      if (editProduct) await api.put(`/catalog/products/${editProduct.id}`, body);
      else await api.post('/catalog/products', body);
      setShowModal(false); fetchProducts();
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try { await api.delete(`/catalog/products/${deleteConfirm.id}`); setDeleteConfirm(null); fetchProducts(); }
    catch (e: any) { alert(e.message); }
  };

  const viewDetail = async (p: Product) => {
    try {
      const full = await api.get<any>(`/catalog/products/${p.id}`);
      setViewProduct(full?.data || full || p);
    } catch { setViewProduct(p); }
  };

  const filtered = products.filter(p => {
    const matchSearch = `${p.name} ${p.sku} ${p.category_name || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || p.category_id === filterCat;
    return matchSearch && matchCat;
  });

  const totalValue = products.reduce((s, p) => s + Number(p.base_price) * Number(p.total_stock || 0), 0);
  const totalStock = products.reduce((s, p) => s + Number(p.total_stock || 0), 0);
  const lowStock = products.filter(p => Number(p.total_stock || 0) < 20).length;

  const exportData = () => {
    const rows = filtered.map(p => ({
      SKU: p.sku, Name: p.name, Category: p.category_name || '', 
      Price: (Number(p.base_price) / 100).toFixed(2), Cost: (Number(p.cost_price) / 100).toFixed(2),
      Stock: p.total_stock || 0, Variants: p.variant_count || 0, Status: p.status,
    }));
    exportToCSV(rows, 'products');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={t('products.title') || 'Products'}
        subtitle={t('products.subtitle') || 'Manage your product catalog, variants, and pricing'}
        icon={<Package className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            <button onClick={exportData} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition" title="Export CSV">
              <Download className="h-4 w-4" />
            </button>
            <button onClick={fetchProducts} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition">
              <RefreshCw className="h-4 w-4" />
            </button>
            <BtnPrimary onClick={openCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> {t('products.addProduct') || 'Add Product' || 'Add Product'}
            </BtnPrimary>
          </div>
        }
      />

      <StatCardGrid cols={4}>
        <StatCard label={t('products.totalProducts') || 'Total Products'} value={products.length} icon={<Package className="h-5 w-5" />} color="emerald" />
        <StatCard label={t('products.stock') || 'Total Stock'} value={totalStock.toLocaleString()} icon={<Archive className="h-5 w-5" />} color="blue" />
        <StatCard label={'Inventory Value'} value={formatEGP(totalValue)} icon={<DollarSign className="h-5 w-5" />} color="teal" />
        <StatCard label={t('products.lowStock') || 'Low Stock'} value={lowStock} icon={<AlertTriangle className="h-5 w-5" />} color="amber" />
      </StatCardGrid>

      <SearchFilter
        search={search} onSearchChange={setSearch}
        placeholder={t('products.productName') || 'Search products...' || 'Search by name, SKU, or category...'}
        filters={
          <FilterTabs
            tabs={[
              { key: 'all', label: t('common.all') || 'All', count: products.length },
              ...categories.slice(0, 5).map(c => ({ key: c.id, label: c.name, count: c.product_count })),
            ]}
            active={filterCat} onChange={setFilterCat}
          />
        }
      />

      <Table>
        <Thead>
          <tr>
            <Th>Product</Th>
            <Th>SKU</Th>
            <Th>Category</Th>
            <Th align="right">Price</Th>
            <Th align="right">Cost</Th>
            <Th align="right">Stock</Th>
            <Th align="center">Variants</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </tr>
        </Thead>
        <tbody>
          {loading ? <TableSkeleton rows={6} cols={9} /> : filtered.length === 0 ? (
            <tr><td colSpan={9}>
              <EmptyState icon={<Package className="h-7 w-7" />} title="No products found"
                description={search ? 'Try a different search term' : 'Start adding products to your catalog'}
                action={!search ? <BtnPrimary onClick={openCreate} className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add Product</BtnPrimary> : undefined}
              />
            </td></tr>
          ) : (
            filtered.map((p) => {
              const priceRaw = Number(p.base_price);
              const costRaw = Number(p.cost_price);
              const price = priceRaw / 100;
              const cost = costRaw / 100;
              const stock = Number(p.total_stock || 0);
              const margin = price > 0 ? ((price - cost) / price * 100) : 0;
              return (
                <Tr key={p.id} onClick={() => viewDetail(p)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 text-lg">
                        💄
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 line-clamp-1">{p.name}</p>
                        {p.name_ar && <p className="text-xs text-gray-400" dir="rtl">{p.name_ar}</p>}
                      </div>
                    </div>
                  </Td>
                  <Td><span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{p.sku}</span></Td>
                  <Td><Badge color="blue">{p.category_name || '—'}</Badge></Td>
                  <Td align="right"><span className="font-semibold text-gray-900">{formatEGP(priceRaw)}</span></Td>
                  <Td align="right">
                    <div>
                      <span className="text-gray-600">{formatEGP(costRaw)}</span>
                      <p className="text-[10px] text-emerald-600 font-medium">{margin.toFixed(0)}% margin</p>
                    </div>
                  </Td>
                  <Td align="right">
                    <span className={cn('font-semibold', stock < 20 ? 'text-red-600' : 'text-gray-900')}>
                      {stock.toLocaleString()}
                    </span>
                  </Td>
                  <Td align="center">
                    {Number(p.variant_count || 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm"><Palette className="h-3.5 w-3.5 text-purple-500" /> {p.variant_count}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </Td>
                  <Td>
                    <Badge color={p.status === 'active' ? 'emerald' : p.status === 'draft' ? 'amber' : 'gray'} dot>
                      {p.status}
                    </Badge>
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={(e) => { e.stopPropagation(); viewDetail(p); }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(p); }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              );
            })
          )}
        </tbody>
      </Table>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filtered.length} products</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="flex items-center gap-1 rounded-xl border px-3 py-2 hover:bg-gray-50 disabled:opacity-50 transition">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="flex items-center px-3 font-medium">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={filtered.length < limit}
              className="flex items-center gap-1 rounded-xl border px-3 py-2 hover:bg-gray-50 disabled:opacity-50 transition">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      <BloomModal open={!!viewProduct} onClose={() => setViewProduct(null)} title={viewProduct?.name || ''} subtitle={viewProduct?.sku} size="lg">
        {viewProduct && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoBox label="Price" value={formatEGP(Number(viewProduct.base_price))} />
              <InfoBox label="Cost" value={formatEGP(Number(viewProduct.cost_price))} />
              <InfoBox label="Stock" value={String(viewProduct.total_stock || 0)} />
              <InfoBox label="Category" value={viewProduct.category_name || '—'} />
            </div>
            {viewProduct.description && <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{viewProduct.description}</p>}
            {viewProduct.variants && viewProduct.variants.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Palette className="h-4 w-4 text-purple-500" /> Color Variants</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {viewProduct.variants.map((v: any) => (
                    <div key={v.id} className="flex items-center gap-3 rounded-xl border p-3 bg-white">
                      {v.color_code && <div className="h-8 w-8 rounded-lg border-2 border-white shadow-sm" style={{ backgroundColor: v.color_code }} />}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{v.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{v.sku}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{v.stock || 0} units</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </BloomModal>

      {/* Create/Edit Modal */}
      <BloomModal open={showModal} onClose={() => setShowModal(false)}
        title={editProduct ? 'Edit Product' : 'Add New Product'}
        subtitle={editProduct ? `Editing ${editProduct.name}` : 'Add a new product to your catalog'}
        footer={<><BtnSecondary onClick={() => setShowModal(false)}>Cancel</BtnSecondary><BtnPrimary onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</BtnPrimary></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Name (English)" value={form.name} onChange={(v: string) => setForm({...form, name: v})} placeholder="Product name" />
            <FormField label="Name (Arabic)" value={form.name_ar} onChange={(v: string) => setForm({...form, name_ar: v})} placeholder="اسم المنتج" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="SKU" value={form.sku} onChange={(v: string) => setForm({...form, sku: v})} placeholder="BRS-001" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select value={form.category_id} onChange={(e) => setForm({...form, category_id: e.target.value})}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                <option value="">Select...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Price (EGP)" value={form.base_price} onChange={(v: string) => setForm({...form, base_price: v})} placeholder="250" type="number" />
            <FormField label="Cost (EGP)" value={form.cost_price} onChange={(v: string) => setForm({...form, cost_price: v})} placeholder="120" type="number" />
            <FormField label="Barcode" value={form.barcode} onChange={(v: string) => setForm({...form, barcode: v})} placeholder="6901234567890" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
              rows={3} placeholder="Product description..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
        </div>
      </BloomModal>

      {/* Delete Confirm */}
      <BloomModal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Product" size="sm"
        footer={<><BtnSecondary onClick={() => setDeleteConfirm(null)}>Cancel</BtnSecondary><BtnDanger onClick={handleDelete}>Delete</BtnDanger></>}
      >
        <div className="text-center py-4">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100"><Trash2 className="h-7 w-7 text-red-600" /></div>
          <p className="text-gray-600">Delete <strong>{deleteConfirm?.name}</strong>? This cannot be undone.</p>
        </div>
      </BloomModal>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = 'text' }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
