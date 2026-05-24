'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatEGP, cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { Search, Plus, ChevronLeft, ChevronRight, Package, Edit, Trash2, Eye, X, RefreshCw } from 'lucide-react';

// ── API response types ──────────────────────────────────────────
interface PaginatedResponse<T> {
  data: T[];
  pagination: { total: number; page: number; limit: number };
}

interface ApiProduct {
  id: string;
  sku: string;
  name: string;
  category_id?: string;
  category_name?: string;
  category?: { name: string };
  base_price: number;
  cost_price: number;
  stock?: number;
  quantity_on_hand?: number;
  status: string;
  image?: string;
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
  category: string;
  categoryId: string;
  price: number;
  cost: number;
  stock: number;
  status: string;
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

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories once on mount
  useEffect(() => {
    api.get<ApiCategory[]>('/catalog/categories')
      .then((cats) => setCategories(Array.isArray(cats) ? cats : []))
      .catch(() => setCategories([]));
  }, []);

  // Build a category name map
  const categoryNameMap: Record<string, string> = {};
  categories.forEach((c) => { categoryNameMap[c.id] = c.name; });

  // Fetch products when search/category/page change
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | boolean | undefined> = {
        page,
        limit: ITEMS_PER_PAGE,
      };
      if (search) params.search = search;
      if (categoryFilter !== 'all') params.category_id = categoryFilter;

      const res = await api.get<PaginatedResponse<ApiProduct>>('/catalog/products', params);
      const mapped: Product[] = (res?.data ?? []).map((p) => ({
        id: p.id,
        sku: p.sku || '—',
        name: p.name,
        category: p.category_name || p.category?.name || categoryNameMap[p.category_id ?? ''] || '—',
        categoryId: p.category_id ?? '',
        price: p.base_price ?? 0,
        cost: p.cost_price ?? 0,
        stock: Number(p.total_stock) || p.stock || p.quantity_on_hand || 0,
        status: p.status ?? 'active',
      }));
      setProducts(mapped);
      setTotalProducts(res?.pagination?.total ?? mapped.length);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, page, categoryNameMap]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter, page]);

  const totalPages = Math.max(1, Math.ceil(totalProducts / ITEMS_PER_PAGE));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '…' : `${totalProducts} products in catalog`}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:from-rose-600 hover:to-purple-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setCategoryFilter('all'); setPage(1); }}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              categoryFilter === 'all'
                ? 'bg-rose-500 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setCategoryFilter(cat.id); setPage(1); }}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                categoryFilter === cat.id
                  ? 'bg-rose-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button
            onClick={fetchProducts}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
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
                    <p className="text-xs text-gray-400 mt-1">
                      {search || categoryFilter !== 'all' ? 'Try changing your filters' : 'Add your first product to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
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
                      <span className={cn('font-medium', product.stock <= 10 ? 'text-red-600' : 'text-gray-900')}>
                        {product.stock}
                      </span>
                      {product.stock <= 10 && (
                        <span className="ml-1 text-xs text-red-500">Low</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[product.status] || 'bg-gray-100 text-gray-600'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500" title="Delete">
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
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      'h-8 w-8 rounded-lg text-sm font-medium transition-colors',
                      pageNum === page ? 'bg-rose-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Add New Product</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="e.g. Brushia Matte Foundation" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="BRS-XXX-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500">
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (EGP)</label>
                  <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="350.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost (EGP)</label>
                  <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="180.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="100" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-rose-600 hover:to-purple-700">
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
