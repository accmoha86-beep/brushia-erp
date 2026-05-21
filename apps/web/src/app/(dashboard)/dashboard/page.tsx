'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatEGP } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { CircleDollarSign, ShoppingBag, Package, AlertTriangle, TrendingUp, TrendingDown, Plus, ShoppingCart, FileText, ArrowRight, RefreshCw } from 'lucide-react';

// ── API response types ──────────────────────────────────────────
interface PaginatedResponse<T> {
  data: T[];
  pagination: { total: number; page: number; limit: number };
}

interface ApiCategory {
  id: string;
  name: string;
  name_ar?: string;
  slug: string;
  sort_order?: number;
  product_count?: number;
  child_count?: number;
}

interface ApiProduct {
  id: string;
  sku: string;
  name: string;
  category_id?: string;
  base_price: number;
  cost_price: number;
  status: string;
}

interface ApiStockItem {
  id: string;
  product_id?: string;
  product_name?: string;
  product?: { name: string; sku: string };
  sku?: string;
  quantity_on_hand?: number;
  on_hand?: number;
  available?: number;
  reorder_point?: number;
  min_quantity?: number;
  warehouse_name?: string;
  warehouse?: { name: string };
}

interface ApiOrder {
  id: string;
  order_number?: string;
  customer_name?: string;
  customer?: { name: string };
  items_count?: number;
  total_amount?: number;
  total?: number;
  status: string;
  payment_status?: string;
  created_at?: string;
}

interface ApiAccount {
  id: string;
  name: string;
  code: string;
  type: string;
  balance?: number;
}

// ── Static revenue chart data (no API yet) ──────────────────────
const revenueData = [
  { day: 'Mon', amount: 875000 },
  { day: 'Tue', amount: 1120000 },
  { day: 'Wed', amount: 945000 },
  { day: 'Thu', amount: 1340000 },
  { day: 'Fri', amount: 1580000 },
  { day: 'Sat', amount: 1890000 },
  { day: 'Sun', amount: 1247500 },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-blue-100 text-blue-700',
  draft: 'bg-gray-100 text-gray-700',
};

