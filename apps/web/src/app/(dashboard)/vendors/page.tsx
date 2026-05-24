'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { cn, formatDate } from '@/lib/utils';
import { Search, Plus, RefreshCw, Globe, Phone, Mail, X, Building2, Clock, MapPin } from 'lucide-react';

interface Vendor { id: string; name: string; contact_person: string; email: string; phone: string; country: string; city: string; payment_terms: string; lead_time_days: number; status: string; created_at: string; }

const statusColors: Record<string, string> = { active: 'bg-emerald-100 text-emerald-700', inactive: 'bg-gray-100 text-gray-600', suspended: 'bg-red-100 text-red-700' };
const countryFlags: Record<string, string> = { CN: '\U0001f1e8\U0001f1f3', EG: '\U0001f1ea\U0001f1ec' };

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '', country: 'CN', city: '', payment_terms: 'net_30', lead_time_days: 21 });

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get<any>('/purchasing/vendors'); setVendors(Array.isArray(res) ? res : (res?.data || [])); } catch { setVendors([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const handleCreate = async () => {
    try { await api.post('/purchasing/vendors', form); setShowCreate(false); fetchVendors(); } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Vendors</h1><p className="text-sm text-gray-500 mt-1">Manage suppliers from China & Egypt</p></div>
        <div className="flex gap-2">
          <button onClick={fetchVendors} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"><Plus className="h-4 w-4" />Add Vendor</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({length:3}).map((_,i) => <div key={i} className="h-48 rounded-xl bg-gray-100 animate-pulse" />)
        : vendors.length === 0 ? <div className="col-span-full text-center py-12 text-gray-400"><Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />No vendors yet</div>
        : vendors.map(v => (
          <div key={v.id} className="rounded-xl border bg-white p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{countryFlags[v.country] || '\U0001f30d'}</span>
                <div><h3 className="font-semibold text-gray-900">{v.name}</h3><p className="text-xs text-gray-400">{v.contact_person}</p></div>
              </div>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[v.status])}>{v.status}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-500"><MapPin className="h-3.5 w-3.5" />{v.city}, {v.country}</div>
              {v.email && <div className="flex items-center gap-2 text-gray-500"><Mail className="h-3.5 w-3.5" />{v.email}</div>}
              {v.phone && <div className="flex items-center gap-2 text-gray-500"><Phone className="h-3.5 w-3.5" />{v.phone}</div>}
              <div className="flex items-center gap-4 pt-2 border-t border-gray-100 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{v.lead_time_days} days lead time</span>
                <span>{v.payment_terms?.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex justify-between mb-4"><h3 className="text-lg font-semibold">New Vendor</h3><button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-gray-400" /></button></div>
          <div className="space-y-3">
            <input placeholder="Vendor Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="Contact Person" value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} className="w-full rounded-lg border px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="rounded-lg border px-3 py-2 text-sm" />
              <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={form.country} onChange={e => setForm({...form, country: e.target.value})} className="rounded-lg border px-3 py-2 text-sm"><option value="CN">China</option><option value="EG">Egypt</option><option value="TR">Turkey</option></select>
              <input placeholder="City" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={form.payment_terms} onChange={e => setForm({...form, payment_terms: e.target.value})} className="rounded-lg border px-3 py-2 text-sm"><option value="net_30">Net 30</option><option value="net_45">Net 45</option><option value="tt_advance">TT Advance</option><option value="net_15">Net 15</option></select>
              <input type="number" placeholder="Lead time (days)" value={form.lead_time_days} onChange={e => setForm({...form, lead_time_days: +e.target.value})} className="rounded-lg border px-3 py-2 text-sm" />
            </div>
          </div>
          <button onClick={handleCreate} className="mt-4 w-full rounded-lg bg-rose-500 py-2.5 text-sm font-medium text-white hover:bg-rose-600">Create Vendor</button>
        </div></div>
      )}
    </div>
  );
}
