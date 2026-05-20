'use client';

import { useState, useMemo } from 'react';
import { formatEGP, cn } from '@/lib/utils';
import { Search, Plus, Filter, ChevronLeft, ChevronRight, Package, Edit, Trash2, Eye, X } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  status: 'active' | 'inactive' | 'draft';
  image?: string;
}

const products: Product[] = [
  { id: '1', sku: 'BRS-FND-001', name: 'Brushia Matte Foundation - Light', category: 'Makeup', price: 35000, cost: 18000, stock: 145, status: 'active' },
  { id: '2', sku: 'BRS-FND-002', name: 'Brushia Matte Foundation - Medium', category: 'Makeup', price: 35000, cost: 18000, stock: 132, status: 'active' },
  { id: '3', sku: 'BRS-FND-003', name: 'Brushia Matte Foundation - Dark', category: 'Makeup', price: 35000, cost: 18000, stock: 89, status: 'active' },
  { id: '4', sku: 'BRS-CON-001', name: 'Brushia Full Coverage Concealer', category: 'Concealer', price: 25000, cost: 12000, stock: 210, status: 'active' },
  { id: '5', sku: 'BRS-CON-002', name: 'Brushia Under Eye Concealer', category: 'Concealer', price: 22000, cost: 10000, stock: 178, status: 'active' },
  { id: '6', sku: 'BRS-PWD-001', name: 'Brushia Setting Powder - Translucent', category: 'Makeup', price: 28000, cost: 14000, stock: 5, status: 'active' },
  { id: '7', sku: 'BRS-LSH-001', name: 'Mink Lashes - Natural', category: 'Lashes', price: 15000, cost: 5000, stock: 320, status: 'active' },
  { id: '8', sku: 'BRS-LSH-002', name: 'Mink Lashes - Dramatic', category: 'Lashes', price: 18000, cost: 6000, stock: 3, status: 'active' },
  { id: '9', sku: 'BRS-LSH-003', name: 'Faux Mink Lashes - Everyday', category: 'Lashes', price: 12000, cost: 4000, stock: 245, status: 'active' },
  { id: '10', sku: 'BRS-LSH-004', name: 'Magnetic Lashes - Glamour', category: 'Lashes', price: 22000, cost: 8000, stock: 67, status: 'active' },
  { id: '11', sku: 'BRS-BRU-001', name: 'Pro Foundation Brush', category: 'Brushes', price: 12000, cost: 5000, stock: 89, status: 'active' },
  { id: '12', sku: 'BRS-BRU-002', name: 'Pro Contour Brush', category: 'Brushes', price: 10000, cost: 4500, stock: 4, status: 'active' },
  { id: '13', sku: 'BRS-BRU-003', name: 'Pro Powder Brush', category: 'Brushes', price: 11000, cost: 4800, stock: 52, status: 'active' },
  { id: '14', sku: 'BRS-BRU-004', name: 'Pro Blending Brush', category: 'Brushes', price: 9500, cost: 4000, stock: 78, status: 'active' },
  { id: '15', sku: 'BRS-SET-001', name: 'Essential Brush Set (8pc)', category: 'Brush Sets', price: 45000, cost: 22000, stock: 34, status: 'active' },
  { id: '16', sku: 'BRS-SET-002', name: 'Pro Brush Set (12pc)', category: 'Brush Sets', price: 75000, cost: 35000, stock: 22, status: 'active' },
  { id: '17', sku: 'BRS-LIP-001', name: 'Matte Lipstick - Ruby Red', category: 'Lip Products', price: 19000, cost: 7500, stock: 156, status: 'active' },
  { id: '18', sku: 'BRS-LIP-002', name: 'Matte Lipstick - Nude Pink', category: 'Lip Products', price: 19000, cost: 7500, stock: 134, status: 'active' },
  { id: '19', sku: 'BRS-LIP-003', name: 'Lip Gloss - Clear Shine', category: 'Lip Products', price: 15000, cost: 5500, stock: 8, status: 'active' },
  { id: '20', sku: 'BRS-LIP-004', name: 'Lip Liner - Deep Rose', category: 'Lip Products', price: 12000, cost: 4000, stock: 198, status: 'active' },
  { id: '21', sku: 'BRS-EYE-001', name: 'Brushia Eyeshadow Palette - Desert Rose', category: 'Makeup', price: 42000, cost: 20000, stock: 45, status: 'active' },
  { id: '22', sku: 'BRS-EYE-002', name: 'Brushia Mascara - Volume Max', category: 'Makeup', price: 18000, cost: 7000, stock: 167, status: 'active' },
  { id: '23', sku: 'BRS-EYE-003', name: 'Brushia Eyeliner - Jet Black', category: 'Makeup', price: 14000, cost: 5500, stock: 203, status: 'active' },
  { id: '24', sku: 'BRS-SKN-001', name: 'Brushia Makeup Remover - Micellar', category: 'Makeup', price: 16000, cost: 6000, stock: 92, status: 'active' },
];

const categories = ['All', 'Makeup', 'Concealer', 'Lashes', 'Brushes', 'Brush Sets', 'Lip Products'];

const ITEMS_PER_PAGE = 10;

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-600',
  draft: 'bg-yellow-100 text-yellow-700',
};

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [search, categoryFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} products in catalog</p>
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
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategoryFilter(cat); setPage(1); }}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                categoryFilter === cat
                  ? 'bg-rose-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

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
              {paginated.map((product) => (
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
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[product.status]}`}>
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} products
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'h-8 w-8 rounded-lg text-sm font-medium transition-colors',
                  p === page ? 'bg-rose-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
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
                    {categories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
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
