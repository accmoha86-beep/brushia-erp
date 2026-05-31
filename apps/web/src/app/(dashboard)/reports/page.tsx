'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api-client';
import { formatEGP, cn } from '@/lib/utils';
import { BarChart3, TrendingUp, Package, Users, Truck, Wallet, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';

export default function ReportsPage() {
  const { t, locale, isRTL } = useI18n();
  const [dashboard, setDashboard] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [revenueByDay, setRevenueByDay] = useState<any[]>([]);
  const [customerInsights, setCustomerInsights] = useState<any>(null);
  const [inventorySummary, setInventorySummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, top, rev, cust, inv] = await Promise.all([
        api.get<any>('/reports/dashboard').catch(() => null),
        api.get<any>('/reports/top-products').catch(() => ({ data: [] })),
        api.get<any>('/reports/revenue-by-day', { days: 7 }).catch(() => ({ data: [] })),
        api.get<any>('/reports/customer-insights').catch(() => null),
        api.get<any>('/reports/inventory-summary').catch(() => null),
      ]);
      setDashboard(dash);
      setTopProducts(top?.data || []);
      setRevenueByDay(rev?.data || []);
      setCustomerInsights(cust);
      setInventorySummary(inv);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <div className="p-6 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" /></div>;

  const s = dashboard?.sales || {};
  const inv = dashboard?.inventory || {};
  const cust = dashboard?.customers || {};

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1><p className="text-sm text-gray-500 mt-1">Business intelligence for Brushia</p></div>
        <button onClick={fetchAll} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4"><div className="flex items-center gap-2 mb-2"><Wallet className="h-5 w-5 text-emerald-500" /><p className="text-xs text-gray-500">Total Revenue</p></div><p className="text-xl font-bold text-emerald-600">{formatEGP(s.total_revenue || 0)}</p><p className="text-xs text-gray-400 mt-1">Today: {formatEGP(s.today_revenue || 0)}</p></div>
        <div className="rounded-xl border bg-white p-4"><div className="flex items-center gap-2 mb-2"><BarChart3 className="h-5 w-5 text-blue-500" /><p className="text-xs text-gray-500">Total Orders</p></div><p className="text-xl font-bold">{s.total_orders || 0}</p><p className="text-xs text-gray-400 mt-1">Today: {s.today_orders || 0}</p></div>
        <div className="rounded-xl border bg-white p-4"><div className="flex items-center gap-2 mb-2"><Package className="h-5 w-5 text-purple-500" /><p className="text-xs text-gray-500">Inventory Value</p></div><p className="text-xl font-bold">{formatEGP(inv.total_value || 0)}</p><p className="text-xs text-gray-400 mt-1">{inv.total_units || 0} units across {inv.total_products || 0} products</p></div>
        <div className="rounded-xl border bg-white p-4"><div className="flex items-center gap-2 mb-2"><Users className="h-5 w-5 text-rose-500" /><p className="text-xs text-gray-500">Customers</p></div><p className="text-xl font-bold">{cust.total || 0}</p><p className="text-xs text-gray-400 mt-1">{cust.wholesale || 0} wholesale</p></div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Revenue Last 7 Days</h3>
          <div className="space-y-2">
            {revenueByDay.map((d: any, i: number) => {
              const maxRev = Math.max(...revenueByDay.map((x: any) => Number(x.revenue) || 0), 1);
              const pct = ((Number(d.revenue) || 0) / maxRev) * 100;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20">{new Date(d.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden"><div className="h-full bg-gradient-to-r from-rose-400 to-purple-500 rounded-full flex items-center justify-end pr-2" style={{width: `${Math.max(pct, 5)}%`}}><span className="text-[10px] text-white font-medium">{formatEGP(d.revenue || 0)}</span></div></div>
                  <span className="text-xs text-gray-500 w-12 text-right">{d.order_count || 0}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Top Products</h3>
          {topProducts.length === 0 ? <p className="text-sm text-gray-400">No sales data yet</p> :
          <div className="space-y-2">
            {topProducts.slice(0, 8).map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">{i+1}</span><div><p className="text-sm font-medium">{p.name}</p><p className="text-[10px] text-gray-400">{p.sku}</p></div></div>
                <div className="text-right"><p className="text-sm font-medium">{formatEGP(p.revenue)}</p><p className="text-[10px] text-gray-400">{p.units_sold} sold</p></div>
              </div>
            ))}
          </div>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {customerInsights && (
          <div className="rounded-xl border bg-white p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Customer Breakdown</h3>
            <div className="space-y-2">
              {(customerInsights.by_tier || []).map((t: any) => (
                <div key={t.tier} className="flex items-center justify-between py-1"><span className="text-sm capitalize">{t.tier}</span><div className="text-right"><span className="text-sm font-medium">{t.count} customers</span><span className="text-xs text-gray-400 ml-2">{formatEGP(t.total_spent)}</span></div></div>
              ))}
            </div>
            <h4 className="font-medium text-gray-700 mt-4 mb-2">Top Cities</h4>
            <div className="flex flex-wrap gap-2">{(customerInsights.by_city || []).map((c: any) => (
              <span key={c.city} className="px-2 py-1 rounded-full bg-gray-100 text-xs">{c.city} ({c.count})</span>
            ))}</div>
          </div>
        )}

        {inventorySummary && (
          <div className="rounded-xl border bg-white p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Inventory by Warehouse</h3>
            <div className="space-y-2">
              {(inventorySummary.by_warehouse || []).map((w: any) => (
                <div key={w.code} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div><p className="text-sm font-medium">{w.warehouse_name}</p><p className="text-[10px] text-gray-400">{w.code} · {w.sku_count} SKUs</p></div>
                  <div className="text-right"><p className="text-sm font-medium">{w.total_units?.toLocaleString()} units</p><p className="text-xs text-emerald-600">{formatEGP(w.total_value || 0)}</p></div>
                </div>
              ))}
            </div>
            {inventorySummary.low_stock_items?.length > 0 && <>
              <h4 className="font-medium text-red-600 mt-4 mb-2">⚠️ Low Stock ({inventorySummary.low_stock_items.length})</h4>
              {inventorySummary.low_stock_items.slice(0, 5).map((s: any, i: number) => (
                <div key={i} className="flex justify-between py-1 text-sm"><span>{s.product_name}</span><span className="text-red-600 font-medium">{s.qty_on_hand} left</span></div>
              ))}
            </>}
          </div>
        )}
      </div>
    </div>
  );
}
