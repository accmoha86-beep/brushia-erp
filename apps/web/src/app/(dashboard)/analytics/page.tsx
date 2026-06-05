'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { formatEGP, cn } from '@/lib/utils';
import {
  BarChart3, TrendingUp, PieChart as PieIcon, Calendar, RefreshCw,
  ArrowUpRight, ArrowDownRight, Package, Users, DollarSign, ShoppingCart,
  Target, Layers, Clock, Zap, Filter
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart
} from 'recharts';

const COLORS = ['#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6'];
const GRADIENT_CARDS = [
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
];

function getToken() {
  try {
    const raw = localStorage.getItem('bloom-auth');
    if (raw) return JSON.parse(raw)?.state?.accessToken;
  } catch {}
  return null;
}

async function apiFetch(path: string) {
  const token = getToken();
  const res = await fetch('/api/v1' + path, {
    headers: token ? { Authorization: 'Bearer ' + token } : {},
  });
  if (!res.ok) return null;
  return res.json();
}

export default function AnalyticsPage() {
  const { t, locale, isRTL } = useI18n();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [orders, products, customers, stockLevels, categories, promotions, commissions] = await Promise.all([
      apiFetch('/sales/orders'),
      apiFetch('/catalog/products'),
      apiFetch('/customers'),
      apiFetch('/inventory/stock'),
      apiFetch('/catalog/categories'),
      apiFetch('/promotions'),
      apiFetch('/commissions'),
    ]);

    const orderList = Array.isArray(orders) ? orders : orders?.data ?? [];
    const productList = Array.isArray(products) ? products : products?.data ?? [];
    const customerList = Array.isArray(customers) ? customers : customers?.data ?? [];
    const stockList = Array.isArray(stockLevels) ? stockLevels : stockLevels?.data ?? stockLevels?.rows ?? [];
    const categoryList = Array.isArray(categories) ? categories : categories?.data ?? [];
    const promoList = Array.isArray(promotions) ? promotions : promotions?.data ?? [];
    const salespersonList = Array.isArray(commissions) ? commissions : commissions?.data ?? commissions?.rows ?? [];

    // Process orders by date
    const now = new Date();
    const daysMap: Record<string, { revenue: number; orders: number; items: number }> = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeekTotals = Array(7).fill(0).map((_, i) => ({ day: dayNames[i], revenue: 0, orders: 0 }));
    const hourTotals = Array(24).fill(0).map((_, i) => ({ hour: `${i}:00`, revenue: 0, orders: 0 }));
    const paymentMethods: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    let totalRevenue = 0;
    let totalOrders = 0;
    let avgOrderValue = 0;

    orderList.forEach((o: any) => {
      const date = new Date(o.created_at || o.order_date);
      const dateKey = date.toISOString().split('T')[0];
      const amount = Number(o.total) / 100 || 0;
      
      if (!daysMap[dateKey]) daysMap[dateKey] = { revenue: 0, orders: 0, items: 0 };
      daysMap[dateKey].revenue += amount;
      daysMap[dateKey].orders += 1;

      // Day of week
      dayOfWeekTotals[date.getDay()].revenue += amount;
      dayOfWeekTotals[date.getDay()].orders += 1;

      // Hour
      hourTotals[date.getHours()].revenue += amount;
      hourTotals[date.getHours()].orders += 1;

      // Payment methods
      const method = o.method || o.payment_method || 'cash';
      paymentMethods[method] = (paymentMethods[method] || 0) + amount;

      // Status
      const status = o.status || 'completed';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      totalRevenue += amount;
      totalOrders += 1;
    });

    avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Revenue trend (last N days)
    const revenueTrend = Object.entries(daysMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        revenue: Math.round(d.revenue * 100) / 100,
        orders: d.orders,
      }));

    // Category sales (from products + stock)
    const categorySales = categoryList.map((c: any) => {
      const catProducts = productList.filter((p: any) => String(p.category_id) === String(c.id));
      const catStock = catProducts.reduce((sum: number, p: any) => {
        const sl = stockList.find((s: any) => String(s.product_id) === String(p.id));
        return sum + Number(sl?.qty_on_hand ?? 0);
      }, 0);
      return {
        name: c.name,
        products: catProducts.length,
        stock: catStock,
        value: catProducts.reduce((s: number, p: any) => s + Number(p.base_price || 0) / 100, 0),
      };
    }).filter((c: any) => c.products > 0);

    // Top products by stock value
    const topProducts = productList.map((p: any) => {
      const sl = stockList.find((s: any) => String(s.product_id) === String(p.id));
      const qty = Number(sl?.qty_on_hand ?? 0);
      const price = Number(p.base_price || 0) / 100;
      const cost = Number(p.cost_price || 0) / 100;
      return {
        name: p.name?.substring(0, 25) || 'Unknown',
        stock: qty,
        value: Math.round(qty * price),
        margin: price > 0 ? Math.round(((price - cost) / price) * 100) : 0,
        price,
        cost,
      };
    }).sort((a: any, b: any) => b.value - a.value).slice(0, 10);

    // Payment method pie data
    const paymentPie = Object.entries(paymentMethods).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
      value: Math.round(value * 100) / 100,
    }));

    // Order status pie
    const statusPie = Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    // Customer growth (by join date)
    const customerGrowth = customerList.reduce((acc: any[], c: any) => {
      const date = new Date(c.created_at).toLocaleDateString('en', { month: 'short', year: '2-digit' });
      const existing = acc.find((x: any) => x.month === date);
      if (existing) existing.count += 1;
      else acc.push({ month: date, count: 1 });
      return acc;
    }, [] as any[]);

    // Stock health
    const lowStock = stockList.filter((s: any) => Number(s.qty_on_hand ?? 0) < 10).length;
    const outOfStock = stockList.filter((s: any) => Number(s.qty_on_hand ?? 0) === 0).length;
    const healthyStock = stockList.length - lowStock;

    // Salesperson performance radar
    const salespersonData = salespersonList.map((s: any) => ({
      name: s.first_name || s.name || 'Unknown',
      sales: Number(s.total_sales || 0),
      commission: Number(s.total_commission || 0),
      orders: Number(s.order_count || 0),
    }));

    // Promo effectiveness
    const promoData = promoList.map((p: any) => ({
      name: p.name?.substring(0, 20) || 'Promo',
      used: Number(p.used_count || 0),
      active: p.is_active ? 1 : 0,
    }));

    setData({
      revenueTrend, categorySales, topProducts, paymentPie, statusPie,
      dayOfWeekTotals, hourTotals, customerGrowth, salespersonData, promoData,
      totalRevenue, totalOrders, avgOrderValue,
      customerCount: customerList.length, productCount: productList.length,
      lowStock, outOfStock, healthyStock, totalStock: stockList.length,
    });
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return (
    <div className="p-6 flex flex-col items-center justify-center h-96 gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-3 border-rose-500 border-t-transparent" />
      <p className="text-sm text-gray-400">Crunching numbers...</p>
    </div>
  );

  const d = data;
  const kpis = [
    { label: 'Total Revenue', value: formatEGP(d.totalRevenue || 0), icon: DollarSign, gradient: GRADIENT_CARDS[0] },
    { label: 'Total Orders', value: String(d.totalOrders || 0), icon: ShoppingCart, gradient: GRADIENT_CARDS[1] },
    { label: 'Avg Order Value', value: formatEGP(d.avgOrderValue || 0), icon: Target, gradient: GRADIENT_CARDS[2] },
    { label: 'Products', value: String(d.productCount || 0), icon: Package, gradient: GRADIENT_CARDS[3] },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-rose-500" />
            Advanced Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">Deep business insights & analytics</p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition',
                period === p ? 'bg-rose-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
              {p === 'all' ? 'All Time' : p.replace('d', ' Days')}
            </button>
          ))}
          <button onClick={fetchAll} className="p-2 rounded-lg border hover:bg-gray-50">
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className={cn('rounded-2xl bg-gradient-to-br text-white p-5 shadow-lg', kpi.gradient)}>
            <div className="flex items-center justify-between">
              <kpi.icon className="h-8 w-8 opacity-80" />
              <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold mt-3">{kpi.value}</p>
            <p className="text-xs opacity-80 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Row 1: Revenue Trend + Category Distribution */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-rose-500" />
            Revenue Trend
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.revenueTrend || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => [formatEGP(v), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#f43f5e" strokeWidth={2.5} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-violet-500" />
            Sales by Category
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d.categorySales || []} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={80} innerRadius={40} paddingAngle={3} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 0.5 }}>
                  {(d.categorySales || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [formatEGP(v), 'Value']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1">
            {(d.categorySales || []).slice(0, 5).map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-gray-600">{c.name}</span>
                </div>
                <span className="font-medium">{c.products} products</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Top Products + Payment Methods */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-500" />
            Top 10 Products by Value
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.topProducts || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => [formatEGP(v), 'Stock Value']} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {(d.topProducts || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-500" />
            Payment Methods
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d.paymentPie || []} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={90} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {(d.paymentPie || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [formatEGP(v), 'Revenue']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Day of Week + Peak Hours */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-500" />
            Revenue by Day of Week
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.dayOfWeekTotals || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatEGP(v)} />
                <Tooltip formatter={(v: any) => [formatEGP(v), 'Revenue']} />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                  {(d.dayOfWeekTotals || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            Peak Sales Hours
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={(d.hourTotals || []).filter((h: any) => h.orders > 0)}>
                <defs>
                  <linearGradient id="colorHour" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any, name: string) => [name === 'revenue' ? formatEGP(v) : v, name === 'revenue' ? 'Revenue' : 'Orders']} />
                <Area type="monotone" dataKey="orders" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorHour)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Stock Health + Margin Analysis */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-500" />
            Stock Health
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Healthy', value: d.healthyStock || 0 },
                    { name: 'Low Stock', value: d.lowStock || 0 },
                    { name: 'Out of Stock', value: d.outOfStock || 0 },
                  ]}
                  dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={70} innerRadius={35}
                  label={({ name, value }: any) => `${name}: ${value}`}>
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-emerald-500" /> Healthy</span>
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-amber-500" /> Low</span>
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-red-500" /> Out</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-rose-500" />
            Profit Margins (Top 10)
          </h3>
          <div className="space-y-2">
            {(d.topProducts || []).slice(0, 8).map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-24 truncate">{p.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', 
                    p.margin >= 70 ? 'bg-emerald-500' : p.margin >= 40 ? 'bg-amber-500' : 'bg-red-500')}
                    style={{ width: `${Math.min(p.margin, 100)}%` }}>
                    <span className="text-[9px] text-white font-medium pl-1">{p.margin}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-500" />
            Order Status
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d.statusPie || []} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={70} innerRadius={35}
                  label={({ name, value }: any) => `${name}: ${value}`}>
                  {(d.statusPie || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 5: Promotions Performance + Salesperson */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-pink-500" />
            Promotion Performance
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.promoData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="used" name="Times Used" fill="#ec4899" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" />
            Salesperson Performance
          </h3>
          {(d.salespersonData || []).length > 0 ? (
            <div className="space-y-3">
              {(d.salespersonData || []).map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {(s.name || '?')[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.name}</p>
                    <div className="flex gap-4 text-xs text-gray-500 mt-0.5">
                      <span>Sales: {formatEGP(s.sales)}</span>
                      <span>Commission: {formatEGP(s.commission)}</span>
                      <span>Orders: {s.orders}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No salesperson data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
