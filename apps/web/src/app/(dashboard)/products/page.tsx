'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatEGP, cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { exportToCSV, exportToExcelXML } from '@/lib/export-data';
import { Search, Plus, ChevronLeft, ChevronRight, Package, Edit, Trash2, Eye, X, RefreshCw, Save, AlertTriangle, Check, Tag, DollarSign, Archive , Download } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────
interface PaginatedResponse<T> {
  data: T[];
  pagination: { total: number; page: number; limit: number };
}

interface ApiProduct {
  id: string;
  sku: string;
  name: string;
  name_ar?: string;
  description?: string;
  category_id?: string;
  category_name?: string;
  category?: { name: string };
  base_price: number;
  cost_price: number;
  stock?: number;
  total_stock?: number;
  quantity_on_hand?: number;
  status: string;
  image?: string;
  barcode?: string;
  created_at?: string;
  updated_at?: string;
  variants?: Array<{
    id: string;
    name: string;
    sku: string;
    color_code?: string;
    cost_override?: number;
    price_override?: number;
    stock?: number;
  }>;
}

interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  product_count?: number;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  name_ar?: string;
  description?: string;
  category: string;
  categoryId: string;
  price: number;
  cost: number;
  stock: number;
  status: string;
  barcode?: string;
  created_at?: string;
  variants?: Array<{
    id: string;
    name: string;
    sku: string;
    color_code?: string;
    cost_override?: number;
    price_override?: number;
    stock?: number;
  }>;
}

function getToken() {
  try {
    const raw = localStorage.getItem('brushia-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.accessToken || null;
    }
    return localStorage.getItem('accessToken') || localStorage.getItem('token') || null;
  } catch { return null; }
}

async function apiCall(method: string, path: string, body?: Record<string, unknown>) {
  const token = getToken();
  const opts: RequestInit = {
    method,
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`/api/v1${path}`, opts);
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `API ${res.status}`);
  }
  return res.json();
}

const ITEMS_PER_PAGE = 10;
const statusStyles: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-600',
  draft: 'bg-yellow-100 text-yellow-700',
};

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

