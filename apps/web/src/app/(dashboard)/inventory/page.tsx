'use client';

import React, { useState, useMemo } from 'react';
import { formatEGP, cn } from '@/lib/utils';
import { Search, Filter, ArrowRightLeft, AlertTriangle, ChevronDown, ChevronRight, Warehouse, Package, TrendingDown, TrendingUp } from 'lucide-react';

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
  movements?: { date: string; type: string; qty: number; note: string }[];
}

const inventory: InventoryItem[] = [
  { id: '1', product: 'Brushia Matte Foundation - Light', sku: 'BRS-FND-001', warehouse: 'Main Warehouse', onHand: 120, reserved: 8, available: 112, avgCost: 18000, reorderPoint: 30, movements: [
    { date: '2026-05-20', type: 'sale', qty: -3, note: 'Order ORD-2024-1846' },
    { date: '2026-05-19', type: 'receipt', qty: 50, note: 'PO-2024-089' },
    { date: '2026-05-18', type: 'sale', qty: -5, note: 'Order ORD-2024-1835' },
  ]},
  { id: '2', product: 'Brushia Matte Foundation - Light', sku: 'BRS-FND-001', warehouse: 'Showroom', onHand: 25, reserved: 2, available: 23, avgCost: 18000, reorderPoint: 10 },
  { id: '3', product: 'Brushia Full Coverage Concealer', sku: 'BRS-CON-001', warehouse: 'Main Warehouse', onHand: 180, reserved: 12, available: 168, avgCost: 12000, reorderPoint: 40 },
  { id: '4', product: 'Brushia Full Coverage Concealer', sku: 'BRS-CON-001', warehouse: 'Showroom', onHand: 30, reserved: 0, available: 30, avgCost: 12000, reorderPoint: 10 },
  { id: '5', product: 'Mink Lashes - Natural', sku: 'BRS-LSH-001', warehouse: 'Main Warehouse', onHand: 280, reserved: 15, available: 265, avgCost: 5000, reorderPoint: 50 },
  { id: '6', product: 'Mink Lashes - Dramatic', sku: 'BRS-LSH-002', warehouse: 'Main Warehouse', onHand: 3, reserved: 1, available: 2, avgCost: 6000, reorderPoint: 20 },
  { id: '7', product: 'Brushia Setting Powder', sku: 'BRS-PWD-001', warehouse: 'Main Warehouse', onHand: 5, reserved: 2, available: 3, avgCost: 14000, reorderPoint: 15 },
  { id: '8', product: 'Pro Foundation Brush', sku: 'BRS-BRU-001', warehouse: 'Main Warehouse', onHand: 72, reserved: 4, available: 68, avgCost: 5000, reorderPoint: 15 },
  { id: '9', product: 'Pro Contour Brush', sku: 'BRS-BRU-002', warehouse: 'Main Warehouse', onHand: 4, reserved: 0, available: 4, avgCost: 4500, reorderPoint: 10 },
  { id: '10', product: 'Pro Brush Set (12pc)', sku: 'BRS-SET-002', warehouse: 'Main Warehouse', onHand: 18, reserved: 3, available: 15, avgCost: 35000, reorderPoint: 8 },
  { id: '11', product: 'Matte Lipstick - Ruby Red', sku: 'BRS-LIP-001', warehouse: 'Main Warehouse', onHand: 130, reserved: 6, available: 124, avgCost: 7500, reorderPoint: 25 },
  { id: '12', product: 'Matte Lipstick - Ruby Red', sku: 'BRS-LIP-001', warehouse: 'Showroom', onHand: 26, reserved: 1, available: 25, avgCost: 7500, reorderPoint: 8 },
  { id: '13', product: 'Lip Gloss - Clear Shine', sku: 'BRS-LIP-003', warehouse: 'Main Warehouse', onHand: 8, reserved: 3, available: 5, avgCost: 5500, reorderPoint: 25 },
  { id: '14', product: 'Brushia Eyeshadow Palette', sku: 'BRS-EYE-001', warehouse: 'Main Warehouse', onHand: 38, reserved: 2, available: 36, avgCost: 20000, reorderPoint: 10 },
  { id: '15', product: 'Brushia Mascara - Volume Max', sku: 'BRS-EYE-002', warehouse: 'Main Warehouse', onHand: 145, reserved: 8, available: 137, avgCost: 7000, reorderPoint: 30 },
  { id: '16', product: 'Essential Brush Set (8pc)', sku: 'BRS-SET-001', warehouse: 'Main Warehouse', onHand: 28, reserved: 2, available: 26, avgCost: 22000, reorderPoint: 8 },
];

const warehouses = ['All Warehouses', 'Main Warehouse', 'Showroom'];

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('All Warehouses');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);

  const filtered = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch = search === '' || item.product.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
      const matchesWarehouse = warehouseFilter === 'All Warehouses' || item.warehouse === warehouseFilter;
      return matchesSearch && matchesWarehouse;
    });
  }, [search, warehouseFilter]);

  const totalValue = filtered.reduce((sum, i) => sum + i.onHand * i.avgCost, 0);
  const lowStockCount = filtered.filter((i) => i.available <= i.reorderPoint).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} stock records · Total value: {formatEGP(totalValue)}
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{filtered.reduce((s, i) => s + i.onHand, 0).toLocaleString()}</p>
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
              <p className="text-2xl font-bold text-gray-900">{formatEGP(totalValue)}</p>
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
              <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
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
              {filtered.map((item) => {
                const isLow = item.available <= item.reorderPoint;
                const isExpanded = expandedRow === item.id;
                return (
                  <React.Fragment key={item.id}>
                    <tr className={cn('hover:bg-gray-50 transition-colors', isLow && 'bg-red-50/30')}>
                      <td className="px-4 py-3">
                        {item.movements && (
                          <button onClick={() => setExpandedRow(isExpanded ? null : item.id)} className="text-gray-400 hover:text-gray-600">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        )}
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
                    {isExpanded && item.movements && (
                      <tr>
                        <td colSpan={10} className="px-8 py-3 bg-gray-50/80">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Movements</p>
                          <div className="space-y-1.5">
                            {item.movements.map((m, i) => (
                              <div key={i} className="flex items-center gap-3 text-sm">
                                {m.qty > 0 ? (
                                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                                )}
                                <span className="text-gray-500 w-20">{m.date}</span>
                                <span className={cn('font-medium w-12 text-right', m.qty > 0 ? 'text-emerald-600' : 'text-red-600')}>
                                  {m.qty > 0 ? `+${m.qty}` : m.qty}
                                </span>
                                <span className="text-gray-500 capitalize">{m.type}</span>
                                <span className="text-gray-400">— {m.note}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
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
                  <option>Brushia Matte Foundation - Light</option>
                  <option>Mink Lashes - Natural</option>
                  <option>Pro Foundation Brush</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500">
                    <option>Main Warehouse</option>
                    <option>Showroom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500">
                    <option>Showroom</option>
                    <option>Main Warehouse</option>
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
