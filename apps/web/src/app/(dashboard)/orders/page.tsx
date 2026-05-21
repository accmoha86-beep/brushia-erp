'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { formatEGP, formatDate, cn } from '@/lib/utils';
import { Search, Filter, Eye, X, Package, Truck, CheckCircle2, Clock, XCircle, RefreshCw, ShoppingBag } from 'lucide-react';

interface Order { id: string; order_number: string; customer_id?: string; customer_name?: string; status: string; payment_status: string; channel: string; total_amount: number; tax_amount: number; discount_amount: number; item_count?: number; created_at: string; }

const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700', shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700', draft: 'bg-gray-100 text-gray-600' };
const statusIcons: Record<string, any> = { pending: Clock, confirmed: CheckCircle2, shipped: Truck, delivered: Package, cancelled: XCircle };

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      const res = await api.get<any>('/sales/orders', params);
      const data = res?.data || res || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch { setOrders([]); } finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const viewOrder = async (id: string) => {
    try { const detail = await api.get<any>(`/sales/orders/${id}`); setSelectedOrder(detail); } catch {}
  };

  const filtered = orders.filter(o => !search || o.order_number?.toLowerCase().includes(search.toLowerCase()) || o.customer_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Orders</h1><p className="text-sm text-gray-500 mt-1">Manage sales orders across all channels</p></div>
        <button onClick={fetchOrders} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="text" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-rose-500 focus:outline-none" /></div>
        {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={cn('px-3 py-2 rounded-lg text-sm font-medium capitalize', filterStatus === s ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>{s}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Order</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Channel</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Payment</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? Array.from({length:5}).map((_,i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
            : filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-gray-400"><ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-50" />No orders yet</td></tr>
            : filtered.map(o => {
              const Icon = statusIcons[o.status] || Clock;
              return (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><p className="font-medium text-gray-900">{o.order_number}</p></td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{o.channel || 'pos'}</span></td>
                  <td className="px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1', statusColors[o.status] || 'bg-gray-100 text-gray-600')}><Icon className="h-3 w-3" />{o.status}</span></td>
                  <td className="px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', o.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700')}>{o.payment_status || '—'}</span></td>
                  <td className="px-4 py-3 text-right font-medium">{formatEGP(o.total_amount)}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => viewOrder(o.id)} className="text-rose-500 hover:text-rose-600"><Eye className="h-4 w-4" /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between mb-4"><h3 className="text-lg font-semibold">{selectedOrder.order_number}</h3><button onClick={() => setSelectedOrder(null)}><X className="h-5 w-5 text-gray-400" /></button></div>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><p className="text-gray-500">Status</p><p className="font-medium capitalize">{selectedOrder.status}</p></div>
            <div><p className="text-gray-500">Payment</p><p className="font-medium capitalize">{selectedOrder.payment_status}</p></div>
            <div><p className="text-gray-500">Channel</p><p className="font-medium">{selectedOrder.channel}</p></div>
            <div><p className="text-gray-500">Total</p><p className="font-medium text-emerald-600">{formatEGP(selectedOrder.total_amount)}</p></div>
          </div>
          {selectedOrder.items && <div><p className="font-medium text-gray-700 mb-2">Items</p>{selectedOrder.items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between py-1 text-sm"><span>{item.product_name || 'Product'} × {item.quantity}</span><span>{formatEGP(item.unit_price * item.quantity)}</span></div>
          ))}</div>}
        </div></div>
      )}
    </div>
  );
}
