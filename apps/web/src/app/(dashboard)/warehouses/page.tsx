'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { formatEGP, cn } from '@/lib/utils';
import { Warehouse, MapPin, Package, Box, BarChart3, RefreshCw, Plus, X } from 'lucide-react';

interface WarehouseData { id: string; code: string; name: string; name_ar?: string; warehouse_type: string; city?: string; governorate?: string; phone?: string; is_active: boolean; sku_count: number; total_units: number; total_value: number; }

const typeColors: Record<string, string> = { standard: 'bg-blue-100 text-blue-700', showroom: 'bg-purple-100 text-purple-700', returns: 'bg-orange-100 text-orange-700' };

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [warehouseStock, setWarehouseStock] = useState<any[]>([]);

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get<any>('/warehouses'); setWarehouses(res?.data || []); } catch { setWarehouses([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchWarehouses(); }, [fetchWarehouses]);

  const viewStock = async (wh: WarehouseData) => {
    setSelectedWarehouse(wh);
    try { const res = await api.get<any>(`/warehouses/${wh.id}/stock`); setWarehouseStock(res?.data || []); } catch { setWarehouseStock([]); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Warehouses</h1><p className="text-sm text-gray-500 mt-1">Manage storage locations and stock</p></div>
        <button onClick={fetchWarehouses} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({length:3}).map((_,i) => <div key={i} className="h-48 rounded-xl bg-gray-100 animate-pulse" />)
        : warehouses.map(wh => (
          <div key={wh.id} className="rounded-xl border bg-white p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => viewStock(wh)}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100"><Warehouse className="h-5 w-5 text-blue-600" /></div>
                <div><h3 className="font-semibold text-gray-900">{wh.name}</h3><p className="text-xs text-gray-400">{wh.code}</p></div>
              </div>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', typeColors[wh.warehouse_type] || 'bg-gray-100 text-gray-600')}>{wh.warehouse_type}</span>
            </div>
            {wh.city && <div className="flex items-center gap-1 text-xs text-gray-500 mb-3"><MapPin className="h-3 w-3" />{wh.city}{wh.governorate ? `, ${wh.governorate}` : ''}</div>}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
              <div className="text-center"><p className="text-lg font-bold text-gray-900">{wh.sku_count}</p><p className="text-[10px] text-gray-500">SKUs</p></div>
              <div className="text-center"><p className="text-lg font-bold text-gray-900">{wh.total_units?.toLocaleString()}</p><p className="text-[10px] text-gray-500">Units</p></div>
              <div className="text-center"><p className="text-lg font-bold text-emerald-600">{formatEGP(wh.total_value || 0)}</p><p className="text-[10px] text-gray-500">Value</p></div>
            </div>
          </div>
        ))}
      </div>

      {selectedWarehouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between mb-4"><h3 className="text-lg font-semibold">{selectedWarehouse.name} — Stock</h3><button onClick={() => setSelectedWarehouse(null)}><X className="h-5 w-5 text-gray-400" /></button></div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="text-left px-3 py-2">Product</th><th className="text-left px-3 py-2">SKU</th><th className="text-right px-3 py-2">On Hand</th><th className="text-right px-3 py-2">Reserved</th><th className="text-right px-3 py-2">Avg Cost</th></tr></thead>
            <tbody className="divide-y">{warehouseStock.map((s: any, i: number) => (
              <tr key={i} className={cn(s.qty_on_hand <= (s.reorder_point || 10) && 'bg-red-50')}>
                <td className="px-3 py-2 font-medium">{s.product_name}</td>
                <td className="px-3 py-2 text-gray-500 font-mono text-xs">{s.sku}</td>
                <td className="px-3 py-2 text-right">{s.qty_on_hand}</td>
                <td className="px-3 py-2 text-right text-gray-500">{s.qty_reserved || 0}</td>
                <td className="px-3 py-2 text-right">{formatEGP(s.weighted_avg_cost || 0)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div></div>
      )}
    </div>
  );
}
