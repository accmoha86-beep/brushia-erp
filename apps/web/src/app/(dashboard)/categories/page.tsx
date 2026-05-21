'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { Plus, Edit, Trash2, X, Package, RefreshCw, FolderOpen } from 'lucide-react';

// ── API response types ──────────────────────────────────────────
interface ApiCategory {
  id: string;
  name: string;
  name_ar?: string;
  slug: string;
  sort_order?: number;
  product_count?: number;
  child_count?: number;
  description?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  description: string;
  productCount: number;
  color: string;
}

const gradientColors = [
  'from-rose-500 to-pink-500',
  'from-purple-500 to-violet-500',
  'from-amber-500 to-orange-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-red-500 to-rose-500',
  'from-indigo-500 to-blue-500',
  'from-pink-500 to-fuchsia-500',
  'from-teal-500 to-green-500',
  'from-orange-500 to-yellow-500',
];

const categoryEmojis: Record<string, string> = {
  makeup: '💄',
  lashes: '👁️',
  concealer: '✨',
  brushes: '🖌️',
  'brush-sets': '🎨',
  'lip-products': '💋',
  skincare: '🧴',
  tools: '🛠️',
  fragrance: '🌸',
  accessories: '💍',
};

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<ApiCategory[]>('/catalog/categories');
      const cats = Array.isArray(data) ? data : [];
      const mapped: Category[] = cats.map((cat, idx) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
        emoji: categoryEmojis[cat.slug?.toLowerCase() ?? ''] || '📦',
        description: cat.description || `${cat.name} products`,
        productCount: cat.product_count ?? 0,
        color: gradientColors[idx % gradientColors.length],
      }));
      setCategories(mapped);
    } catch (err) {
      setError('Failed to load categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setShowModal(true);
  };

  const openAdd = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '…' : `${categories.length} product categories`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:from-rose-600 hover:to-purple-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button
            onClick={fetchCategories}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {/* Category grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <Skeleton className="h-2 w-full rounded-none" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="pt-4 border-t border-gray-100">
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          ))
        ) : categories.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
            <FolderOpen className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm font-medium">No categories yet</p>
            <p className="text-xs mt-1">Create your first category to organize products</p>
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="group rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              {/* Gradient header */}
              <div className={`h-2 bg-gradient-to-r ${cat.color}`} />
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{cat.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                      <p className="text-xs text-gray-400 font-mono">{cat.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(cat)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3 line-clamp-2">{cat.description}</p>
                <div className="mt-4 flex items-center gap-2 pt-4 border-t border-gray-100">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{cat.productCount} products</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  defaultValue={editingCategory?.name}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  placeholder="Category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emoji Icon</label>
                <input
                  type="text"
                  defaultValue={editingCategory?.emoji}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  placeholder="💄"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  defaultValue={editingCategory?.description}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  placeholder="Describe this category..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => setShowModal(false)} className="rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-rose-600 hover:to-purple-700">
                {editingCategory ? 'Save Changes' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
