'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { formatEGP, cn } from '@/lib/utils';
import { Package, Users, ShoppingBag, Wallet, AlertTriangle, TrendingUp, ArrowRight, Sparkles, BarChart3, Truck, Tag, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [products, categories, stock, accounts, orders, customers, promotions] = await Promise.all([
        api.get<any>('/catalog/products', { limit: 5 }).catch(() => ({ data: [], total: 0 })),
        api.get<any>('/catalog/categories').catch(() => ({ data: [] })),
        api.get<any>('/inventory/stock', { limit: 200 }).catch(() => ({ data: [] })),
        api.get<any>('/accounting/accounts').catch(() => ({ data: [] })),
        api.get<any>('/sales/orders').catch(() => ({ data: [] })),
        api.get<any>('/customers/stats').catch(() => ({})),
        api.get<any>('/promotions').catch(() => ({ data: [] })),
      ]);
      const stockArr = stock?.data || [];
      const lowStock = stockArr.filter((s: any) => s.qty_on_hand <= (s.reorder_point || 10));
      const prodArr = products?.data || [];
      const prodTotal = products?.pagination?.total || prodArr.length;
      setData({
        productCount: prodTotal,
        categoryCount: (categories?.data || categories || []).length,
        orderCount: (orders?.data || orders || []).length,
        stockItems: stockArr.length,
        totalUnits: stockArr.reduce((s: number, i: any) => s + (Number(i.qty_on_hand) || 0), 0),
        accountCount: (accounts?.data || accounts || []).length,
        lowStock,
        recentProducts: prodArr.slice(0, 5).map((p: any) => ({ ...p, price: Number(p.base_price) || 0 })),
        customerStats: customers,
        activePromos: (promotions?.data || []).filter((p: any) => p.status === 'active').length,
      });
    } catch (e) { console.error('Dashboard error', e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) return <div className="p-6 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Dashboard</h1><p className="text-sm text-gray-500 mt-1">Welcome back to Brushia ERP</p></div>
        <div className="flex items-center gap-2">
          <button onClick={fetchDashboard} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
          <a href="/pos" className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-600 transition-colors"><Sparkles className="h-4 w-4" />Open POS</a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-5"><div className="flex items-center gap-2 mb-3"><Package className="h-5 w-5 text-rose-500" /><span className="text-xs text-gray-500">Products</span></div><p className="text-3xl font-bold">{data.productCount}</p><p className="text-xs text-gray-400 mt-1">{data.categoryCount} categories</p></div>
        <div className="rounded-xl border bg-white p-5"><div className="flex items-center gap-2 mb-3"><ShoppingBag className="h-5 w-5 text-blue-500" /><span className="text-xs text-gray-500">Orders</span></div><p className="text-3xl font-bold">{data.orderCount}</p><p className="text-xs text-gray-400 mt-1">{data.activePromos} active promos</p></div>
        <div className="rounded-xl border bg-white p-5"><div className="flex items-center gap-2 mb-3"><Users className="h-5 w-5 text-purple-500" /><span className="text-xs text-gray-500">Customers</span></div><p className="text-3xl font-bold">{data.customerStats?.total_customers || 0}</p><p className="text-xs text-gray-400 mt-1">{data.customerStats?.wholesale_count || 0} wholesale</p></div>
        <div className="rounded-xl border bg-white p-5"><div className="flex items-center gap-2 mb-3"><Wallet className="h-5 w-5 text-emerald-500" /><span className="text-xs text-gray-500">Inventory</span></div><p className="text-3xl font-bold">{data.totalUnits?.toLocaleString()}</p><p className="text-xs text-gray-400 mt-1">{data.stockItems} stock records</p></div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-gray-900">Low Stock Alerts</h3><span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">{data.lowStock?.length || 0} items</span></div>
          {(data.lowStock || []).length === 0 ? <p className="text-sm text-gray-400">All stock levels healthy!</p>
          : (data.lowStock || []).slice(0, 5).map((s: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /><div><p className="text-sm font-medium">{s.product_name}</p><p className="text-[10px] text-gray-400">{s.warehouse_name}</p></div></div>
              <span className="text-sm font-bold text-red-600">{s.qty_on_hand} left</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-gray-900">Quick Actions</h3></div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/pos', label: 'Open POS', icon: Sparkles, color: 'bg-rose-50 text-rose-600 hover:bg-rose-100' },
              { href: '/orders', label: 'View Orders', icon: ShoppingBag, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
              { href: '/inventory', label: 'Stock Levels', icon: Package, color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
              { href: '/customers', label: 'Customers', icon: Users, color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
              { href: '/promotions', label: 'Promotions', icon: Tag, color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
              { href: '/reports', label: 'Reports', icon: BarChart3, color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' },
              { href: '/shipping', label: 'Shipping', icon: Truck, color: 'bg-teal-50 text-teal-600 hover:bg-teal-100' },
              { href: '/purchase-orders', label: 'Purchases', icon: TrendingUp, color: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
            ].map(a => (
              <a key={a.href} href={a.href} className={cn('flex items-center gap-2 rounded-lg p-3 text-sm font-medium transition-colors', a.color)}>
                <a.icon className="h-4 w-4" />{a.label}<ArrowRight className="h-3 w-3 ml-auto opacity-50" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Recent Products</h3>
        <div className="space-y-2">
          {(data.recentProducts || []).map((p: any) => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-3"><span className="text-xl">{'💄'}</span><div><p className="text-sm font-medium">{p.name}</p><p className="text-[10px] text-gray-400 font-mono">{p.sku}</p></div></div>
              <p className="text-sm font-medium text-rose-600">{formatEGP(p.price)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
