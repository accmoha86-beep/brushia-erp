'use client';

import { useEffect, useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api-client';
import { formatEGP, cn } from '@/lib/utils';
import {
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calculator,
  Ship,
  FileBox,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';

type Tab = 'products' | 'purchase-orders' | 'analysis';

interface Product {
  id: string;
  name: string;
  sku: string;
  base_price: number;
  cost_price: number;
  category?: string;
  category_name?: string;
}

interface StockLevel {
  product_id: string;
  quantity: number;
  weighted_avg_cost: number;
}

interface POItem {
  id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  quantity: number;
  unit_cost: number;
}

interface PurchaseOrder {
  id: string;
  order_number?: string;
  vendor_name?: string;
  vendor?: { name: string };
  status: string;
  items: POItem[];
  shipping_cost: number;
  customs_duty: number;
  created_at: string;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Icon className={cn('w-4 h-4', accent ? 'text-rose-400' : 'text-gray-500')} />
        {label}
      </div>
      <div className={cn('text-2xl font-bold', accent ? 'text-rose-400' : 'text-white')}>
        {value}
      </div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

// ─── Margin Badge ────────────────────────────────────────────────────────────

function MarginBadge({ value }: { value: number }) {
  const color =
    value >= 30
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : value >= 15
        ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
        : 'bg-red-500/15 text-red-400 border-red-500/30';
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border', color)}>
      {value >= 30 ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : value < 15 ? (
        <ArrowDownRight className="w-3 h-3" />
      ) : null}
      {value.toFixed(1)}%
    </span>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? '';
  const color = s.includes('complete') || s.includes('received')
    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : s.includes('pending') || s.includes('draft')
      ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
      : s.includes('cancel')
        ? 'bg-red-500/15 text-red-400 border-red-500/30'
        : 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border capitalize', color)}>
      {status}
    </span>
  );
}

// ─── Tab 1: Product Costs ────────────────────────────────────────────────────

function ProductCostsTab({
  products,
  stockMap,
}: {
  products: Product[];
  stockMap: Map<string, StockLevel>;
}) {
  const { t, locale, isRTL } = useI18n();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'margin_pct' | 'wac' | 'base_price'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const rows = useMemo(() => {
    return products.map((p) => {
      const stock = stockMap.get(p.id);
      const wac = stock ? stock.weighted_avg_cost / 100 : p.cost_price / 100;
      const basePrice = p.base_price / 100;
      const margin = basePrice - wac;
      const marginPct = basePrice > 0 ? (margin / basePrice) * 100 : 0;
      const qty = stock?.quantity ?? 0;
      const inventoryValue = wac * qty;
      return { ...p, wac, basePrice, margin, marginPct, qty, inventoryValue };
    });
  }, [products, stockMap]);

  const filtered = useMemo(() => {
    let list = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.sku?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = (a.name ?? '').localeCompare(b.name ?? '');
      else if (sortKey === 'margin_pct') cmp = a.marginPct - b.marginPct;
      else if (sortKey === 'wac') cmp = a.wac - b.wac;
      else if (sortKey === 'base_price') cmp = a.basePrice - b.basePrice;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [rows, search, sortKey, sortDir]);

  const totalInventoryValue = useMemo(
    () => rows.reduce((sum, r) => sum + r.inventoryValue, 0),
    [rows]
  );

  const avgMargin = useMemo(() => {
    const valid = rows.filter((r) => r.basePrice > 0);
    if (!valid.length) return 0;
    return valid.reduce((s, r) => s + r.marginPct, 0) / valid.length;
  }, [rows]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const SortIcon = ({ col }: { col: typeof sortKey }) =>
    sortKey === col ? (
      <span className="ml-1 text-rose-400">{sortDir === 'asc' ? '↑' : '↓'}</span>
    ) : null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Inventory Value"
          value={formatEGP(totalInventoryValue)}
          sub={`${rows.length} products tracked`}
          accent
        />
        <StatCard
          icon={Percent}
          label="Average Margin"
          value={`${avgMargin.toFixed(1)}%`}
          sub="Across all products"
        />
        <StatCard
          icon={Package}
          label="Products Below 15% Margin"
          value={String(rows.filter((r) => r.marginPct < 15).length)}
          sub="Needs attention"
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search products by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/40"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th
                  className="px-4 py-3 font-medium cursor-pointer hover:text-white"
                  onClick={() => toggleSort('name')}
                >
                  Product <SortIcon col="name" />
                </th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th
                  className="px-4 py-3 font-medium text-right cursor-pointer hover:text-white"
                  onClick={() => toggleSort('base_price')}
                >
                  Base Price <SortIcon col="base_price" />
                </th>
                <th className="px-4 py-3 font-medium text-right">Cost Price</th>
                <th
                  className="px-4 py-3 font-medium text-right cursor-pointer hover:text-white"
                  onClick={() => toggleSort('wac')}
                >
                  WAC <SortIcon col="wac" />
                </th>
                <th className="px-4 py-3 font-medium text-right">Margin</th>
                <th
                  className="px-4 py-3 font-medium text-right cursor-pointer hover:text-white"
                  onClick={() => toggleSort('margin_pct')}
                >
                  Margin % <SortIcon col="margin_pct" />
                </th>
                <th className="px-4 py-3 font-medium text-right">Stock Qty</th>
                <th className="px-4 py-3 font-medium text-right">Inv. Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-white">{r.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{r.sku}</td>
                  <td className="px-4 py-3 text-right text-white">{formatEGP(r.basePrice)}</td>
                  <td className="px-4 py-3 text-right text-gray-400">
                    {formatEGP(r.cost_price / 100)}
                  </td>
                  <td className="px-4 py-3 text-right text-rose-400 font-medium">
                    {formatEGP(r.wac)}
                  </td>
                  <td className="px-4 py-3 text-right text-white">{formatEGP(r.margin)}</td>
                  <td className="px-4 py-3 text-right">
                    <MarginBadge value={r.marginPct} />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">{r.qty.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {formatEGP(r.inventoryValue)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-xs text-gray-500 text-right">
        Showing {filtered.length} of {rows.length} products
      </div>
    </div>
  );
}

// ─── Tab 2: Purchase Order Costs ─────────────────────────────────────────────

function PurchaseOrderCostsTab({ orders }: { orders: PurchaseOrder[] }) {
  const { t } = useI18n();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'date' | 'landed' | 'per_unit'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const rows = useMemo(() => {
    return orders.map((po) => {
      const subtotal = (po.items ?? []).reduce(
        (s, item) => s + (item.unit_cost / 100) * item.quantity,
        0
      );
      const totalUnits = (po.items ?? []).reduce((s, item) => s + item.quantity, 0);
      const shipping = (po.shipping_cost ?? 0) / 100;
      const customs = (po.customs_duty ?? 0) / 100;
      const landedTotal = subtotal + shipping + customs;
      const perUnit = totalUnits > 0 ? landedTotal / totalUnits : 0;
      const vendorName = po.vendor_name ?? po.vendor?.name ?? 'Unknown';
      return { ...po, subtotal, totalUnits, shipping, customs, landedTotal, perUnit, vendorName };
    });
  }, [orders]);

  const totalPOValue = useMemo(() => rows.reduce((s, r) => s + r.landedTotal, 0), [rows]);
  const avgLandedMarkup = useMemo(() => {
    const valid = rows.filter((r) => r.subtotal > 0);
    if (!valid.length) return 0;
    return (
      valid.reduce((s, r) => s + ((r.landedTotal - r.subtotal) / r.subtotal) * 100, 0) /
      valid.length
    );
  }, [rows]);
  const totalDuties = useMemo(() => rows.reduce((s, r) => s + r.customs, 0), [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          (r.order_number ?? r.id).toLowerCase().includes(q) ||
          r.vendorName.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date')
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortKey === 'landed') cmp = a.landedTotal - b.landedTotal;
      else if (sortKey === 'per_unit') cmp = a.perUnit - b.perUnit;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [rows, search, sortKey, sortDir]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const SortIcon = ({ col }: { col: typeof sortKey }) =>
    sortKey === col ? (
      <span className="ml-1 text-rose-400">{sortDir === 'asc' ? '↑' : '↓'}</span>
    ) : null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total PO Value (Landed)"
          value={formatEGP(totalPOValue)}
          sub={`${orders.length} purchase orders`}
          accent
        />
        <StatCard
          icon={Ship}
          label="Avg Landed Cost Markup"
          value={`${avgLandedMarkup.toFixed(1)}%`}
          sub="Shipping + Customs overhead"
        />
        <StatCard
          icon={FileBox}
          label="Total Customs Duties Paid"
          value={formatEGP(totalDuties)}
          sub="All-time duties"
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search by PO number or vendor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/40"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3 font-medium">PO #</th>
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">{t('common.status')}</th>
                <th className="px-4 py-3 font-medium text-right">Subtotal</th>
                <th className="px-4 py-3 font-medium text-right">Shipping</th>
                <th className="px-4 py-3 font-medium text-right">Customs</th>
                <th
                  className="px-4 py-3 font-medium text-right cursor-pointer hover:text-white"
                  onClick={() => toggleSort('landed')}
                >
                  Landed Total <SortIcon col="landed" />
                </th>
                <th
                  className="px-4 py-3 font-medium text-right cursor-pointer hover:text-white"
                  onClick={() => toggleSort('per_unit')}
                >
                  Per Unit <SortIcon col="per_unit" />
                </th>
                <th
                  className="px-4 py-3 font-medium text-right cursor-pointer hover:text-white"
                  onClick={() => toggleSort('date')}
                >
                  Date <SortIcon col="date" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isExpanded = expandedId === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr
                      className="border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    >
                      <td className="px-4 py-3 text-gray-500">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-rose-400 font-medium">
                        {r.order_number ?? r.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-white">{r.vendorName}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {formatEGP(r.subtotal)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {formatEGP(r.shipping)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {formatEGP(r.customs)}
                      </td>
                      <td className="px-4 py-3 text-right text-white font-medium">
                        {formatEGP(r.landedTotal)}
                      </td>
                      <td className="px-4 py-3 text-right text-rose-400 font-medium">
                        {formatEGP(r.perUnit)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 text-xs">
                        {new Date(r.created_at).toLocaleDateString('en-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-800/30">
                        <td colSpan={10} className="px-6 py-4">
                          <div className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wider">
                            Item Cost Breakdown
                          </div>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-500 text-left">
                                <th className="pb-2 font-medium">Product</th>
                                <th className="pb-2 font-medium">SKU</th>
                                <th className="pb-2 font-medium text-right">Qty</th>
                                <th className="pb-2 font-medium text-right">Unit Cost</th>
                                <th className="pb-2 font-medium text-right">Line Total</th>
                                <th className="pb-2 font-medium text-right">+ Shipping Alloc</th>
                                <th className="pb-2 font-medium text-right">+ Customs Alloc</th>
                                <th className="pb-2 font-medium text-right">Landed / Unit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(r.items ?? []).map((item, idx) => {
                                const lineTotal = (item.unit_cost / 100) * item.quantity;
                                const share =
                                  r.subtotal > 0 ? lineTotal / r.subtotal : 0;
                                const shippingAlloc = r.shipping * share;
                                const customsAlloc = r.customs * share;
                                const landedPerUnit =
                                  item.quantity > 0
                                    ? (lineTotal + shippingAlloc + customsAlloc) / item.quantity
                                    : 0;
                                return (
                                  <tr
                                    key={item.id ?? idx}
                                    className="border-t border-gray-700/40 text-gray-300"
                                  >
                                    <td className="py-2">
                                      {item.product_name ?? '—'}
                                    </td>
                                    <td className="py-2 font-mono text-gray-500">
                                      {item.sku ?? '—'}
                                    </td>
                                    <td className="py-2 text-right">{item.quantity}</td>
                                    <td className="py-2 text-right">
                                      {formatEGP(item.unit_cost / 100)}
                                    </td>
                                    <td className="py-2 text-right">{formatEGP(lineTotal)}</td>
                                    <td className="py-2 text-right text-gray-500">
                                      {formatEGP(shippingAlloc)}
                                    </td>
                                    <td className="py-2 text-right text-gray-500">
                                      {formatEGP(customsAlloc)}
                                    </td>
                                    <td className="py-2 text-right text-rose-400 font-medium">
                                      {formatEGP(landedPerUnit)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                    No purchase orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 3: Cost Analysis ────────────────────────────────────────────────────

function CostAnalysisTab({
  products,
  stockMap,
  orders,
}: {
  products: Product[];
  stockMap: Map<string, StockLevel>;
  orders: PurchaseOrder[];
}) {
  const enriched = useMemo(() => {
    return products.map((p) => {
      const stock = stockMap.get(p.id);
      const wac = stock ? stock.weighted_avg_cost / 100 : p.cost_price / 100;
      const basePrice = p.base_price / 100;
      const margin = basePrice - wac;
      const marginPct = basePrice > 0 ? (margin / basePrice) * 100 : 0;
      const qty = stock?.quantity ?? 0;
      const inventoryValue = wac * qty;
      const category = p.category_name ?? p.category ?? 'Uncategorized';
      return { ...p, wac, basePrice, margin, marginPct, qty, inventoryValue, categoryLabel: category };
    });
  }, [products, stockMap]);

  const avgMargin = useMemo(() => {
    const valid = enriched.filter((r) => r.basePrice > 0);
    if (!valid.length) return 0;
    return valid.reduce((s, r) => s + r.marginPct, 0) / valid.length;
  }, [enriched]);

  const sorted = useMemo(() => [...enriched].sort((a, b) => b.marginPct - a.marginPct), [enriched]);
  const top5 = sorted.slice(0, 5);
  const bottom5 = [...sorted].reverse().slice(0, 5);

  const categoryValues = useMemo(() => {
    const map = new Map<string, { value: number; count: number }>();
    enriched.forEach((r) => {
      const entry = map.get(r.categoryLabel) ?? { value: 0, count: 0 };
      entry.value += r.inventoryValue;
      entry.count += 1;
      map.set(r.categoryLabel, entry);
    });
    return [...map.entries()]
      .map(([cat, d]) => ({ category: cat, ...d }))
      .sort((a, b) => b.value - a.value);
  }, [enriched]);

  const recentPOs = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((po) => {
        const subtotal = (po.items ?? []).reduce(
          (s, i) => s + (i.unit_cost / 100) * i.quantity,
          0
        );
        const totalUnits = (po.items ?? []).reduce((s, i) => s + i.quantity, 0);
        const shipping = (po.shipping_cost ?? 0) / 100;
        const customs = (po.customs_duty ?? 0) / 100;
        const landedTotal = subtotal + shipping + customs;
        const perUnit = totalUnits > 0 ? landedTotal / totalUnits : 0;
        return {
          id: po.id,
          orderNumber: po.order_number ?? po.id.slice(0, 8),
          date: po.created_at,
          perUnit,
          landedTotal,
          totalUnits,
        };
      });
  }, [orders]);

  const totalInventoryValue = enriched.reduce((s, r) => s + r.inventoryValue, 0);
  const maxCatValue = categoryValues.length > 0 ? categoryValues[0].value : 1;

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          icon={Percent}
          label="Average Margin %"
          value={`${avgMargin.toFixed(1)}%`}
          sub="All products"
          accent
        />
        <StatCard
          icon={DollarSign}
          label="Total Inventory Value"
          value={formatEGP(totalInventoryValue)}
          sub={`${enriched.length} products`}
        />
        <StatCard
          icon={TrendingUp}
          label="Best Margin"
          value={top5[0] ? `${top5[0].marginPct.toFixed(1)}%` : '—'}
          sub={top5[0]?.name ?? '—'}
        />
        <StatCard
          icon={TrendingDown}
          label="Worst Margin"
          value={bottom5[0] ? `${bottom5[0].marginPct.toFixed(1)}%` : '—'}
          sub={bottom5[0]?.name ?? '—'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Highest Margin */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-white font-semibold text-sm">Highest Margin Products</h3>
          </div>
          <div className="space-y-3">
            {top5.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-600 w-5">{i + 1}</span>
                  <div>
                    <div className="text-sm text-white font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500">
                      WAC: {formatEGP(p.wac)} → Sell: {formatEGP(p.basePrice)}
                    </div>
                  </div>
                </div>
                <MarginBadge value={p.marginPct} />
              </div>
            ))}
          </div>
        </div>

        {/* Lowest Margin */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <h3 className="text-white font-semibold text-sm">Lowest Margin Products</h3>
            <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full">
              Attention
            </span>
          </div>
          <div className="space-y-3">
            {bottom5.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-600 w-5">{i + 1}</span>
                  <div>
                    <div className="text-sm text-white font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500">
                      WAC: {formatEGP(p.wac)} → Sell: {formatEGP(p.basePrice)}
                    </div>
                  </div>
                </div>
                <MarginBadge value={p.marginPct} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Trend Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-rose-400" />
          <h3 className="text-white font-semibold text-sm">Recent PO Cost Trend</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left border-b border-gray-800">
                <th className="pb-2 pr-4 font-medium">PO #</th>
                <th className="pb-2 pr-4 font-medium">Date</th>
                <th className="pb-2 pr-4 font-medium text-right">Units</th>
                <th className="pb-2 pr-4 font-medium text-right">Landed Total</th>
                <th className="pb-2 font-medium text-right">Cost / Unit</th>
                <th className="pb-2 font-medium text-right w-32">Trend</th>
              </tr>
            </thead>
            <tbody>
              {recentPOs.map((po, idx) => {
                const prev = recentPOs[idx + 1];
                const diff = prev ? po.perUnit - prev.perUnit : 0;
                const up = diff > 0;
                return (
                  <tr key={po.id} className="border-b border-gray-800/40">
                    <td className="py-2 pr-4 font-mono text-xs text-rose-400">
                      {po.orderNumber}
                    </td>
                    <td className="py-2 pr-4 text-gray-400 text-xs">
                      {new Date(po.date).toLocaleDateString('en-EG', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-2 pr-4 text-right text-gray-300">{po.totalUnits}</td>
                    <td className="py-2 pr-4 text-right text-gray-300">
                      {formatEGP(po.landedTotal)}
                    </td>
                    <td className="py-2 pr-4 text-right text-white font-medium">
                      {formatEGP(po.perUnit)}
                    </td>
                    <td className="py-2 text-right">
                      {prev ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-xs font-medium',
                            up ? 'text-red-400' : 'text-emerald-400'
                          )}
                        >
                          {up ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {up ? '+' : ''}
                          {formatEGP(diff)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {recentPOs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No purchase orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Value by Category */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-4 h-4 text-rose-400" />
          <h3 className="text-white font-semibold text-sm">Inventory Value by Category</h3>
        </div>
        <div className="space-y-3">
          {categoryValues.map((cat) => (
            <div key={cat.category}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-gray-300">{cat.category}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{cat.count} products</span>
                  <span className="text-white font-medium">{formatEGP(cat.value)}</span>
                </div>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all"
                  style={{
                    width: `${maxCatValue > 0 ? (cat.value / maxCatValue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
          {categoryValues.length === 0 && (
            <div className="py-6 text-center text-gray-500 text-sm">No data available.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Fragment import ─────────────────────────────────────────────────────────

import { Fragment } from 'react';

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CostTrackingPage() {
  const [tab, setTab] = useState<Tab>('products');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [productsRes, stockRes, ordersRes] = await Promise.all([
          api.get<any>('/catalog/products?limit=200'),
          api.get<any>('/inventory/stock'),
          api.get<any>('/purchasing/orders'),
        ]);
        setProducts(productsRes?.data ?? productsRes?.products ?? productsRes ?? []);
        setStockLevels(stockRes?.data ?? stockRes?.stock_levels ?? stockRes ?? []);
        setOrders(ordersRes?.data ?? ordersRes?.orders ?? ordersRes ?? []);
      } catch (err) {
        console.error('Failed to load cost tracking data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stockMap = useMemo(() => {
    const m = new Map<string, StockLevel>();
    (Array.isArray(stockLevels) ? stockLevels : []).forEach((s) => m.set(s.product_id, s));
    return m;
  }, [stockLevels]);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'products', label: 'Product Costs', icon: Package },
    { id: 'purchase-orders', label: 'Purchase Order Costs', icon: Ship },
    { id: 'analysis', label: 'Cost Analysis', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <Calculator className="w-6 h-6 text-rose-400" />
              </div>
              Cost Tracking &amp; Landed Costs
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Monitor product costs, purchase order landed costs, and margin analysis
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-8 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                tab === t.id
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
            <span className="ml-3 text-gray-400">Loading cost data...</span>
          </div>
        ) : (
          <>
            {tab === 'products' && (
              <ProductCostsTab products={products} stockMap={stockMap} />
            )}
            {tab === 'purchase-orders' && <PurchaseOrderCostsTab orders={orders} />}
            {tab === 'analysis' && (
              <CostAnalysisTab products={products} stockMap={stockMap} orders={orders} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
