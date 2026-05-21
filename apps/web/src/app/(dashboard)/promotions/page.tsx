'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { formatEGP, formatDate, cn } from '@/lib/utils';
import { Plus, X, Calendar, Percent, CircleDollarSign, Copy, RefreshCw, Tag } from 'lucide-react';

interface Promotion { id: string; name: string; type: string; value: number; code: string; status: string; start_date: string; end_date: string; usage_count: number; usage_limit: number | null; min_order_amount: number; description?: string; }

const statusColors: Record<string, string> = { active: 'bg-emerald-100 text-emerald-700', inactive: 'bg-gray-100 text-gray-600', expired: 'bg-red-100 text-red-700', scheduled: 'bg-blue-100 text-blue-700' };

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'percentage', value: '', code: '', start_date: '', end_date: '', usage_limit: '', min_order_amount: '' });

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get<any>('/promotions'); setPromotions(res?.data || []); } catch { setPromotions([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  const handleCreate = async () => {
    try {
      await api.post('/promotions', { ...form, value: +form.value, min_order_amount: +(form.min_order_amount || 0), usage_limit: form.usage_limit ? +form.usage_limit : null });
      setShowCreate(false); fetchPromotions();
    } catch (e: any) { alert(e.message); }
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Promotions</h1><p className="text-sm text-gray-500 mt-1">Manage discount codes and campaigns</p></div>
        <div className="flex gap-2">
          <button onClick={fetchPromotions} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"><Plus className="h-4 w-4" />New Promotion</button>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? Array.from({length:3}).map((_,i) => <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />)
        : promotions.length === 0 ? <div className="text-center py-12 text-gray-400"><Tag className="h-10 w-10 mx-auto mb-2 opacity-50" /><p>No promotions yet</p></div>
        : promotions.map(p => (
          <div key={p.id} className="rounded-xl border bg-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', p.type === 'percentage' ? 'bg-purple-100' : 'bg-emerald-100')}>
                {p.type === 'percentage' ? <Percent className="h-5 w-5 text-purple-600" /> : <CircleDollarSign className="h-5 w-5 text-emerald-600" />}
              </div>
              <div>
                <div className="flex items-center gap-2"><h3 className="font-semibold text-gray-900">{p.name}</h3><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[p.status])}>{p.status}</span></div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded cursor-pointer hover:bg-gray-200 flex items-center gap-1" onClick={() => copyCode(p.code)}>{p.code}<Copy className="h-3 w-3" /></span>
                  <span>{p.type === 'percentage' ? `${p.value}% off` : `${formatEGP(p.value)} off`}</span>
                  {p.min_order_amount > 0 && <span>Min: {formatEGP(p.min_order_amount)}</span>}
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(p.start_date)} → {formatDate(p.end_date)}</span>
                </div>
              </div>
            </div>
            <div className="text-right"><p className="text-lg font-bold text-gray-900">{p.usage_count}</p><p className="text-xs text-gray-500">{p.usage_limit ? `/ ${p.usage_limit}` : 'unlimited'} uses</p></div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex justify-between mb-4"><h3 className="text-lg font-semibold">New Promotion</h3><button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-gray-400" /></button></div>
          <div className="space-y-3">
            <input placeholder="Promotion Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full rounded-lg border px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="rounded-lg border px-3 py-2 text-sm"><option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option></select>
              <input placeholder={form.type === 'percentage' ? 'Discount %' : 'Amount (piasters)'} type="number" value={form.value} onChange={e => setForm({...form, value: e.target.value})} className="rounded-lg border px-3 py-2 text-sm" />
            </div>
            <input placeholder="Promo Code (e.g., SUMMER20)" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="w-full rounded-lg border px-3 py-2 text-sm font-mono" />
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="rounded-lg border px-3 py-2 text-sm" />
              <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Usage Limit" type="number" value={form.usage_limit} onChange={e => setForm({...form, usage_limit: e.target.value})} className="rounded-lg border px-3 py-2 text-sm" />
              <input placeholder="Min Order (piasters)" type="number" value={form.min_order_amount} onChange={e => setForm({...form, min_order_amount: e.target.value})} className="rounded-lg border px-3 py-2 text-sm" />
            </div>
          </div>
          <button onClick={handleCreate} className="mt-4 w-full rounded-lg bg-rose-500 py-2.5 text-sm font-medium text-white hover:bg-rose-600">Create Promotion</button>
        </div></div>
      )}
    </div>
  );
}
