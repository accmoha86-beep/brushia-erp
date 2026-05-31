'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api-client';
import { formatEGP, cn } from '@/lib/utils';
import { Building2, Users, DollarSign, RefreshCw, Plus, X, ShoppingBag } from 'lucide-react';

interface PriceList { id: string; name: string; code: string; type: string; is_active: boolean; min_order_amount: number; }
interface WholesaleCustomer { id: string; first_name: string; last_name: string; company_name: string; email: string; phone: string; total_orders: number; total_spent: number; loyalty_tier: string; }

export default function WholesalePage() {
  const { t, locale, isRTL } = useI18n();
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [customers, setCustomers] = useState<WholesaleCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [plRes, custRes] = await Promise.all([
        api.get<any>('/wholesale/price-lists').catch(() => ({ data: [] })),
        api.get<any>('/customers', { type: 'wholesale', limit: 50 }).catch(() => ({ data: [] })),
      ]);
      setPriceLists(plRes?.data || []);
      setCustomers(custRes?.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Wholesale</h1><p className="text-sm text-gray-500 mt-1">B2B pricing and wholesale customer management</p></div>
        <button onClick={fetchData} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4"><div className="flex items-center gap-2 mb-2"><DollarSign className="h-5 w-5 text-emerald-500" /><p className="text-xs text-gray-500">Price Lists</p></div><p className="text-2xl font-bold">{priceLists.length}</p></div>
        <div className="rounded-xl border bg-white p-4"><div className="flex items-center gap-2 mb-2"><Users className="h-5 w-5 text-blue-500" /><p className="text-xs text-gray-500">Wholesale Customers</p></div><p className="text-2xl font-bold">{customers.length}</p></div>
        <div className="rounded-xl border bg-white p-4"><div className="flex items-center gap-2 mb-2"><ShoppingBag className="h-5 w-5 text-purple-500" /><p className="text-xs text-gray-500">Total Revenue</p></div><p className="text-2xl font-bold text-emerald-600">{formatEGP(customers.reduce((s, c) => s + Number(c.total_spent || 0), 0))}</p></div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Price Lists</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {priceLists.map(pl => (
          <div key={pl.id} className="rounded-xl border bg-white p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{pl.name}</h3>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', pl.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600')}>{pl.is_active ? 'active' : 'inactive'}</span>
            </div>
            <p className="text-xs text-gray-400 font-mono mb-2">{pl.code}</p>
            <p className="text-sm text-gray-600">Min order: {formatEGP(pl.min_order_amount || 0)}</p>
          </div>
        ))}
        {priceLists.length === 0 && <p className="text-gray-400 text-sm">No price lists configured</p>}
      </div>

      <h2 className="text-lg font-semibold mb-3">Wholesale Customers</h2>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Customer</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Company</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Contact</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Orders</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Total Spent</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {customers.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-gray-400">No wholesale customers yet</td></tr>
            : customers.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.first_name} {c.last_name}</td>
                <td className="px-4 py-3 text-gray-600">{c.company_name || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{c.phone}<br />{c.email}</td>
                <td className="px-4 py-3 text-right">{c.total_orders}</td>
                <td className="px-4 py-3 text-right font-medium text-emerald-600">{formatEGP(c.total_spent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
