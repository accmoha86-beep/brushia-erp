'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { formatEGP, formatDate, cn } from '@/lib/utils';
import { Search, Truck, Package, Clock, CheckCircle2, MapPin, RefreshCw, AlertTriangle } from 'lucide-react';

interface Shipment { id: string; order_number?: string; carrier: string; tracking_number: string; status: string; recipient_name: string; recipient_phone: string; city: string; governorate?: string; address: string; cod_amount: number; created_at: string; updated_at: string; }

const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', picked_up: 'bg-blue-100 text-blue-700', in_transit: 'bg-purple-100 text-purple-700', delivered: 'bg-emerald-100 text-emerald-700', failed: 'bg-red-100 text-red-700' };
const statusIcons: Record<string, any> = { pending: Clock, picked_up: Package, in_transit: Truck, delivered: CheckCircle2, failed: AlertTriangle };

export default function ShippingPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState<any>(null);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      const res = await api.get<any>('/shipping/shipments', params);
      setShipments(res?.data || []);
    } catch { setShipments([]); } finally { setLoading(false); }
  }, [filterStatus]);

  const fetchStats = useCallback(async () => {
    try { const s = await api.get<any>('/shipping/stats'); setStats(s); } catch {}
  }, []);

  useEffect(() => { fetchShipments(); fetchStats(); }, [fetchShipments, fetchStats]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Shipping</h1><p className="text-sm text-gray-500 mt-1">Track shipments via Bosta</p></div>
        <button onClick={fetchShipments} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold">{stats.total || 0}</p><p className="text-xs text-gray-500">Total</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p><p className="text-xs text-gray-500">Pending</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold text-purple-600">{stats.in_transit || 0}</p><p className="text-xs text-gray-500">In Transit</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold text-emerald-600">{stats.delivered || 0}</p><p className="text-xs text-gray-500">Delivered</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold text-red-600">{stats.failed || 0}</p><p className="text-xs text-gray-500">Failed</p></div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'picked_up', 'in_transit', 'delivered', 'failed'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={cn('px-3 py-2 rounded-lg text-sm font-medium', filterStatus === s ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>{s.replace('_', ' ')}</button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? Array.from({length:3}).map((_,i) => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)
        : shipments.length === 0 ? <div className="text-center py-12 text-gray-400"><Truck className="h-10 w-10 mx-auto mb-2 opacity-50" />No shipments found</div>
        : shipments.map(s => {
          const Icon = statusIcons[s.status] || Clock;
          return (
            <div key={s.id} className="rounded-xl border bg-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', s.status === 'delivered' ? 'bg-emerald-100' : s.status === 'failed' ? 'bg-red-100' : 'bg-blue-100')}><Icon className={cn('h-5 w-5', s.status === 'delivered' ? 'text-emerald-600' : s.status === 'failed' ? 'text-red-600' : 'text-blue-600')} /></div>
                <div>
                  <div className="flex items-center gap-2"><p className="font-medium text-gray-900">{s.recipient_name}</p><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[s.status])}>{s.status.replace('_', ' ')}</span></div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span>{s.tracking_number}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.city}</span>
                    <span>{s.carrier}</span>
                    {s.cod_amount > 0 && <span className="text-orange-600 font-medium">COD: {formatEGP(s.cod_amount)}</span>}
                  </div>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">{formatDate(s.updated_at)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
