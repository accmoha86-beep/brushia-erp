'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { FolderTree, RefreshCw, Plus, X, Package } from 'lucide-react';

interface Category { id: string; name: string; name_ar?: string; slug: string; description?: string; parent_id?: string; sort_order: number; is_active: boolean; children?: Category[]; product_count?: number; }

const catEmojis: Record<string, string> = { 'Makeup': '\U0001f484', 'Lashes': '\U0001f441\ufe0f', 'Concealer': '\u2728', 'Brushes': '\U0001f58c\ufe0f', 'Brush Sets': '\U0001f3a8', 'Other Makeup': '\U0001f48b' };

export default function CategoriesPage() {
  const [tree, setTree] = useState<Category[]>([]);
  const [flat, setFlat] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', name_ar: '', slug: '', description: '' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [treeRes, flatRes] = await Promise.all([
        api.get<any>('/catalog/categories/tree').catch(() => []),
        api.get<any>('/catalog/categories').catch(() => ({ data: [] })),
      ]);
      setTree(Array.isArray(treeRes) ? treeRes : treeRes?.data || []);
      setFlat(flatRes?.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCreate = async () => {
    try {
      const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-');
      await api.post('/catalog/categories', { ...form, slug });
      setShowCreate(false); fetch();
    } catch (e: any) { alert(e.message); }
  };

  const renderCat = (cat: Category, depth: number = 0) => (
    <div key={cat.id}>
      <div className={cn('flex items-center justify-between rounded-lg p-3 hover:bg-gray-50', depth > 0 && 'ml-6')} style={{ marginLeft: depth * 24 }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{catEmojis[cat.name] || '\U0001f4e6'}</span>
          <div>
            <p className="font-medium text-gray-900">{cat.name}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>/{cat.slug}</span>
              {cat.name_ar && <span className="rtl">{cat.name_ar}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{cat.product_count || 0} products</span>
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', cat.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600')}>{cat.is_active !== false ? 'active' : 'inactive'}</span>
        </div>
      </div>
      {cat.children?.map(child => renderCat(child, depth + 1))}
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Categories</h1><p className="text-sm text-gray-500 mt-1">{flat.length} categories in tree</p></div>
        <div className="flex gap-2">
          <button onClick={fetch} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"><Plus className="h-4 w-4" />Add Category</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border divide-y divide-gray-100">
        {loading ? Array.from({length:6}).map((_,i) => <div key={i} className="px-4 py-3"><div className="h-8 bg-gray-100 rounded animate-pulse" /></div>)
        : tree.length > 0 ? tree.map(c => renderCat(c))
        : flat.map(c => renderCat(c))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex justify-between mb-4"><h3 className="text-lg font-semibold">New Category</h3><button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-gray-400" /></button></div>
          <div className="space-y-3">
            <input placeholder="Name (English)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="Name (Arabic)" value={form.name_ar} onChange={e => setForm({...form, name_ar: e.target.value})} className="w-full rounded-lg border px-3 py-2 text-sm" dir="rtl" />
            <input placeholder="Slug (auto-generated)" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="w-full rounded-lg border px-3 py-2 text-sm font-mono" />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} />
          </div>
          <button onClick={handleCreate} className="mt-4 w-full rounded-lg bg-rose-500 py-2.5 text-sm font-medium text-white hover:bg-rose-600">Create Category</button>
        </div></div>
      )}
    </div>
  );
}
