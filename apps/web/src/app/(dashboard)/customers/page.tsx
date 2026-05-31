'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api-client';
import { formatEGP, cn } from '@/lib/utils';
import { Search, Plus, Star, Phone, X, Eye, RefreshCw, Users, Crown } from 'lucide-react';

interface Customer {
  id: string; customer_number: string; first_name: string; last_name: string; full_name?: string;
  email: string; phone: string; whatsapp?: string; customer_type: string; company_name?: string;
  city: string; governorate?: string; loyalty_points: number; loyalty_tier: string;
  total_orders: number; total_spent: number; is_active: boolean; created_at: string;
}

const tierColors: Record<string, string> = { bronze: 'bg-orange-100 text-orange-700', silver: 'bg-gray-100 text-gray-700', gold: 'bg-yellow-100 text-yellow-700', platinum: 'bg-purple-100 text-purple-700' };
const tierIcons: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '👑' };

export default function CustomersPage() {
  const { t, locale, isRTL } = useI18n();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [stats, setStats] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', customer_type: 'retail', city: '', company_name: '' });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (search) params.search = search;
      if (filterType !== 'all') params.type = filterType;
      const res = await api.get<any>('/customers', params);
      setCustomers(res?.data || []);
    } catch { setCustomers([]); } finally { setLoading(false); }
  }, [search, filterType]);

  const fetchStats = useCallback(async () => {
    try { const s = await api.get<any>('/customers/stats'); setStats(s); } catch {}
  }, []);

  useEffect(() => { fetchCustomers(); fetchStats(); }, [fetchCustomers, fetchStats]);

  const handleCreate = async () => {
    try {
      await api.post('/customers', form);
      setShowCreate(false);
      setForm({ first_name: '', last_name: '', email: '', phone: '', customer_type: 'retail', city: '', company_name: '' });
      fetchCustomers(); fetchStats();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Customers</h1><p className="text-sm text-gray-500 mt-1">Manage retail & wholesale customers</p></div>
        <div className="flex gap-2">
          <button onClick={fetchCustomers} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"><Plus className="h-4 w-4" />Add Customer</button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold">{stats.total_customers || 0}</p><p className="text-xs text-gray-500">Total Customers</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold">{stats.wholesale_count || 0}</p><p className="text-xs text-gray-500">Wholesale</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold">{stats.vip_count || 0}</p><p className="text-xs text-gray-500">VIP (Gold+)</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold text-emerald-600">{formatEGP(stats.total_revenue || 0)}</p><p className="text-xs text-gray-500">Total Revenue</p></div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="text" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-rose-500 focus:outline-none" /></div>
        {['all', 'retail', 'wholesale'].map(t => (
          <button key={t} onClick={() => setFilterType(t)} className={cn('px-4 py-2 rounded-lg text-sm font-medium capitalize', filterType === t ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>{t}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Customer</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Contact</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Tier</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Orders</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Total Spent</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Points</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({length: 5}).map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
            ) : customers.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400"><Users className="h-10 w-10 mx-auto mb-2 opacity-50" />No customers found</td></tr>
            ) : customers.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedCustomer(c)}>
                <td className="px-4 py-3"><p className="font-medium text-gray-900">{c.first_name} {c.last_name}</p><p className="text-xs text-gray-400">{c.customer_number}</p></td>
                <td className="px-4 py-3"><p className="text-gray-600">{c.phone || '—'}</p><p className="text-xs text-gray-400">{c.email || '—'}</p></td>
                <td className="px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', c.customer_type === 'wholesale' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600')}>{c.customer_type}</span></td>
                <td className="px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1', tierColors[c.loyalty_tier] || 'bg-gray-100 text-gray-600')}>{tierIcons[c.loyalty_tier] || '🏷️'} {c.loyalty_tier}</span></td>
                <td className="px-4 py-3 text-right text-gray-600">{c.total_orders}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{formatEGP(c.total_spent)}</td>
                <td className="px-4 py-3 text-right"><span className="text-purple-600 font-medium">{c.loyalty_points?.toLocaleString()}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex justify-between mb-4"><h3 className="text-lg font-semibold">New Customer</h3><button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-gray-400" /></button></div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="First Name *" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className="rounded-lg border px-3 py-2 text-sm" />
              <input placeholder="Last Name" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className="rounded-lg border px-3 py-2 text-sm" />
            </div>
            <input placeholder="Phone (+20...)" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full rounded-lg border px-3 py-2 text-sm" />
            <select value={form.customer_type} onChange={e => setForm({...form, customer_type: e.target.value})} className="w-full rounded-lg border px-3 py-2 text-sm"><option value="retail">Retail</option><option value="wholesale">Wholesale</option></select>
            <input placeholder="City" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full rounded-lg border px-3 py-2 text-sm" />
            {form.customer_type === 'wholesale' && <input placeholder="Company Name" value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} className="w-full rounded-lg border px-3 py-2 text-sm" />}
          </div>
          <button onClick={handleCreate} className="mt-4 w-full rounded-lg bg-rose-500 py-2.5 text-sm font-medium text-white hover:bg-rose-600">Create Customer</button>
        </div></div>
      )}

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex justify-between mb-4"><h3 className="text-lg font-semibold">{selectedCustomer.first_name} {selectedCustomer.last_name}</h3><button onClick={() => setSelectedCustomer(null)}><X className="h-5 w-5 text-gray-400" /></button></div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-500">Customer #</p><p className="font-medium">{selectedCustomer.customer_number}</p></div>
            <div><p className="text-gray-500">Type</p><p className="font-medium capitalize">{selectedCustomer.customer_type}</p></div>
            <div><p className="text-gray-500">Phone</p><p className="font-medium">{selectedCustomer.phone || '—'}</p></div>
            <div><p className="text-gray-500">Email</p><p className="font-medium">{selectedCustomer.email || '—'}</p></div>
            <div><p className="text-gray-500">City</p><p className="font-medium">{selectedCustomer.city || '—'}</p></div>
            <div><p className="text-gray-500">Tier</p><p className="font-medium capitalize">{tierIcons[selectedCustomer.loyalty_tier]} {selectedCustomer.loyalty_tier}</p></div>
            <div><p className="text-gray-500">Orders</p><p className="font-medium">{selectedCustomer.total_orders}</p></div>
            <div><p className="text-gray-500">Total Spent</p><p className="font-medium text-emerald-600">{formatEGP(selectedCustomer.total_spent)}</p></div>
            <div><p className="text-gray-500">Loyalty Points</p><p className="font-medium text-purple-600">{selectedCustomer.loyalty_points?.toLocaleString()}</p></div>
            <div><p className="text-gray-500">WhatsApp</p><p className="font-medium">{selectedCustomer.whatsapp || '—'}</p></div>
          </div>
        </div></div>
      )}
    </div>
  );
}
