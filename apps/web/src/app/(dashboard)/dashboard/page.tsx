'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

interface DashData {
  productCount: number;
  categoryCount: number;
  orderCount: number;
  stockItems: number;
  totalUnits: number;
  lowStock: any[];
  recentProducts: any[];
  customerStats: any;
  activePromos: any[];
  totalRevenue: number;
  avgOrderValue: number;
  todayRevenue: number;
  todaysOrders: any[];
  statusCounts: Record<string, number>;
  channelCounts: Record<string, number>;
  channelRevenue: Record<string, number>;
  paymentCounts: Record<string, number>;
  last7: number[];
  totalCommission: number;
  commArr: any[];
  branchArr: any[];
  retailBranches: number;
  exhibitionBranches: number;
  warehouseBranches: number;
  orderArr: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get token directly from localStorage
      let token: string | null = null;
      try {
        const raw = localStorage.getItem('brushia-auth');
        if (raw) token = JSON.parse(raw)?.state?.accessToken || null;
      } catch {}

      if (!token) {
        setError('No auth token found');
        setLoading(false);
        return;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const fetchJSON = async (path: string) => {
        const res = await fetch(`/api/v1${path}`, { headers });
        if (!res.ok) throw new Error(`${path} returned ${res.status}`);
        return res.json();
      };

      const [products, categories, stock, orders, customers, promotions, commissions, branches] = await Promise.all([
        fetchJSON('/catalog/products?limit=50').catch(() => ({ data: [], pagination: { total: 0 } })),
        fetchJSON('/catalog/categories').catch(() => ({ data: [] })),
        fetchJSON('/inventory/stock?limit=200').catch(() => ({ data: [] })),
        fetchJSON('/sales/orders').catch(() => ({ data: [] })),
        fetchJSON('/customers/stats').catch(() => ({})),
        fetchJSON('/promotions').catch(() => ({ data: [] })),
        fetchJSON('/commissions').catch(() => ({ data: [] })),
        fetchJSON('/branches').catch(() => ({ data: [] })),
      ]);

      const stockArr = Array.isArray(stock?.data) ? stock.data : [];
      const lowStock = stockArr
        .filter((s: any) => Number(s.qty_on_hand) <= Math.max(Number(s.reorder_point) || 50, 50))
        .sort((a: any, b: any) => Number(a.qty_on_hand) - Number(b.qty_on_hand));
      const prodArr = Array.isArray(products?.data) ? products.data : [];
      const prodTotal = products?.pagination?.total || prodArr.length;
      const orderArr = Array.isArray(orders?.data) ? orders.data : Array.isArray(orders) ? orders : [];
      const promoArr = Array.isArray(promotions?.data) ? promotions.data : Array.isArray(promotions) ? promotions : [];
      const commArr = Array.isArray(commissions?.data?.rows) ? commissions.data.rows : Array.isArray(commissions?.data) ? commissions.data : Array.isArray(commissions) ? commissions : [];
      const branchArr = Array.isArray(branches?.data?.rows) ? branches.data.rows : Array.isArray(branches?.data) ? branches.data : Array.isArray(branches) ? branches : [];
      const catArr = Array.isArray(categories?.data) ? categories.data : Array.isArray(categories) ? categories : [];

      // Revenue (values from API are in piasters — bigint stored as string)
      const totalRevenue = orderArr.reduce((s: number, o: any) => s + (Number(o.paid_amount) || Number(o.grand_total) || 0), 0);
      const avgOrderValue = orderArr.length > 0 ? totalRevenue / orderArr.length : 0;

      const today = new Date().toISOString().split('T')[0];
      const todaysOrders = orderArr.filter((o: any) => o.created_at?.startsWith(today));
      const todayRevenue = todaysOrders.reduce((s: number, o: any) => s + (Number(o.paid_amount) || Number(o.grand_total) || 0), 0);

      const statusCounts = orderArr.reduce((acc: any, o: any) => {
        acc[o.status] = (acc[o.status] || 0) + 1; return acc;
      }, {} as Record<string, number>);

      const channelCounts = orderArr.reduce((acc: any, o: any) => {
        const ch = o.channel || o.source || 'pos';
        acc[ch] = (acc[ch] || 0) + 1; return acc;
      }, {} as Record<string, number>);

      const channelRevenue = orderArr.reduce((acc: any, o: any) => {
        const ch = o.channel || o.source || 'pos';
        acc[ch] = (acc[ch] || 0) + (Number(o.paid_amount) || Number(o.grand_total) || 0); return acc;
      }, {} as Record<string, number>);

      const paymentCounts = orderArr.reduce((acc: any, o: any) => {
        const pm = o.payment_method || o.method || 'unknown';
        acc[pm] = (acc[pm] || 0) + 1; return acc;
      }, {} as Record<string, number>);

      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const ds = d.toISOString().split('T')[0];
        return orderArr
          .filter((o: any) => o.created_at?.startsWith(ds))
          .reduce((s: number, o: any) => s + (Number(o.paid_amount) || Number(o.grand_total) || 0), 0);
      });

      const totalUnits = stockArr.reduce((s: number, i: any) => s + (Number(i.qty_on_hand) || 0), 0);

      const topProducts = [...prodArr]
        .map((p: any) => ({ ...p, price: Number(p.base_price) || 0 }))
        .sort((a: any, b: any) => b.price - a.price)
        .slice(0, 6);

      const totalCommission = commArr.reduce((s: number, c: any) => s + (Number(c.total_commission) || 0), 0);

      const activePromos = promoArr.filter((p: any) =>
        p.status === 'active' || p.is_active === true || p.is_active === 'true'
      );

      const bType = (b: any) => b.branch_type || b.type || '';
      const retailBranches = branchArr.filter((b: any) => bType(b) === 'permanent' || bType(b) === 'retail').length;
      const exhibitionBranches = branchArr.filter((b: any) => bType(b) === 'exhibition' || bType(b) === 'popup').length;
      const warehouseBranches = branchArr.filter((b: any) => bType(b) === 'warehouse').length;

      setData({
        productCount: prodTotal,
        categoryCount: catArr.length,
        orderCount: orderArr.length,
        stockItems: stockArr.length,
        totalUnits,
        lowStock,
        recentProducts: topProducts,
        customerStats: customers || {},
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
    } catch (e: any) {
      console.error('Dashboard fetch error:', e);
      setError(e?.message || 'Failed to load dashboard');
    }
    setLoading(false);
  };

  useEffect(() => {
    // Small delay to allow zustand rehydration
    const timer = setTimeout(() => fetchDashboard(), 300);
    return () => clearTimeout(timer);
  }, []);

  const paymentLabels: Record<string, { label: string; icon: any; color: string }> = {
    cash: { label: 'Cash', icon: Wallet, color: 'text-emerald-600 bg-emerald-50' },
    card: { label: 'Card', icon: CreditCard, color: 'text-blue-600 bg-blue-50' },
    vodafone_cash: { label: 'Vodafone Cash', icon: DollarSign, color: 'text-red-600 bg-red-50' },
    instapay: { label: 'InstaPay', icon: DollarSign, color: 'text-purple-600 bg-purple-50' },
    unknown: { label: 'Other', icon: DollarSign, color: 'text-gray-600 bg-gray-50' },
  };

  const channelLabels: Record<string, { label: string; color: string }> = {
    pos: { label: 'POS', color: 'bg-emerald-500' },
    whatsapp: { label: 'WhatsApp', color: 'bg-green-500' },
    exhibition: { label: 'Exhibition', color: 'bg-purple-500' },
    ecommerce: { label: 'E-Commerce', color: 'bg-blue-500' },
  };

  const paidPct = data && data.orderCount > 0
    ? Math.round(((data.statusCounts?.confirmed || 0) + (data.statusCounts?.completed || 0)) / data.orderCount * 100)
    : 0;

  // Safe formatEGP wrapper — values from API are in piasters (pennies)
  const fmtMoney = (piasters: number | undefined | null) => {
    const val = Number(piasters) || 0;
    return formatEGP(val);
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-rose-50/30 p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-rose-500" /> Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back to <span className="text-rose-500 font-semibold">Brushia</span> ERP — {new Date().toLocaleDateString('en-EG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchDashboard} disabled={loading} className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw className={cn("h-4 w-4 text-gray-500", loading && "animate-spin")} />
          </button>
          <Link href="/pos" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white text-sm font-medium shadow-lg shadow-rose-200 hover:shadow-xl transition-all">
            <Sparkles className="h-4 w-4" /> Open POS
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Dashboard Error</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
          <button onClick={fetchDashboard} className="ml-auto px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200">Retry</button>
        </div>
      )}

      {/* Loading state */}
      {loading && !data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      )}

      {/* Data loaded */}
      {data && (
        <>
          {/* KPI Row 1 — Primary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Revenue */}
            <div className="relative overflow-hidden bg-white rounded-2xl p-6 border border-rose-100 shadow-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-100 to-rose-50 rounded-bl-[60px] opacity-60" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-rose-50"><DollarSign className="h-4 w-4 text-rose-500" /></div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Revenue</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{fmtMoney(data.totalRevenue)}</p>
                <div className="flex items-center gap-3 mt-3">
                  <MiniBarChart data={data.last7 || []} color="bg-rose-400" />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">7-day trend</p>
              </div>
            </div>

            {/* Today's Sales */}
            <div className="relative overflow-hidden bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-bl-[60px] opacity-60" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-emerald-50"><TrendingUp className="h-4 w-4 text-emerald-500" /></div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Today&apos;s Sales</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{fmtMoney(data.todayRevenue)}</p>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <ShoppingBag className="h-3 w-3" /> {data.todaysOrders?.length || 0} orders today
                </p>
              </div>
            </div>

            {/* Total Orders */}
            <div className="relative overflow-hidden bg-white rounded-2xl p-6 border border-blue-100 shadow-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-50 rounded-bl-[60px] opacity-60" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-blue-50"><ShoppingBag className="h-4 w-4 text-blue-500" /></div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Orders</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{data.orderCount}</p>
                <p className="text-xs text-gray-400 mt-2">Avg {fmtMoney(data.avgOrderValue)} / order</p>
              </div>
            </div>

            {/* Customers */}
            <div className="relative overflow-hidden bg-white rounded-2xl p-6 border border-purple-100 shadow-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-50 rounded-bl-[60px] opacity-60" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-purple-50"><Users className="h-4 w-4 text-purple-500" /></div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Customers</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{data.customerStats?.total_customers || 0}</p>
                <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                  <span className="text-gray-400">{data.customerStats?.retail_count || 0} retail</span>
                  <span className="text-purple-500 font-medium">{data.customerStats?.wholesale_count || 0} wholesale</span>
                  <span className="text-amber-500 font-medium">⭐ {data.customerStats?.vip_count || 0} VIP</span>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Row 2 — Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link href="/products" className="group bg-white rounded-xl p-4 border border-gray-100 hover:border-rose-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-50"><Package className="h-3.5 w-3.5 text-rose-500" /></div>
                  <span className="text-xs font-medium text-gray-500">Products</span>
                </div>
                <ArrowRight className="h-3 w-3 text-gray-300 group-hover:text-rose-400 transition-colors" />
              </div>
              <p className="text-2xl font-bold mt-2">{data.productCount}</p>
              <p className="text-[10px] text-gray-400 mt-1">{data.categoryCount} categories</p>
            </Link>

            <Link href="/inventory" className="group bg-white rounded-xl p-4 border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50"><Package className="h-3.5 w-3.5 text-emerald-500" /></div>
                  <span className="text-xs font-medium text-gray-500">Inventory</span>
                </div>
                <ArrowRight className="h-3 w-3 text-gray-300 group-hover:text-emerald-400 transition-colors" />
              </div>
              <p className="text-2xl font-bold mt-2">{data.totalUnits?.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 mt-1">{data.stockItems} stock records</p>
            </Link>

            <Link href="/promotions" className="group bg-white rounded-xl p-4 border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50"><Tag className="h-3.5 w-3.5 text-amber-500" /></div>
                  <span className="text-xs font-medium text-gray-500">Active Promos</span>
                </div>
                <ArrowRight className="h-3 w-3 text-gray-300 group-hover:text-amber-400 transition-colors" />
              </div>
              <p className="text-2xl font-bold mt-2">{data.activePromos?.length || 0}</p>
              <p className="text-[10px] text-gray-400 mt-1">running campaigns</p>
            </Link>

            <Link href="/branches" className="group bg-white rounded-xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50"><MapPin className="h-3.5 w-3.5 text-blue-500" /></div>
                  <span className="text-xs font-medium text-gray-500">Branches</span>
                </div>
                <ArrowRight className="h-3 w-3 text-gray-300 group-hover:text-blue-400 transition-colors" />
              </div>
              <p className="text-2xl font-bold mt-2">{data.branchArr?.length || 0}</p>
              <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                <span className="text-gray-400">{data.retailBranches} retail</span>
                <span className="text-amber-500">{data.exhibitionBranches} exhibition</span>
                <span className="text-blue-500">{data.warehouseBranches} warehouse</span>
              </div>
            </Link>
          </div>

          {/* Row 3 — Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Low Stock Alerts */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Low Stock Alerts
                </h3>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                  (data.lowStock?.length || 0) > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700')}>
                  {data.lowStock?.length || 0} items
                </span>
              </div>
              {(data.lowStock?.length || 0) > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.lowStock.slice(0, 8).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-xs">
                      <span className="font-medium text-gray-700 truncate flex-1">{item.product_name || item.name || 'Product'}</span>
                      <span className={cn('font-bold ml-2', Number(item.qty_on_hand) <= 10 ? 'text-red-600' : 'text-amber-600')}>
                        {item.qty_on_hand} units
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <CheckCircle2 className="h-10 w-10 text-emerald-300 mb-2" />
                  <p className="text-sm">All stock levels healthy!</p>
                </div>
              )}
              <Link href="/inventory" className="flex items-center gap-1 text-xs text-rose-500 font-medium mt-4 hover:text-rose-600">
                View All Inventory <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Sales by Channel */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-blue-500" /> Sales by Channel
              </h3>
              {Object.keys(data.channelCounts || {}).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(data.channelCounts).map(([ch, count]) => {
                    const info = channelLabels[ch] || { label: ch, color: 'bg-gray-500' };
                    const rev = data.channelRevenue?.[ch] || 0;
                    const pct = data.orderCount > 0 ? Math.round((Number(count) / data.orderCount) * 100) : 0;
                    return (
                      <div key={ch}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700">{info.label}</span>
                          <span className="text-gray-400">{String(count)} orders · {fmtMoney(Number(rev))}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all', info.color)} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <BarChart3 className="h-10 w-10 text-gray-200 mb-2" />
                  <p className="text-sm">No sales data yet</p>
                </div>
              )}
              <div className="border-t border-gray-100 mt-4 pt-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Order Status</p>
                <div className="flex items-center gap-3">
                  <ProgressRing pct={paidPct} color="#10b981" />
                  <div className="text-xs space-y-0.5">
                    <p className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> {data.statusCounts?.confirmed || 0} confirmed</p>
                    <p className="flex items-center gap-1"><Clock className="h-3 w-3 text-amber-500" /> {data.statusCounts?.pending || 0} pending</p>
                    <p className="flex items-center gap-1"><XCircle className="h-3 w-3 text-red-400" /> {data.statusCounts?.cancelled || 0} cancelled</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <CreditCard className="h-4 w-4 text-purple-500" /> Payment Methods
              </h3>
              {Object.keys(data.paymentCounts || {}).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(data.paymentCounts).map(([pm, count]) => {
                    const info = paymentLabels[pm] || paymentLabels.unknown;
                    const Icon = info.icon;
                    return (
                      <div key={pm} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50">
                        <div className={cn('p-1.5 rounded-lg', info.color)}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-700">{info.label}</p>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{String(count)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <CreditCard className="h-10 w-10 text-gray-200 mb-2" />
                  <p className="text-sm">No payment data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Row 4 — Recent Orders + Quick Links */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Recent Orders */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-rose-500" /> Recent Orders
                </h3>
                <Link href="/orders" className="text-xs text-rose-500 font-medium hover:text-rose-600">View All</Link>
              </div>
              {(data.orderArr?.length || 0) > 0 ? (
                <div className="space-y-2">
                  {data.orderArr.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{order.order_number}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('en-EG') : '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-900">{fmtMoney(Number(order.paid_amount) || Number(order.grand_total) || 0)}</p>
                        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                          order.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                        )}>{order.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <ShoppingBag className="h-10 w-10 text-gray-200 mb-2" />
                  <p className="text-sm">No orders yet</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-purple-500" /> Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/pos" className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-rose-50 to-purple-50 border border-rose-100 hover:shadow-md transition-all group">
                  <div className="p-2 rounded-lg bg-rose-100"><Sparkles className="h-4 w-4 text-rose-500" /></div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Open POS</p>
                    <p className="text-[10px] text-gray-400">Start selling</p>
                  </div>
                </Link>
                <Link href="/orders" className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 hover:shadow-md transition-all group">
                  <div className="p-2 rounded-lg bg-blue-100"><ShoppingBag className="h-4 w-4 text-blue-500" /></div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Orders</p>
                    <p className="text-[10px] text-gray-400">{data.orderCount} total</p>
                  </div>
                </Link>
                <Link href="/products" className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100 hover:shadow-md transition-all group">
                  <div className="p-2 rounded-lg bg-amber-100"><Package className="h-4 w-4 text-amber-500" /></div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Products</p>
                    <p className="text-[10px] text-gray-400">{data.productCount} items</p>
                  </div>
                </Link>
                <Link href="/reports" className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 hover:shadow-md transition-all group">
                  <div className="p-2 rounded-lg bg-emerald-100"><BarChart3 className="h-4 w-4 text-emerald-500" /></div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Reports</p>
                    <p className="text-[10px] text-gray-400">Analytics</p>
                  </div>
                </Link>
              </div>

              {/* Commission Summary */}
              {data.totalCommission > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-medium text-gray-700">Total Commissions</span>
                    </div>
                    <span className="text-sm font-bold text-amber-700">{fmtMoney(data.totalCommission)}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{data.commArr?.length || 0} salespersons</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