// ── Skeleton component ──────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productsTotal, setProductsTotal] = useState(0);
  const [categoriesTotal, setCategoriesTotal] = useState(0);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [recentOrders, setRecentOrders] = useState<ApiOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<ApiStockItem[]>([]);
  const [topProducts, setTopProducts] = useState<ApiProduct[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        api.get<PaginatedResponse<ApiProduct>>('/catalog/products', { limit: 5 }),
        api.get<ApiCategory[]>('/catalog/categories'),
        api.get<PaginatedResponse<ApiStockItem>>('/inventory/stock', { limit: 50 }),
        api.get<PaginatedResponse<ApiOrder>>('/sales/orders', { limit: 10 }),
        api.get<ApiAccount[]>('/accounting/accounts'),
      ]);

      // Products
      if (results[0].status === 'fulfilled') {
        const prodRes = results[0].value;
        setProductsTotal(prodRes?.pagination?.total ?? prodRes?.data?.length ?? 0);
        setTopProducts(prodRes?.data ?? []);
      }

      // Categories
      if (results[1].status === 'fulfilled') {
        const cats = results[1].value;
        setCategoriesTotal(Array.isArray(cats) ? cats.length : 0);
      }

      // Stock → find low stock
      if (results[2].status === 'fulfilled') {
        const stockRes = results[2].value;
        const allStock = stockRes?.data ?? [];
        const low = allStock.filter((item) => {
          const qty = item.quantity_on_hand ?? item.on_hand ?? item.available ?? 0;
          const minQty = item.reorder_point ?? item.min_quantity ?? 10;
          return qty <= minQty;
        });
        setLowStockItems(low.slice(0, 5));
      }

      // Orders
      if (results[3].status === 'fulfilled') {
        const orderRes = results[3].value;
        setOrdersTotal(orderRes?.pagination?.total ?? orderRes?.data?.length ?? 0);
        setRecentOrders(orderRes?.data ?? []);
      }
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const maxRevenue = Math.max(...revenueData.map((d) => d.amount));

  const stats = [
    {
      label: 'Revenue Today',
      value: 0,
      change: '—',
      trend: 'up' as const,
      sub: 'Revenue tracking coming soon',
      icon: CircleDollarSign,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Total Orders',
      value: ordersTotal,
      change: ordersTotal > 0 ? `${ordersTotal}` : '0',
      trend: 'up' as const,
      sub: `${recentOrders.length} shown below`,
      icon: ShoppingBag,
      color: 'bg-blue-50 text-blue-600',
      isCount: true,
    },
    {
      label: 'Products in Catalog',
      value: productsTotal,
      change: `${categoriesTotal} categories`,
      trend: 'up' as const,
      sub: `Across ${categoriesTotal} categories`,
      icon: Package,
      color: 'bg-purple-50 text-purple-600',
      isCount: true,
    },
    {
      label: 'Low Stock Alerts',
      value: lowStockItems.length,
      change: lowStockItems.length > 0 ? `${lowStockItems.length}` : '0',
      trend: lowStockItems.length > 0 ? ('down' as const) : ('up' as const),
      sub: lowStockItems.length > 0 ? 'Requires attention' : 'All stock levels OK',
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-600',
      isCount: true,
    },
  ];

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center max-w-md">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.isCount ? stat.value.toLocaleString() : formatEGP(stat.value)}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
              </div>
              <p className="text-xs text-gray-400 mt-2">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart (static — Coming Soon) */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Revenue Last 7 Days</h3>
              <p className="text-sm text-gray-500 mt-0.5">Daily sales performance</p>
            </div>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
              📊 Coming Soon
            </span>
          </div>
          <div className="flex items-end gap-2 h-48 opacity-40">
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
          <p className="text-center text-xs text-gray-400 mt-4">
            Sample data — Live revenue tracking will be available soon
          </p>
        </div>

        {/* Top products from catalog */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Products in Catalog</h3>
              <p className="text-sm text-gray-500 mt-0.5">Recently added products</p>
            </div>
            <Link href="/products" className="text-sm text-rose-500 hover:text-rose-600 font-medium">
              View All
            </Link>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Package className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm font-medium">No products yet</p>
              <p className="text-xs mt-1">Add products to see them here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, idx) => (
                <div key={product.id} className="flex items-center gap-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sku}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatEGP(product.base_price)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Recent Orders</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {recentOrders.length > 0 ? `Latest ${recentOrders.length} orders` : 'No orders yet'}
              </p>
            </div>
            <Link
              href="/orders"
              className="inline-flex items-center gap-1 text-sm text-rose-500 hover:text-rose-600 font-medium"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="px-6 pb-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <ShoppingBag className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm font-medium">No orders yet</p>
                <p className="text-xs mt-1">Orders will appear here once placed</p>
              </div>
            ) : (
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
                        <span className="font-medium text-gray-900">
                          {order.order_number || order.id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {order.customer_name || order.customer?.name || '—'}
                      </td>
                      <td className="px-6 py-3 text-center text-gray-600">
                        {order.items_count ?? '—'}
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-gray-900">
                        {formatEGP(order.total_amount ?? order.total ?? 0)}
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
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Low Stock Alerts</h3>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
              {loading ? '…' : lowStockItems.length}
            </span>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-lg bg-gray-50">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-2" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Package className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm font-medium">All stock levels OK</p>
              <p className="text-xs mt-1">No items below reorder point</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lowStockItems.map((item) => {
                const qty = item.quantity_on_hand ?? item.on_hand ?? item.available ?? 0;
                const minQty = item.reorder_point ?? item.min_quantity ?? 10;
                const name = item.product_name ?? item.product?.name ?? 'Unknown Product';
                const sku = item.sku ?? item.product?.sku ?? '';
                return (
                  <div key={item.id} className="p-3 rounded-lg bg-red-50/50 border border-red-100">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{name}</p>
                      <span className="text-xs font-bold text-red-600">{qty} left</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{sku} · Min: {minQty}</p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-red-100">
                      <div
                        className="h-1.5 rounded-full bg-red-500"
                        style={{ width: `${Math.min((qty / minQty) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
