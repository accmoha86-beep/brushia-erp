'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, X, Package } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  description: string;
  productCount: number;
  color: string;
}

const categories: Category[] = [
  { id: '1', name: 'Makeup', slug: 'makeup', emoji: '💄', description: 'Foundations, powders, palettes, primers, bronzers, blushes & more', productCount: 12, color: 'from-rose-500 to-pink-500' },
  { id: '2', name: 'Lashes', slug: 'lashes', emoji: '👁️', description: 'Mink lashes, faux mink, magnetic lashes & lash accessories', productCount: 4, color: 'from-purple-500 to-violet-500' },
  { id: '3', name: 'Concealer', slug: 'concealer', emoji: '✨', description: 'Full coverage, under eye, color correcting concealers', productCount: 2, color: 'from-amber-500 to-orange-500' },
  { id: '4', name: 'Brushes', slug: 'brushes', emoji: '🖌️', description: 'Professional makeup brushes — foundation, contour, powder, blending', productCount: 4, color: 'from-blue-500 to-cyan-500' },
  { id: '5', name: 'Brush Sets', slug: 'brush-sets', emoji: '🎨', description: 'Curated brush collections for beginners & professionals', productCount: 2, color: 'from-emerald-500 to-teal-500' },
  { id: '6', name: 'Lip Products', slug: 'lip-products', emoji: '💋', description: 'Matte lipsticks, lip glosses, lip liners & lip care', productCount: 4, color: 'from-red-500 to-rose-500' },
];

export default function CategoriesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

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
          <p className="text-sm text-gray-500 mt-1">{categories.length} product categories</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:from-rose-600 hover:to-purple-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
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
        ))}
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