// ── View Detail Modal ─────────────────────────────────────────
function ViewProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-purple-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{product.name}</h2>
                {product.name_ar && <p className="text-sm text-rose-100">{product.name_ar}</p>}
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/20 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-100">
          <div className="text-center p-3 rounded-xl bg-rose-50">
            <DollarSign className="h-5 w-5 text-rose-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Sell Price</p>
            <p className="text-lg font-bold text-gray-900">{formatEGP(product.price)}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-purple-50">
            <Tag className="h-5 w-5 text-purple-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Cost Price</p>
            <p className="text-lg font-bold text-gray-900">{formatEGP(product.cost)}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-blue-50">
            <Archive className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Stock</p>
            <p className={cn("text-lg font-bold", product.stock <= 10 ? "text-red-600" : "text-gray-900")}>{product.stock}</p>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">SKU</p>
              <p className="text-sm font-mono text-gray-700 mt-0.5">{product.sku}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Category</p>
              <p className="text-sm text-gray-700 mt-0.5">{product.category}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Status</p>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium mt-0.5 ${statusStyles[product.status] || 'bg-gray-100 text-gray-600'}`}>{product.status}</span>
            </div>
            {product.barcode && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase">Barcode</p>
                <p className="text-sm font-mono text-gray-700 mt-0.5">{product.barcode}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Margin</p>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">
                {product.cost > 0 ? `${(((product.price - product.cost) / product.price) * 100).toFixed(1)}%` : '—'}
              </p>
            </div>
            {product.created_at && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase">Added</p>
                <p className="text-sm text-gray-700 mt-0.5">{new Date(product.created_at).toLocaleDateString('en-EG')}</p>
              </div>
            )}
          </div>

          {product.description && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-400 uppercase">Description</p>
              <p className="text-sm text-gray-600 mt-1">{product.description}</p>
            </div>
          )}

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-400 uppercase mb-2">Variants ({product.variants.length})</p>
              <div className="space-y-2">
                {product.variants.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2">
                      {v.color_code && <div className="h-5 w-5 rounded-full border border-gray-200" style={{ backgroundColor: v.color_code }} />}
                      <span className="text-sm font-medium text-gray-800">{v.name}</span>
                      <span className="text-xs font-mono text-gray-400">{v.sku}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {v.price_override ? formatEGP(Number(v.price_override)) : '—'} · Stock: {v.stock ?? '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Edit / Add Product Modal ──────────────────────────────────
function ProductFormModal({ product, categories, onClose, onSaved }: { 
  product: Product | null; 
  categories: ApiCategory[]; 
  onClose: () => void; 
  onSaved: () => void;
}) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name || '',
    name_ar: product?.name_ar || '',
    sku: product?.sku || '',
    category_id: product?.categoryId || (categories[0]?.id ?? ''),
    base_price: product ? String(product.price) : '',
    cost_price: product ? String(product.cost) : '',
    description: product?.description || '',
    status: product?.status || 'active',
    barcode: product?.barcode || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Product name is required'); return; }
    if (!form.sku.trim()) { setError('SKU is required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        category_id: form.category_id || null,
        base_price: Number(form.base_price) || 0,
        cost_price: Number(form.cost_price) || 0,
        status: form.status,
      };
      if (form.name_ar) payload.name_ar = form.name_ar;
      if (form.description) payload.description = form.description;
      if (form.barcode) payload.barcode = form.barcode;

      if (isEdit) {
        await apiCall('PUT', `/catalog/products/${product!.id}`, payload);
      } else {
        await apiCall('POST', '/catalog/products', payload);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? '✏️ Edit Product' : '➕ Add New Product'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              placeholder="e.g. Brushia Matte Foundation" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Arabic Name</label>
            <input type="text" dir="rtl" value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              placeholder="الاسم بالعربي" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
              <input type="text" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="BRS-XXX-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500">
                <option value="">— No Category —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (EGP)</label>
              <input type="number" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="350.00" min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost (EGP)</label>
              <input type="number" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="180.00" min="0" step="0.01" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
              <input type="text" value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="6221234567890" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
              placeholder="Product description..." />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:from-rose-600 hover:to-purple-700 disabled:opacity-50">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirmation Modal ─────────────────────────────────
function DeleteConfirmModal({ product, onClose, onDeleted }: { product: Product; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await apiCall('DELETE', `/catalog/products/${product.id}`);
      onDeleted();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-7 w-7 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Delete Product?</h3>
          <p className="mt-2 text-sm text-gray-500">
            Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be undone.
          </p>
          {error && <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleDelete} disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
            {deleting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Modal state
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<ApiCategory[]>('/catalog/categories')
      .then(cats => setCategories(Array.isArray(cats) ? cats : []))
      .catch(() => setCategories([]));
  }, []);

  const categoryNameMap: Record<string, string> = {};
  categories.forEach(c => { categoryNameMap[c.id] = c.name; });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | boolean | undefined> = { page, limit: ITEMS_PER_PAGE };
      if (search) params.search = search;
      if (categoryFilter !== 'all') params.category_id = categoryFilter;
      const res = await api.get<PaginatedResponse<ApiProduct>>('/catalog/products', params);
      const mapped: Product[] = (res?.data ?? []).map(p => ({
        id: p.id,
        sku: p.sku || '—',
        name: p.name,
        name_ar: p.name_ar,
        description: p.description,
        category: p.category_name || p.category?.name || categoryNameMap[p.category_id ?? ''] || '—',
        categoryId: p.category_id ?? '',
        price: Number(p.base_price) || 0,
        cost: Number(p.cost_price) || 0,
        stock: Number(p.total_stock) || Number(p.stock) || Number(p.quantity_on_hand) || 0,
        status: p.status ?? 'active',
        barcode: p.barcode,
        created_at: p.created_at,
        variants: p.variants,
      }));
      setProducts(mapped);
      setTotalProducts(res?.pagination?.total ?? mapped.length);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const totalPages = Math.max(1, Math.ceil(totalProducts / ITEMS_PER_PAGE));

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-[60] flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-white shadow-lg animate-in slide-in-from-top-2">
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? '…' : `${totalProducts} products in catalog`}</p>
        </div>
        <div className="flex gap-2">
              <button onClick={() => exportToCSV(products.map((p: any) => ({ Name: p.name, SKU: p.sku, Price: Number(p.base_price)/100, 'Cost Price': Number(p.cost_price||0)/100, Status: p.status || 'active' })), 'brushia_products')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition">
                <Download className="w-4 h-4" /> CSV
              </button>
              <button onClick={() => exportToExcelXML(products.map((p: any) => ({ Name: p.name, SKU: p.sku, Price: Number(p.base_price)/100, 'Cost Price': Number(p.cost_price||0)/100, Status: p.status || 'active' })), 'brushia_products', 'Products')}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition">
                <Download className="w-4 h-4" /> Excel
              </button>
            </div>
            <button onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:from-rose-600 hover:to-purple-700 transition-all">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search by name or SKU..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setCategoryFilter('all'); setPage(1); }}
            className={cn('rounded-lg px-3 py-2 text-sm font-medium transition-colors', categoryFilter === 'all' ? 'bg-rose-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50')}>All</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => { setCategoryFilter(cat.id); setPage(1); }}
              className={cn('rounded-lg px-3 py-2 text-sm font-medium transition-colors', categoryFilter === cat.id ? 'bg-rose-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50')}>{cat.name}</button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button onClick={fetchProducts} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Category</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Price</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Cost</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Stock</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-lg" /><Skeleton className="h-4 w-40" /></div></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-10 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-14 mx-auto rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500">No products found</p>
                    <p className="text-xs text-gray-400 mt-1">{search || categoryFilter !== 'all' ? 'Try changing your filters' : 'Add your first product to get started'}</p>
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setViewProduct(product)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-rose-100 to-purple-100">
                          <Package className="h-5 w-5 text-rose-500" />
                        </div>
                        <span className="font-medium text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{product.sku}</td>
                    <td className="px-6 py-4 text-gray-600">{product.category}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">{formatEGP(product.price)}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{formatEGP(product.cost)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn('font-medium', product.stock <= 10 ? 'text-red-600' : 'text-gray-900')}>{product.stock}</span>
                      {product.stock <= 10 && <span className="ml-1 text-xs text-red-500">Low</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[product.status] || 'bg-gray-100 text-gray-600'}`}>{product.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setViewProduct(product)} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditProduct(product)} className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteProduct(product)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && products.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, totalProducts)} of {totalProducts} products
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)}
                    className={cn('h-8 w-8 rounded-lg text-sm font-medium transition-colors', pageNum === page ? 'bg-rose-500 text-white' : 'text-gray-600 hover:bg-gray-100')}>{pageNum}</button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {viewProduct && <ViewProductModal product={viewProduct} onClose={() => setViewProduct(null)} />}
      {(showAddModal || editProduct) && (
        <ProductFormModal
          product={editProduct}
          categories={categories}
          onClose={() => { setShowAddModal(false); setEditProduct(null); }}
          onSaved={() => { fetchProducts(); showSuccess(editProduct ? 'Product updated!' : 'Product added!'); }}
        />
      )}
      {deleteProduct && (
        <DeleteConfirmModal
          product={deleteProduct}
          onClose={() => setDeleteProduct(null)}
          onDeleted={() => { fetchProducts(); showSuccess('Product deleted!'); }}
        />
      )}
    </div>
  );
}
