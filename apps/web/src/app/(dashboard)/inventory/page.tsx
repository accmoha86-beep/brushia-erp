'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api-client';
import { formatEGP, cn } from '@/lib/utils';
import { Search, Package, AlertTriangle, TrendingUp, ArrowRightLeft, RefreshCw, BarChart3 } from 'lucide-react';

interface StockItem { id: string; product_name: string; sku: string; variant_name?: string; warehouse_name: string; warehouse_code: string; qty_on_hand: number; qty_reserved: number; qty_available: number; reorder_point: number; weighted_avg_cost: number; }

type Tab = 'stock' | 'movements' | 'valuation';

export default function InventoryPage() {
  const { t, locale, isRTL } = useI18n();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [valuation, setValuation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('stock');

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get<any>('/inventory/stock', { limit: 200 }); setStock(res?.data || []); } catch { setStock([]); } finally { setLoading(false); }
  }, []);

  const fetchMovements = useCallback(async () => {
    try { const res = await api.get<any>('/inventory/movements', { limit: 50 }); setMovements(res?.data || []); } catch { setMovements([]); }
  }, []);

  const fetchValuation = useCallback(async () => {
    try { const res = await api.get<any>('/inventory/valuation'); setValuation(res); } catch {}
  }, []);

  useEffect(() => { fetchStock(); fetchMovements(); fetchValuation(); }, [fetchStock, fetchMovements, fetchValuation]);

  const filtered = stock.filter(s => !search || s.product_name?.toLowerCase().includes(search.toLowerCase()) || s.sku?.toLowerCase().includes(search.toLowerCase()));
  const lowStock = stock.filter(s => s.qty_on_hand <= (s.reorder_point || 10));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Inventory</h1><p className="text-sm text-gray-500 mt-1">Stock levels, movements & valuation</p></div>
        <button onClick={() => { fetchStock(); fetchMovements(); fetchValuation(); }} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
      </div>

      {valuation && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold">{valuation.total_products || stock.length}</p><p className="text-xs text-gray-500">Products Tracked</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold">{(valuation.total_units || stock.reduce((s: number, i: StockItem) => s + i.qty_on_hand, 0)).toLocaleString()}</p><p className="text-xs text-gray-500">Total Units</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold text-emerald-600">{formatEGP(valuation.total_value || 0)}</p><p className="text-xs text-gray-500">Total Value (WAC)</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold text-red-600">{lowStock.length}</p><p className="text-xs text-gray-500">Low Stock Alerts</p></div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {([['stock', 'Stock Levels', Package], ['movements', 'Movements', ArrowRightLeft], ['valuation', 'Valuation', BarChart3]] as [Tab, string, any][]).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)} className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium', tab === id ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}><Icon className="h-4 w-4" />{label}</button>
        ))}
      </div>

      {tab === 'stock' && <>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="text" placeholder="Search by product or SKU..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-rose-500 focus:outline-none" /></div>
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Product</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Warehouse</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">On Hand</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Reserved</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Available</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Avg Cost</th>
              <th className="px-4 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? Array.from({length:5}).map((_,i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
              : filtered.map((s, i) => (
                <tr key={i} className={cn('hover:bg-gray-50', s.qty_on_hand <= (s.reorder_point || 10) && 'bg-red-50')}>
                  <td className="px-4 py-3"><p className="font-medium text-gray-900">{s.product_name}</p><p className="text-xs text-gray-400 font-mono">{s.sku}</p></td>
                  <td className="px-4 py-3 text-gray-600">{s.warehouse_name} <span className="text-xs text-gray-400">({s.warehouse_code})</span></td>
                  <td className="px-4 py-3 text-right font-medium">{s.qty_on_hand}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{s.qty_reserved || 0}</td>
                  <td className="px-4 py-3 text-right"><span className={cn('font-medium', (s.qty_available || s.qty_on_hand) <= (s.reorder_point || 10) ? 'text-red-600' : 'text-gray-900')}>{s.qty_available || s.qty_on_hand - (s.qty_reserved || 0)}</span></td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatEGP(s.weighted_avg_cost || 0)}</td>
                  <td className="px-4 py-3">{s.qty_on_hand <= (s.reorder_point || 10) && <AlertTriangle className="h-4 w-4 text-red-500" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>}

      {tab === 'movements' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Product</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Warehouse</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Quantity</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Reference</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {movements.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-gray-400">No movements recorded yet</td></tr>
              : movements.map((m: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', m.movement_type === 'in' ? 'bg-emerald-100 text-emerald-700' : m.movement_type === 'out' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')}>{m.movement_type}</span></td>
                  <td className="px-4 py-3 font-medium">{m.product_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{m.warehouse_name || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{m.quantity > 0 ? '+' : ''}{m.quantity}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{m.reference_type} {m.reference_id ? '#' + m.reference_id.substring(0,8) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'valuation' && valuation && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-white p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Valuation Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-600">Method</span><span className="font-medium">Weighted Average Cost (WAC)</span></div>
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-600">Total SKUs</span><span className="font-medium">{valuation.total_products || 0}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-600">Total Units</span><span className="font-medium">{(valuation.total_units || 0).toLocaleString()}</span></div>
              <div className="flex justify-between py-2"><span className="text-gray-600">Total Value</span><span className="font-bold text-emerald-600">{formatEGP(valuation.total_value || 0)}</span></div>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-5">
            <h3 className="font-semibold text-gray-900 mb-3">By Warehouse</h3>
            <div className="space-y-3">
              {(valuation.by_warehouse || []).map((w: any) => (
                <div key={w.warehouse_id || w.code} className="flex justify-between py-2 border-b border-gray-100">
                  <div><p className="font-medium">{w.warehouse_name || w.name}</p><p className="text-xs text-gray-400">{w.sku_count} SKUs</p></div>
                  <div className="text-right"><p className="font-medium">{(w.total_units || 0).toLocaleString()} units</p><p className="text-xs text-emerald-600">{formatEGP(w.total_value || 0)}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
