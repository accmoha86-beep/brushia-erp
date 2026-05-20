'use client';

import Link from 'next/link';
import { formatEGP } from '@/lib/utils';
import { CircleDollarSign, ShoppingBag, Package, AlertTriangle, TrendingUp, TrendingDown, Plus, ShoppingCart, FileText, ArrowRight } from 'lucide-react';

const stats = [
  {
    label: 'Revenue Today',
    value: 1247500,
    change: '+12.5%',
    trend: 'up' as const,
    sub: 'EGP 38,420 this month',
    icon: CircleDollarSign,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    label: 'Orders Today',
    value: 23,
    change: '+8.3%',
    trend: 'up' as const,
    sub: '187 this month',
    icon: ShoppingBag,
    color: 'bg-blue-50 text-blue-600',
    isCount: true,
  },
  {
    label: 'Products in Stock',
    value: 1842,
    change: '-2.1%',
    trend: 'down' as const,
    sub: 'Across 2 warehouses',
    icon: Package,
    color: 'bg-purple-50 text-purple-600',
    isCount: true,
  },
  {
    label: 'Low Stock Alerts',
    value: 7,
    change: '+3',
    trend: 'down' as const,
    sub: 'Requires attention',
    icon: AlertTriangle,
    color: 'bg-amber-50 text-amber-600',
    isCount: true,
  },
];

const revenueData = [
  { day: 'Mon', amount: 875000 },
  { day: 'Tue', amount: 1120000 },
  { day: 'Wed', amount: 945000 },
  { day: 'Thu', amount: 1340000 },
  { day: 'Fri', amount: 1580000 },
  { day: 'Sat', amount: 1890000 },
  { day: 'Sun', amount: 1247500 },
];

const topProducts = [
  { name: 'Brushia Matte Foundation', sold: 142, revenue: 4970000 },
  { name: 'Mink Lashes - Natural', sold: 118, revenue: 1770000 },
  { name: 'Pro Brush Set (12pc)', sold: 67, revenue: 5025000 },
  { name: 'Brushia Full Coverage Concealer', sold: 95, revenue: 2375000 },
  { name: 'Matte Lipstick - Ruby Red', sold: 83, revenue: 1577000 },
];

const recentOrders = [
  { id: 'ORD-2024-1847', customer: 'Sara Ahmed', items: 3, total: 87500, status: 'confirmed', payment: 'paid', date: '2026-05-21T10:30:00' },
  { id: 'ORD-2024-1846', customer: 'Nour ElSayed', items: 1, total: 35000, status: 'shipped', payment: 'paid', date: '2026-05-21T09:45:00' },
  { id: 'ORD-2024-1845', customer: 'Fatma Hassan', items: 5, total: 142000, status: 'pending', payment: 'pending', date: '2026-05-21T09:12:00' },
  { id: 'ORD-2024-1844', customer: 'Mariam Adel', items: 2, total: 62000, status: 'delivered', payment: 'paid', date: '2026-05-20T18:30:00' },
  { id: 'ORD-2024-1843', customer: 'Yasmin Khaled', items: 4, total: 198000, status: 'confirmed', payment: 'paid', date: '2026-05-20T17:15:00' },
  { id: 'ORD-2024-1842', customer: 'Hana Mostafa', items: 1, total: 75000, status: 'shipped', payment: 'paid', date: '2026-05-20T16:00:00' },
  { id: 'ORD-2024-1841', customer: 'Aya Ibrahim', items: 6, total: 234000, status: 'delivered', payment: 'paid', date: '2026-05-20T14:20:00' },
  { id: 'ORD-2024-1840', customer: 'Dina Fawzy', items: 2, total: 47000, status: 'cancelled', payment: 'refunded', date: '2026-05-20T13:00:00' },
  { id: 'ORD-2024-1839', customer: 'Reem Gamal', items: 3, total: 105000, status: 'delivered', payment: 'paid', date: '2026-05-20T11:45:00' },
  { id: 'ORD-2024-1838', customer: 'Layla Mahmoud', items: 1, total: 15000, status: 'confirmed', payment: 'cod', date: '2026-05-20T10:30:00' },
];

const lowStockItems = [
  { name: 'Mink Lashes - Dramatic', sku: 'BRS-LSH-002', stock: 3, min: 20 },
  { name: 'Brushia Setting Powder', sku: 'BRS-PWD-001', stock: 5, min: 15 },
  { name: 'Lip Gloss - Clear Shine', sku: 'BRS-LIP-003', stock: 8, min: 25 },
  { name: 'Pro Contour Brush', sku: 'BRS-BRU-002', stock: 4, min: 10 },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function DashboardPage() {
  const maxRevenue = Math.max(...revenueData.map((d) => d.amount));

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:from-rose-600 hover:to-purple-700 transition-all"
          >
            <ShoppingCart className="h-4 w-4" />
            New Sale
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
          <Link
            href="/purchase-orders"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
          >
            <FileText className="h-4 w-4" />
            Create PO
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium ${
                    stat.trend === 'up' ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {stat.change}
                </span>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900">
                  {stat.isCount ? stat.value.toLocaleString() : formatEGP(stat.value)}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
              </div>
              <p className="text-xs text-gray-400 mt-2">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Revenue Last 7 Days</h3>
              <p className="text-sm text-gray-500 mt-0.5">Daily sales performance</p>
            </div>
            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              +18.2%
            </span>
          </div>
          <div className="flex items-end gap-2 h-48">
            {revenueData.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] font-medium text-gray-500">
                  {formatEGP(d.amount)}
                </span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-rose-500 to-purple-500 transition-all hover:from-rose-400 hover:to-purple-400"
                  style={{ height: `${(d.amount / maxRevenue) * 140}px` }}
                />
                <span className="text-xs font-medium text-gray-500">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Top Selling Products</h3>
              <p className="text-sm text-gray-500 mt-0.5">This month&apos;s best sellers</p>
            </div>
            <Link href="/reports" className="text-sm text-rose-500 hover:text-rose-600 font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {topProducts.map((product, idx) => (
              <div key={product.name} className="flex items-center gap-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.sold} units sold</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatEGP(product.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Recent Orders</h3>
              <p className="text-sm text-gray-500 mt-0.5">Latest 10 orders</p>
            </div>
            <Link
              href="/orders"
              className="inline-flex items-center gap-1 text-sm text-rose-500 hover:text-rose-600 font-medium"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Customer</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-500">Items</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Total</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <span className="font-medium text-gray-900">{order.id}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{order.customer}</td>
                    <td className="px-6 py-3 text-center text-gray-600">{order.items}</td>
                    <td className="px-6 py-3 text-right font-medium text-gray-900">
                      {formatEGP(order.total)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusColors[order.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Low Stock Alerts</h3>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
              {lowStockItems.length}
            </span>
          </div>
          <div className="space-y-4">
            {lowStockItems.map((item) => (
              <div key={item.sku} className="p-3 rounded-lg bg-red-50/50 border border-red-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <span className="text-xs font-bold text-red-600">{item.stock} left</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{item.sku} · Min: {item.min}</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-red-100">
                  <div
                    className="h-1.5 rounded-full bg-red-500"
                    style={{ width: `${Math.min((item.stock / item.min) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/inventory"
            className="mt-4 flex items-center justify-center gap-1 text-sm font-medium text-rose-500 hover:text-rose-600"
          >
            View Inventory <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
