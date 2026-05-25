'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { formatEGP, cn } from '@/lib/utils';
import {
  Package, Users, ShoppingBag, Wallet, AlertTriangle, TrendingUp,
  ArrowRight, Sparkles, BarChart3, Truck, Tag, RefreshCw, CreditCard,
  DollarSign, Star, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2,
  XCircle, MapPin, Eye, Percent, Award, ShieldCheck, Activity
} from 'lucide-react';

/* ──────── Mini Bar Chart ──────── */
function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px] h-10">
      {data.map((v, i) => (
        <div key={i} className={cn('rounded-t-sm w-2.5 transition-all', color)}
          style={{ height: `${Math.max((v / max) * 100, 6)}%`, opacity: 0.4 + (i / data.length) * 0.6 }} />
      ))}
    </div>
  );
}

/* ──────── Progress Ring ──────── */
function ProgressRing({ pct, size = 44, stroke = 4, color }: { pct: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" className="transition-all duration-700" />
    </svg>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [products, categories, stock, orders, customers, promotions, commissions, branches] = await Promise.all([
        api.get<any>('/catalog/products', { limit: 10 }).catch(() => ({ data: [], total: 0 })),
        api.get<any>('/catalog/categories').catch(() => ({ data: [] })),
        api.get<any>('/inventory/stock', { limit: 200 }).catch(() => ({ data: [] })),
        api.get<any>('/sales/orders').catch(() => ({ data: [] })),
        api.get<any>('/customers/stats').catch(() => ({})),
        api.get<any>('/promotions').catch(() => ({ data: [] })),
        api.get<any>('/commissions').catch(() => ({ data: [] })),
        api.get<any>('/branches').catch(() => ({ data: [] })),
      ]);

      const stockArr = stock?.data || [];
      const lowStock = stockArr
        .filter((s: any) => Number(s.qty_on_hand) <= Math.max(Number(s.reorder_point) || 50, 50))
        .sort((a: any, b: any) => Number(a.qty_on_hand) - Number(b.qty_on_hand));
      const prodArr = products?.data || [];
      const prodTotal = products?.pagination?.total || prodArr.length;
      const orderArr = orders?.data || orders || [];
      const promoArr = promotions?.data || promotions || [];
      const commArr = commissions?.data || commissions || [];
      const branchArr = branches?.data || branches || [];
      const catArr = categories?.data || categories || [];

      // Revenue calculations
      const totalRevenue = orderArr.reduce((s: number, o: any) => s + (Number(o.paid_amount) || Number(o.grand_total) || 0), 0);
      const avgOrderValue = orderArr.length > 0 ? totalRevenue / orderArr.length : 0;

      // Today's orders
      const today = new Date().toISOString().split('T')[0];
      const todaysOrders = orderArr.filter((o: any) => o.created_at?.startsWith(today));
      const todayRevenue = todaysOrders.reduce((s: number, o: any) => s + (Number(o.paid_amount) || Number(o.grand_total) || 0), 0);

      // Orders by status
      const statusCounts = orderArr.reduce((acc: any, o: any) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {});

      // Orders by channel
      const channelCounts = orderArr.reduce((acc: any, o: any) => {
        const ch = o.channel || o.source || 'pos';
        acc[ch] = (acc[ch] || 0) + 1;
        return acc;
      }, {});

      // Revenue by channel
      const channelRevenue = orderArr.reduce((acc: any, o: any) => {
        const ch = o.channel || o.source || 'pos';
        acc[ch] = (acc[ch] || 0) + (Number(o.paid_amount) || Number(o.grand_total) || 0);
        return acc;
      }, {});

      // Payment method breakdown
      const paymentCounts = orderArr.reduce((acc: any, o: any) => {
        const pm = o.payment_method || 'unknown';
        acc[pm] = (acc[pm] || 0) + 1;
        return acc;
      }, {});

      // Generate daily revenue for last 7 days (mini chart)
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const ds = d.toISOString().split('T')[0];
        return orderArr
          .filter((o: any) => o.created_at?.startsWith(ds))
          .reduce((s: number, o: any) => s + (Number(o.paid_amount) || Number(o.grand_total) || 0), 0);
      });

      // Total inventory value (using cost_price from products)
      const totalUnits = stockArr.reduce((s: number, i: any) => s + (Number(i.qty_on_hand) || 0), 0);

      // Top products (by price for now — would be by sales qty in production)
      const topProducts = [...prodArr]
        .map((p: any) => ({ ...p, price: Number(p.base_price) || 0 }))
        .sort((a: any, b: any) => b.price - a.price)
        .slice(0, 6);

      // Commission totals
      const totalCommission = commArr.reduce((s: number, c: any) => s + (Number(c.total_commission) || 0), 0);

      // Active promos
      const activePromos = promoArr.filter((p: any) =>
        p.status === 'active' || p.is_active === true || p.is_active === 'true'
      );

      // Branch breakdown
      const retailBranches = branchArr.filter((b: any) => b.type === 'retail').length;
      const exhibitionBranches = branchArr.filter((b: any) => b.type === 'exhibition').length;
      const warehouseBranches = branchArr.filter((b: any) => b.type === 'warehouse').length;

      setData({
        productCount: prodTotal,
        categoryCount: catArr.length,
        orderCount: orderArr.length,
        stockItems: stockArr.length,
        totalUnits,
        lowStock,
        recentProducts: topProducts,
        customerStats: customers,
        activePromos,
        totalRevenue,
        avgOrderValue,
        todayRevenue,
        todaysOrders,
        statusCounts,
        channelCounts,
        channelRevenue,
        paymentCounts,
        last7,
        totalCommission,
        commArr,
        branchArr,
        retailBranches,
        exhibitionBranches,
        warehouseBranches,
        orderArr,
      });
    } catch (e) { console.error('Dashboard error', e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const paymentLabels: Record<string, { label: string; icon: any; color: string }> = {
    cash: { label: 'Cash', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
    card: { label: 'Card', icon: CreditCard, color: 'text-blue-600 bg-blue-50' },
    vodafone_cash: { label: 'Vodafone Cash', icon: Wallet, color: 'text-red-600 bg-red-50' },
    instapay: { label: 'InstaPay', icon: Activity, color: 'text-purple-600 bg-purple-50' },
    unknown: { label: 'Other', icon: DollarSign, color: 'text-gray-600 bg-gray-50' },
  };

  const channelLabels: Record<string, { label: string; color: string; bg: string }> = {
    pos: { label: 'POS', color: 'text-rose-700', bg: 'bg-rose-100' },
    whatsapp: { label: 'WhatsApp', color: 'text-green-700', bg: 'bg-green-100' },
    online: { label: 'E-commerce', color: 'text-blue-700', bg: 'bg-blue-100' },
    exhibition: { label: 'Exhibition', color: 'text-amber-700', bg: 'bg-amber-100' },
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-3 border-rose-500 border-t-transparent mx-auto mb-4" />
        <p className="text-sm text-gray-500 animate-pulse">Loading dashboard...</p>
      </div>
    </div>
  );

  const paidPct = data.orderCount > 0
    ? Math.round(((data.statusCounts?.confirmed || 0) + (data.statusCounts?.completed || 0)) / data.orderCount * 100)
    : 0;

  return (
    <div className="p-4 md:p-6 max-w-[1440px] mx-auto space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-rose-500" /> Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back to <span className="font-semibold text-rose-600">Brushia</span> ERP &mdash; {new Date().toLocaleDateString('en-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchDashboard} className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </button>
          <a href="/pos" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-2.5 text-sm font-medium text-white hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-200 transition-all">
            <Sparkles className="h-4 w-4" /> Open POS
          </a>
        </div>
      </div>

      {/* ═══ KPI Cards Row 1 — Revenue ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border bg-gradient-to-br from-rose-50 to-white p-5 relative overflow-hidden">
          <div className="absolute top-3 right-3 opacity-10"><DollarSign className="h-16 w-16 text-rose-500" /></div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-xl bg-rose-100 flex items-center justify-center"><DollarSign className="h-5 w-5 text-rose-600" /></div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatEGP(data.totalRevenue / 100)}</p>
          <div className="flex items-center gap-2 mt-2">
            <MiniBarChart data={data.last7 || []} color="bg-rose-400" />
            <span className="text-[10px] text-gray-400 ml-1">7-day trend</span>
          </div>
        </div>

        {/* Today's Sales */}
        <div className="rounded-2xl border bg-gradient-to-br from-emerald-50 to-white p-5 relative overflow-hidden">
          <div className="absolute top-3 right-3 opacity-10"><TrendingUp className="h-16 w-16 text-emerald-500" /></div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Today&apos;s Sales</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatEGP(data.todayRevenue / 100)}</p>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <ShoppingBag className="h-3 w-3" /> {data.todaysOrders?.length || 0} orders today
          </p>
        </div>

        {/* Orders */}
        <div className="rounded-2xl border bg-gradient-to-br from-blue-50 to-white p-5 relative overflow-hidden">
          <div className="absolute top-3 right-3 opacity-10"><ShoppingBag className="h-16 w-16 text-blue-500" /></div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center"><ShoppingBag className="h-5 w-5 text-blue-600" /></div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Orders</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.orderCount}</p>
          <p className="text-xs text-gray-400 mt-2">Avg {formatEGP(data.avgOrderValue / 100)} / order</p>
        </div>

        {/* Customers */}
        <div className="rounded-2xl border bg-gradient-to-br from-purple-50 to-white p-5 relative overflow-hidden">
          <div className="absolute top-3 right-3 opacity-10"><Users className="h-16 w-16 text-purple-500" /></div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center"><Users className="h-5 w-5 text-purple-600" /></div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customers</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.customerStats?.total_customers || 0}</p>
          <div className="flex items-center gap-3 mt-2 text-[10px]">
            <span className="text-gray-400">{data.customerStats?.retail_count || 0} retail</span>
            <span className="text-purple-500 font-medium">{data.customerStats?.wholesale_count || 0} wholesale</span>
            <span className="text-amber-500 font-medium">⭐ {data.customerStats?.vip_count || 0} VIP</span>
          </div>
        </div>
      </div>

      {/* ═══ KPI Cards Row 2 — Operations ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Products */}
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-pink-100 flex items-center justify-center"><Package className="h-4 w-4 text-pink-600" /></div>
              <span className="text-xs font-medium text-gray-500">Products</span>
            </div>
            <a href="/products" className="text-rose-500 hover:text-rose-600"><ArrowRight className="h-4 w-4" /></a>
          </div>
          <p className="text-2xl font-bold">{data.productCount}</p>
          <p className="text-[10px] text-gray-400 mt-1">{data.categoryCount} categories</p>
        </div>

        {/* Inventory */}
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Wallet className="h-4 w-4 text-emerald-600" /></div>
              <span className="text-xs font-medium text-gray-500">Inventory</span>
            </div>
            <a href="/inventory" className="text-rose-500 hover:text-rose-600"><ArrowRight className="h-4 w-4" /></a>
          </div>
          <p className="text-2xl font-bold">{data.totalUnits?.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-1">{data.stockItems} stock records</p>
        </div>

        {/* Promotions */}
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center"><Tag className="h-4 w-4 text-amber-600" /></div>
              <span className="text-xs font-medium text-gray-500">Active Promos</span>
            </div>
            <a href="/promotions" className="text-rose-500 hover:text-rose-600"><ArrowRight className="h-4 w-4" /></a>
          </div>
          <p className="text-2xl font-bold">{data.activePromos?.length || 0}</p>
          <p className="text-[10px] text-gray-400 mt-1">running campaigns</p>
        </div>

        {/* Branches */}
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center"><MapPin className="h-4 w-4 text-indigo-600" /></div>
              <span className="text-xs font-medium text-gray-500">Branches</span>
            </div>
            <a href="/settings" className="text-rose-500 hover:text-rose-600"><ArrowRight className="h-4 w-4" /></a>
          </div>
          <p className="text-2xl font-bold">{data.branchArr?.length || 0}</p>
          <div className="flex items-center gap-2 mt-1 text-[10px]">
            <span className="text-gray-400">{data.retailBranches} retail</span>
            <span className="text-amber-500">{data.exhibitionBranches} exhibition</span>
            <span className="text-blue-500">{data.warehouseBranches} warehouse</span>
          </div>
        </div>
      </div>

      {/* ═══ Middle Row: Low Stock + Sales by Channel + Payment Methods ═══ */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Low Stock Alerts
            </h3>
            <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium',
              (data.lowStock?.length || 0) > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700')}>
              {data.lowStock?.length || 0} items
            </span>
          </div>
          {(data.lowStock || []).length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-10 w-10 text-emerald-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">All stock levels healthy!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {(data.lowStock || []).slice(0, 8).map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/50 border border-red-100/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{s.product_name}</p>
                      <p className="text-[10px] text-gray-400">{s.warehouse_name || 'Main Warehouse'}</p>
                    </div>
                  </div>
                  <span className={cn('text-sm font-bold px-2 py-0.5 rounded-lg',
                    Number(s.qty_on_hand) <= 10 ? 'text-red-700 bg-red-100' :
                    Number(s.qty_on_hand) <= 30 ? 'text-amber-700 bg-amber-100' : 'text-orange-700 bg-orange-100')}>
                    {Number(s.qty_on_hand)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <a href="/inventory" className="flex items-center justify-center gap-1 mt-3 text-xs text-rose-500 hover:text-rose-600 font-medium">
            View All Inventory <ArrowRight className="h-3 w-3" />
          </a>
        </div>

        {/* Sales by Channel */}
        <div className="rounded-2xl border bg-white p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" /> Sales by Channel
          </h3>
          <div className="space-y-3">
            {Object.entries(data.channelRevenue || {}).map(([ch, rev]: [string, any]) => {
              const cfg = channelLabels[ch] || { label: ch, color: 'text-gray-700', bg: 'bg-gray-100' };
              const pct = data.totalRevenue > 0 ? (rev / data.totalRevenue * 100) : 0;
              return (
                <div key={ch}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase', cfg.bg, cfg.color)}>{cfg.label}</span>
                      <span className="text-xs text-gray-400">{data.channelCounts?.[ch] || 0} orders</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{formatEGP(rev / 100)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all duration-700', ch === 'pos' ? 'bg-rose-400' : ch === 'whatsapp' ? 'bg-green-400' : ch === 'online' ? 'bg-blue-400' : 'bg-amber-400')}
                      style={{ width: `${Math.max(pct, 3)}%` }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(data.channelRevenue || {}).length === 0 && (
              <div className="text-center py-8">
                <BarChart3 className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No sales data yet</p>
              </div>
            )}
          </div>

          {/* Order Status Summary */}
          <div className="mt-5 pt-4 border-t">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Order Status</h4>
            <div className="flex items-center justify-center gap-2">
              <div className="relative flex items-center justify-center">
                <ProgressRing pct={paidPct} color="#10b981" />
                <span className="absolute text-[10px] font-bold text-gray-700">{paidPct}%</span>
              </div>
              <div className="text-xs space-y-1 ml-2">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /><span className="text-gray-600">{(data.statusCounts?.confirmed || 0) + (data.statusCounts?.completed || 0)} confirmed</span></div>
                <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-amber-500" /><span className="text-gray-600">{data.statusCounts?.pending || 0} pending</span></div>
                <div className="flex items-center gap-1.5"><XCircle className="h-3 w-3 text-red-400" /><span className="text-gray-600">{data.statusCounts?.cancelled || 0} cancelled</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="rounded-2xl border bg-white p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-violet-500" /> Payment Methods
          </h3>
          <div className="space-y-3">
            {Object.entries(data.paymentCounts || {}).map(([pm, count]: [string, any]) => {
              const cfg = paymentLabels[pm] || paymentLabels.unknown;
              const Icon = cfg.icon;
              const pct = data.orderCount > 0 ? (count / data.orderCount * 100) : 0;
              return (
                <div key={pm} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', cfg.color.split(' ')[1])}>
                    <Icon className={cn('h-4 w-4', cfg.color.split(' ')[0])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{cfg.label}</span>
                      <span className="text-sm font-bold text-gray-900">{count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-violet-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium w-10 text-right">{Math.round(pct)}%</span>
                </div>
              );
            })}
            {Object.keys(data.paymentCounts || {}).length === 0 && (
              <div className="text-center py-8">
                <CreditCard className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No payment data yet</p>
              </div>
            )}
          </div>

          {/* Commission Summary */}
          {(data.commArr || []).length > 0 && (
            <div className="mt-5 pt-4 border-t">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                <Award className="h-3 w-3" /> Commission Summary
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{data.commArr.length} salespersons</span>
                <span className="text-sm font-bold text-violet-600">{formatEGP(data.totalCommission / 100)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Bottom: Recent Orders + Quick Actions + Top Products ═══ */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-blue-500" /> Recent Orders
            </h3>
            <a href="/orders" className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-medium">
              View All <ArrowRight className="h-3 w-3" />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-gray-500 uppercase">
                  <th className="text-left pb-3 font-medium">Order #</th>
                  <th className="text-left pb-3 font-medium">Channel</th>
                  <th className="text-left pb-3 font-medium">Payment</th>
                  <th className="text-right pb-3 font-medium">Amount</th>
                  <th className="text-left pb-3 font-medium">Status</th>
                  <th className="text-left pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data.orderArr || []).slice(0, 6).map((o: any) => {
                  const ch = o.channel || o.source || 'pos';
                  const cfg = channelLabels[ch] || channelLabels.pos;
                  const pmCfg = paymentLabels[o.payment_method] || paymentLabels.unknown;
                  return (
                    <tr key={o.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-mono text-xs font-bold text-rose-600">{o.order_number}</td>
                      <td className="py-3"><span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase', cfg.bg, cfg.color)}>{cfg.label}</span></td>
                      <td className="py-3"><span className="text-xs text-gray-600">{pmCfg.label}</span></td>
                      <td className="py-3 text-right font-bold text-gray-900">{formatEGP((Number(o.paid_amount) || Number(o.grand_total) || 0) / 100)}</td>
                      <td className="py-3">
                        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full',
                          o.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          o.payment_status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600')}>
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-gray-400">
                        {new Date(o.created_at).toLocaleDateString('en-EG', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
                {(data.orderArr || []).length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-400 text-sm">No orders yet — open POS to start selling!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions + Top Products */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl border bg-white p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-rose-500" /> Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/pos', label: 'Open POS', icon: Sparkles, color: 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-600 hover:from-rose-100 hover:to-pink-100 border border-rose-100' },
                { href: '/orders', label: 'Orders', icon: ShoppingBag, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100' },
                { href: '/inventory', label: 'Stock', icon: Package, color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100' },
                { href: '/customers', label: 'Customers', icon: Users, color: 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-100' },
                { href: '/promotions', label: 'Promos', icon: Tag, color: 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100' },
                { href: '/reports', label: 'Reports', icon: BarChart3, color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100' },
                { href: '/shipping', label: 'Shipping', icon: Truck, color: 'bg-teal-50 text-teal-600 hover:bg-teal-100 border border-teal-100' },
                { href: '/purchase-orders', label: 'Purchases', icon: TrendingUp, color: 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100' },
              ].map(a => (
                <a key={a.href} href={a.href} className={cn('flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium transition-all', a.color)}>
                  <a.icon className="h-3.5 w-3.5" />{a.label}
                </a>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="rounded-2xl border bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" /> Top Products
              </h3>
              <a href="/products" className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1">
                All <ArrowRight className="h-3 w-3" />
              </a>
            </div>
            <div className="space-y-2">
              {(data.recentProducts || []).map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className={cn('h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold',
                    i === 0 ? 'bg-amber-100 text-amber-700' :
                    i === 1 ? 'bg-gray-100 text-gray-600' :
                    i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400')}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{p.sku}</p>
                  </div>
                  <span className="text-sm font-bold text-rose-600">{formatEGP(p.price / 100)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
