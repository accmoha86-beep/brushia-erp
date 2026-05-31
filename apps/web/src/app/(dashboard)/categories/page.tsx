'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { FolderTree, RefreshCw, Plus, X, Package, Trash2, Pencil, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react';

interface Category {
  id: string; name: string; name_ar?: string; slug: string;
  description?: string; parent_id?: string | null; sort_order: number;
  is_active: boolean; children?: Category[]; product_count?: number;
}

const catEmojis: Record<string, string> = {
  'Makeup': '💄', 'Lashes': '👁️', 'Concealer': '✨', 'Brushes': '🖌️',
  'Brush Sets': '🎨', 'Other Makeup': '💋', 'Lip Products': '💋',
  'Skin Care': '🧴', 'Skincare': '🧴', 'Tools': '🧰', 'Eyes': '👁️',
  'Face': '✨', 'Sets': '📦',
};

const catColors: Record<string, string> = {
  'Makeup': 'from-pink-500 to-rose-500', 'Lashes': 'from-purple-500 to-violet-500',
  'Concealer': 'from-amber-400 to-orange-400', 'Brushes': 'from-blue-400 to-sky-500',
  'Brush Sets': 'from-emerald-400 to-teal-500', 'Other Makeup': 'from-fuchsia-500 to-pink-500',
  'Lip Products': 'from-orange-400 to-amber-500', 'Skin Care': 'from-gray-400 to-gray-500',
};

export default function CategoriesPage() {
  const { t, locale, isRTL } = useI18n();
  const [tree, setTree] = useState<Category[]>([]);
  const [flat, setFlat] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: '', name_ar: '', slug: '', description: '', parent_id: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [treeRes, flatRes] = await Promise.all([
        api.get<any>('/catalog/categories/tree').catch(() => []),
        api.get<any>('/catalog/categories').catch(() => ({ data: [] })),
      ]);
      setTree(Array.isArray(treeRes) ? treeRes : treeRes?.data || []);
      const f = Array.isArray(flatRes) ? flatRes : flatRes?.data || [];
      setFlat(f);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditCat(null);
    setForm({ name: '', name_ar: '', slug: '', description: '', parent_id: '' });
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditCat(cat);
    setForm({
      name: cat.name, name_ar: cat.name_ar || '', slug: cat.slug,
      description: cat.description || '', parent_id: cat.parent_id || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-');
      const body = { ...form, slug, parent_id: form.parent_id || null };
      if (editCat) {
        await api.put(`/catalog/categories/${editCat.id}`, body);
      } else {
        await api.post('/catalog/categories', body);
      }
      setShowModal(false); load();
    } catch (e: any) { alert(e.message || 'Failed to save category'); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.delete(`/catalog/categories/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      load();
    } catch (e: any) {
      alert(e.message || 'Failed to delete. Category may have products.');
    }
    setDeleting(false);
  };

  const toggleActive = async (cat: Category) => {
    try {
      await api.put(`/catalog/categories/${cat.id}`, { is_active: !cat.is_active });
      load();
    } catch {}
  };

  const allCats = tree.length > 0 ? tree : flat;

  const renderCat = (cat: Category, depth: number = 0) => {
    const emoji = catEmojis[cat.name] || '📦';
    const gradient = catColors[cat.name] || 'from-gray-500 to-gray-600';
    const count = cat.product_count || 0;

    return (
      <div key={cat.id}>
        <div className={cn(
          'flex items-center justify-between rounded-xl p-4 hover:bg-gray-50 transition group',
          depth > 0 && 'ml-6'
        )} style={{ marginLeft: depth * 24 }}>
          <div className="flex items-center gap-4">
            {/* Color badge */}
            <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl shadow-sm', gradient)}>
              {emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">{cat.name}</p>
                {cat.name_ar && <span className="text-sm text-gray-400 rtl">{cat.name_ar}</span>}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                <span className="font-mono">/{cat.slug}</span>
                <span>{count} product{count !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Active toggle */}
            <button onClick={() => toggleActive(cat)} title={cat.is_active ? 'Deactivate' : 'Activate'}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition">
              {cat.is_active !== false
                ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                : <ToggleLeft className="h-5 w-5 text-gray-400" />}
            </button>
            {/* Status badge */}
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              cat.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
            )}>
              {cat.is_active !== false ? 'Active' : 'Inactive'}
            </span>
            {/* Edit button */}
            <button onClick={() => openEdit(cat)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition">
              <Pencil className="h-4 w-4" />
            </button>
            {/* Delete button */}
            <button onClick={() => setDeleteConfirm(cat)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        {cat.children?.map(child => renderCat(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            {flat.length} categories · Manage your product categories for POS and catalog
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition">
            <RefreshCw className="h-4 w-4 text-gray-600" />
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 transition shadow-sm">
            <Plus className="h-4 w-4" /> Add Category
          </button>
        </div>
      </div>

      {/* Preview: How it looks in POS */}
      <div className="mb-6">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">POS Preview</p>
        <div className="bg-gray-950 rounded-xl p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {allCats.filter(c => c.is_active !== false).map(cat => {
            const gradient = catColors[cat.name] || 'from-gray-500 to-gray-600';
            const emoji = catEmojis[cat.name] || '📦';
            const count = cat.product_count || 0;
            return (
              <div key={cat.id} className={cn(
                'bg-gradient-to-br rounded-xl p-3 min-h-[70px] flex flex-col justify-between relative overflow-hidden',
                gradient
              )}>
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-white/10 rounded-full" />
                <span className="text-lg">{emoji}</span>
                <div>
                  <p className="text-white font-semibold text-xs leading-tight">{cat.name}</p>
                  <p className="text-white/60 text-[10px]">{count} items</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category List */}
      <div className="bg-white rounded-xl border shadow-sm divide-y divide-gray-100">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-4">
              <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          ))
        ) : allCats.length === 0 ? (
          <div className="text-center py-12">
            <FolderTree className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No categories yet</p>
            <button onClick={openCreate} className="mt-3 text-rose-500 text-sm font-medium hover:underline">
              Create your first category
            </button>
          </div>
        ) : (
          allCats.map(c => renderCat(c))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editCat ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
                <input placeholder="e.g. Lip Products" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (Arabic)</label>
                <input placeholder="e.g. منتجات الشفاه" value={form.name_ar}
                  onChange={e => setForm({ ...form, name_ar: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (auto-generated if empty)</label>
                <input placeholder="lip-products" value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                <select value={form.parent_id}
                  onChange={e => setForm({ ...form, parent_id: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500">
                  <option value="">None (Top Level)</option>
                  {flat.filter(c => c.id !== editCat?.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea placeholder="Optional description..." value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex-1 rounded-lg bg-rose-500 py-2.5 text-sm font-medium text-white hover:bg-rose-600 transition">
                {editCat ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Category</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete <span className="font-semibold text-gray-700">{deleteConfirm.name}</span>?
                {(deleteConfirm.product_count || 0) > 0 && (
                  <span className="block text-red-500 mt-1">
                    ⚠️ This category has {deleteConfirm.product_count} products
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
