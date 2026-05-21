'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { formatEGP, cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { Search, ArrowRightLeft, AlertTriangle, ChevronDown, ChevronRight, Warehouse, Package, RefreshCw } from 'lucide-react';

// ── API response types ──────────────────────────────────────────
interface PaginatedResponse<T> {
  data: T[];
  pagination: { total: number; page: number; limit: number };
}

interface ApiStockItem {
  id: string;
  product_id?: string;
  product_name?: string;
  product?: { name: string; sku: string };
  sku?: string;
  quantity_on_hand?: number;
  on_hand?: number;
  reserved?: number;
  available?: number;
  average_cost?: number;
  avg_cost?: number;
  reorder_point?: number;
  min_quantity?: number;
  warehouse_id?: string;
  warehouse_name?: string;
  warehouse?: { name: string };
  location_name?: string;
}

interface InventoryItem {
  id: string;
  product: string;
  sku: string;
  warehouse: string;
  onHand: number;
  reserved: number;
  available: number;
  avgCost: number;
  reorderPoint: number;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('All Warehouses');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [totalStock, setTotalStock] = useState(0);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedResponse<ApiStockItem>>('/inventory/stock', { page: 1, limit: 50 });
      const items = (res?.data ?? []).map((item): InventoryItem => {
        const onHand = item.quantity_on_hand ?? item.on_hand ?? 0;
        const reserved = item.reserved ?? 0;
        return {
          id: item.id,
          product: item.product_name ?? item.product?.name ?? 'Unknown Product',
          sku: item.sku ?? item.product?.sku ?? '—',
          warehouse: item.warehouse_name ?? item.warehouse?.name ?? item.location_name ?? 'Default',
          onHand,
          reserved,
          available: item.available ?? (onHand - reserved),
          avgCost: item.average_cost ?? item.avg_cost ?? 0,
          reorderPoint: item.reorder_point ?? item.min_quantity ?? 10,
        };
      });
      setInventory(items);
      setTotalStock(res?.pagination?.total ?? items.length);
    } catch (err) {
      setError('Failed to load inventory data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Derive unique warehouses
  const warehouses = ['All Warehouses', ...Array.from(new Set(inventory.map((i) => i.warehouse)))];

  const filtered = inventory.filter((item) => {
    const matchesSearch = search === '' || item.product.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
    const matchesWarehouse = warehouseFilter === 'All Warehouses' || item.warehouse === warehouseFilter;
    return matchesSearch && matchesWarehouse;
  });

  const totalValue = filtered.reduce((sum, i) => sum + i.onHand * i.avgCost, 0);
  const lowStockCount = filtered.filter((i) => i.available <= i.reorderPoint).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '…' : `${totalStock} stock records · Total value: ${formatEGP(totalValue)}`}
          </p>
        </div>
        <button
          onClick={() => setShowTransfer(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:from-rose-600 hover:to-purple-700 transition-all"
        >
          <ArrowRightLeft className="h-4 w-4" />
          Transfer Stock
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button
            onClick={fetchInventory}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-7 w-20 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{filtered.reduce((s, i) => s + i.onHand, 0).toLocaleString()}</p>
              )}
              <p className="text-sm text-gray-500">Total Units</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Warehouse className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-7 w-28 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{formatEGP(totalValue)}</p>
              )}
              <p className="text-sm text-gray-500">Inventory Value</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-7 w-10 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
              )}
              <p className="text-sm text-gray-500">Low Stock Items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>
        <select
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
        >
          {warehouses.map((w) => <option key={w}>{w}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="w-8 px-4 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Warehouse</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">On Hand</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Reserved</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Available</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Avg Cost</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Value</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-10 ml-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-8 ml-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-10 ml-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-10 mx-auto rounded-full" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500">No stock records found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {search || warehouseFilter !== 'All Warehouses' ? 'Try changing your filters' : 'Stock data will appear as inventory is tracked'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isLow = item.available <= item.reorderPoint;
                  const isExpanded = expandedRow === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <tr className={cn('hover:bg-gray-50 transition-colors', isLow && 'bg-red-50/30')}>
                        <td className="px-4 py-3">
                          <button onClick={() => setExpandedRow(isExpanded ? null : item.id)} className="text-gray-400 hover:text-gray-600">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{item.product}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.sku}</td>
                        <td className="px-4 py-3 text-gray-600">{item.warehouse}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{item.onHand}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{item.reserved}</td>
                        <td className={cn('px-4 py-3 text-right font-medium', isLow ? 'text-red-600' : 'text-gray-900')}>{item.available}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatEGP(item.avgCost)}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{formatEGP(item.onHand * item.avgCost)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                            isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          )}>
                            {isLow ? 'Low' : 'OK'}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={10} className="px-8 py-3 bg-gray-50/80">
                            <p className="text-xs text-gray-500">
                              Reorder Point: {item.reorderPoint} units · Warehouse: {item.warehouse}
                            </p>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Transfer Stock</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500">
                  <option>Select product...</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>{item.product} ({item.sku})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500">
                    {warehouses.filter((w) => w !== 'All Warehouses').map((w) => (
                      <option key={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500">
                    {warehouses.filter((w) => w !== 'All Warehouses').map((w) => (
                      <option key={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="0" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowTransfer(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => setShowTransfer(false)} className="rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2 text-sm font-medium text-white">Transfer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
