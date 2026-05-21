'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { formatEGP, formatDate, cn } from '@/lib/utils';
import { Plus, Search, Eye, X, RefreshCw, FileText, ChevronRight } from 'lucide-react';

interface PO { id: string; po_number: string; vendor_name: string; status: string; expected_date?: string; total_amount: number; item_count: number; shipping_cost: number; customs_duty: number; created_at: string; }

const statusColors: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-700', partial_received: 'bg-yellow-100 text-yellow-700', received: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700' };

export default function PurchaseOrdersPage() {
  const [pos, setPOs] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  const fetchPOs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      const res = await api.get<any>('/purchasing/orders', params);
      setPOs(res?.data || []);
    } catch { setPOs([]); } finally { setLoading(false); }
  }, [filterStatus]);

  const fetchStats = useCallback(async () => {
    try { const s = await api.get<any>('/purchasing/stats'); setStats(s); } catch {}
  }, []);

  useEffect(() => { fetchPOs(); fetchStats(); }, [fetchPOs, fetchStats]);

  const viewPO = async (id: string) => {
    try { const detail = await api.get<any>(`/purchasing/orders/${id}`); setSelectedPO(detail); } catch {}
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1><p className="text-sm text-gray-500 mt-1">Track orders from China & local suppliers</p></div>
        <button onClick={fetchPOs} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold">{stats.total_pos}</p><p className="text-xs text-gray-500">Total POs</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold text-yellow-600">{stats.draft_count}</p><p className="text-xs text-gray-500">Draft</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold text-blue-600">{stats.pending_count}</p><p className="text-xs text-gray-500">Pending</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold text-emerald-600">{stats.received_count}</p><p className="text-xs text-gray-500">Received</p></div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {['all', 'draft', 'sent', 'received', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={cn('px-3 py-2 rounded-lg text-sm font-medium capitalize', filterStatus === s ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>{s}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-500">PO Number</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Vendor</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Items</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? Array.from({length:3}).map((_,i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
            : pos.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-gray-400"><FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />No purchase orders yet</td></tr>
            : pos.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.po_number}</td>
                <td className="px-4 py-3 text-gray-600">{p.vendor_name || '—'}</td>
                <td className="px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[p.status])}>{p.status}</span></td>
                <td className="px-4 py-3 text-right">{p.item_count}</td>
                <td className="px-4 py-3 text-right font-medium">{formatEGP(p.total_amount)}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(p.created_at)}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => viewPO(p.id)} className="text-rose-500 hover:text-rose-600"><Eye className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between mb-4"><h3 className="text-lg font-semibold">{selectedPO.po_number}</h3><button onClick={() => setSelectedPO(null)}><X className="h-5 w-5 text-gray-400" /></button></div>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><p className="text-gray-500">Vendor</p><p className="font-medium">{selectedPO.vendor_name}</p></div>
            <div><p className="text-gray-500">Status</p><p className="font-medium capitalize">{selectedPO.status}</p></div>
            <div><p className="text-gray-500">Shipping Cost</p><p className="font-medium">{formatEGP(selectedPO.shipping_cost || 0)}</p></div>
            <div><p className="text-gray-500">Customs Duty</p><p className="font-medium">{formatEGP(selectedPO.customs_duty || 0)}</p></div>
          </div>
          {selectedPO.items && <div><p className="font-medium text-gray-700 mb-2">Items ({selectedPO.items.length})</p>{selectedPO.items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between py-2 text-sm border-b border-gray-100"><div><p className="font-medium">{item.product_name || 'Product'}</p><p className="text-xs text-gray-400">{item.sku}</p></div><div className="text-right"><p>{item.quantity} × {formatEGP(item.unit_cost)}</p><p className="text-xs text-gray-400">Received: {item.received_qty || 0}</p></div></div>
          ))}</div>}
        </div></div>
      )}
    </div>
  );
}
