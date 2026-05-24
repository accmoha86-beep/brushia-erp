'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Plus, X, Calendar, Percent, CircleDollarSign, Copy, Tag, Search, Edit2, Trash2, Check, Clock, Ban, Zap, Gift, BarChart3 } from 'lucide-react';

interface Promotion { id: string; name: string; type: string; value: number; code: string; status: string; start_date: string; end_date: string; usage_count: number; usage_limit: number | null; min_order_amount: number; description?: string; applies_to?: string; }

const fmtEGP = (v: number) => `EGP ${(v / 100).toLocaleString('en-EG', { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  active: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: Check, label: 'Active' },
  scheduled: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: Clock, label: 'Scheduled' },
  expired: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: Ban, label: 'Expired' },
  inactive: { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600', icon: Ban, label: 'Inactive' },
};

const emptyForm = { name: '', type: 'percentage', value: '', code: '', start_date: '', end_date: '', usage_limit: '', min_order_amount: '', description: '' };

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [copied, setCopied] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get<any>('/promotions'); setPromotions(res?.data || []); } catch { setPromotions([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, value: +form.value, min_order_amount: +(form.min_order_amount || 0), usage_limit: form.usage_limit ? +form.usage_limit : null };
      if (editId) { await api.put(`/promotions/${editId}`, payload); }
      else { await api.post('/promotions', payload); }
      setShowModal(false); setEditId(null); setForm(emptyForm); fetchPromotions();
    } catch (e: any) { alert(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleEdit = (p: Promotion) => {
    setEditId(p.id);
    setForm({ name: p.name, type: p.type, value: String(p.value), code: p.code, start_date: p.start_date?.slice(0, 10) || '', end_date: p.end_date?.slice(0, 10) || '', usage_limit: p.usage_limit ? String(p.usage_limit) : '', min_order_amount: p.min_order_amount ? String(p.min_order_amount) : '', description: p.description || '' });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try { await api.delete(`/promotions/${id}`); setDeleteConfirm(null); fetchPromotions(); } catch { alert('Failed to deactivate'); }
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(''), 2000); };

  const filtered = promotions.filter(p => {
    if (search && !`${p.name} ${p.code}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: promotions.length,
    active: promotions.filter(p => p.status === 'active').length,
    totalUsage: promotions.reduce((s, p) => s + (p.usage_count || 0), 0),
    avgDiscount: promotions.filter(p => p.type === 'percentage').length > 0 ? Math.round(promotions.filter(p => p.type === 'percentage').reduce((s, p) => s + p.value, 0) / promotions.filter(p => p.type === 'percentage').length) : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-sm text-gray-500">Manage discount codes and campaigns</p>
        </div>
        <button onClick={() => { setEditId(null); setForm(emptyForm); setShowModal(true); }} className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 shadow-sm">
          <Plus className="h-4 w-4" /> New Promotion
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Promotions', value: stats.total, icon: Tag, color: 'rose', bg: 'bg-rose-50' },
          { label: 'Active Now', value: stats.active, icon: Zap, color: 'emerald', bg: 'bg-emerald-50' },
          { label: 'Total Redemptions', value: stats.totalUsage.toLocaleString(), icon: Gift, color: 'purple', bg: 'bg-purple-50' },
          { label: 'Avg. Discount', value: `${stats.avgDiscount}%`, icon: BarChart3, color: 'blue', bg: 'bg-blue-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={cn('rounded-lg p-2.5', bg)}><Icon className={cn('h-5 w-5', `text-${color}-600`)} /></div>
              <div><p className="text-sm text-gray-500">{label}</p><p className="text-2xl font-bold text-gray-900">{value}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or code..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border py-2 pl-10 pr-4 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
        </div>
        <div className="flex gap-1 rounded-lg border bg-white p-1">
          {['all', 'active', 'scheduled', 'expired', 'inactive'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={cn('rounded-md px-3 py-1.5 text-xs font-medium transition-colors capitalize', filterStatus === s ? 'bg-rose-500 text-white' : 'text-gray-600 hover:bg-gray-100')}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Promotions Grid */}
      <div className="grid gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
            <Tag className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-gray-500 font-medium">{search || filterStatus !== 'all' ? 'No promotions match your filters' : 'No promotions yet'}</p>
            <p className="text-sm text-gray-400 mt-1">Create your first promotion to boost sales!</p>
          </div>
        ) : (
          filtered.map(p => {
            const sc = statusConfig[p.status] || statusConfig.inactive;
            const Icon = sc.icon;
            const usagePct = p.usage_limit ? Math.round((p.usage_count || 0) / p.usage_limit * 100) : null;
            return (
              <div key={p.id} className="group rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={cn('flex h-14 w-14 items-center justify-center rounded-xl shrink-0', p.type === 'percentage' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500')}>
                      {p.type === 'percentage' ? <Percent className="h-6 w-6 text-white" /> : <CircleDollarSign className="h-6 w-6 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-lg">{p.name}</h3>
                        <span className={cn('flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border', sc.bg, sc.text)}>
                          <Icon className="h-3 w-3" /> {sc.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                        <button onClick={() => copyCode(p.code)} className="flex items-center gap-1.5 font-mono bg-gray-100 px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors text-gray-700">
                          {p.code} {copied === p.code ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <span className="font-semibold text-gray-900">
                          {p.type === 'percentage' ? `${p.value}% off` : `${fmtEGP(p.value)} off`}
                        </span>
                        {p.min_order_amount > 0 && <span>Min: {fmtEGP(p.min_order_amount)}</span>}
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{fmtDate(p.start_date)} → {fmtDate(p.end_date)}</span>
                      </div>
                      {p.description && <p className="mt-1.5 text-sm text-gray-400">{p.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100" title="Edit"><Edit2 className="h-4 w-4 text-gray-500" /></button>
                      <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 rounded-lg hover:bg-red-50" title="Deactivate"><Trash2 className="h-4 w-4 text-red-500" /></button>
                    </div>
                    <div className="text-right ml-4 min-w-[80px]">
                      <p className="text-2xl font-bold text-gray-900">{(p.usage_count || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{p.usage_limit ? `/ ${p.usage_limit.toLocaleString()}` : 'unlimited'} uses</p>
                      {usagePct !== null && (
                        <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all', usagePct > 90 ? 'bg-red-500' : usagePct > 60 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${Math.min(usagePct, 100)}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex justify-between mb-5">
              <h3 className="text-lg font-semibold">{editId ? 'Edit Promotion' : 'Create Promotion'}</h3>
              <button onClick={() => { setShowModal(false); setEditId(null); }}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Summer Sale 2026" className="w-full rounded-lg border px-3 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (EGP)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{form.type === 'percentage' ? 'Discount %' : 'Amount (piasters)'}</label>
                  <input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder={form.type === 'percentage' ? '20' : '5000'} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g., SUMMER20" className="w-full rounded-lg border px-3 py-2.5 text-sm font-mono focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                  <input type="number" value={form.usage_limit} onChange={e => setForm({ ...form, usage_limit: e.target.value })} placeholder="Leave empty for unlimited" className="w-full rounded-lg border px-3 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (piasters)</label>
                  <input type="number" value={form.min_order_amount} onChange={e => setForm({ ...form, min_order_amount: e.target.value })} placeholder="e.g., 20000" className="w-full rounded-lg border px-3 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Optional description..." className="w-full rounded-lg border px-3 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => { setShowModal(false); setEditId(null); }} className="rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.code || !form.value} className="rounded-lg bg-rose-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50">
                {saving ? 'Saving...' : editId ? 'Update Promotion' : 'Create Promotion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Deactivate Promotion?</h3>
              <p className="mt-2 text-sm text-gray-500">This will deactivate the promotion. Customers won't be able to use the code anymore.</p>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700">Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
