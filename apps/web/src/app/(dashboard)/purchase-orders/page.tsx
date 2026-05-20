'use client';

import { useState, useMemo } from 'react';
import { formatEGP, formatDate, cn } from '@/lib/utils';
import { Plus, Search, Eye, X, ChevronRight } from 'lucide-react';

interface POItem {
  product: string;
  qty: number;
  unitCost: number;
  total: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: string;
  date: string;
  expectedDate: string;
  status: 'draft' | 'sent' | 'partial_received' | 'received' | 'cancelled';
  items: POItem[];
  subtotal: number;
  shippingCost: number;
  customsDuty: number;
  landedCost: number;
  notes: string;
}

const purchaseOrders: PurchaseOrder[] = [
  {
    id: '1', poNumber: 'PO-2024-092', vendor: 'Shanghai Beauty Cosmetics Co.', date: '2026-05-18', expectedDate: '2026-07-02', status: 'sent',
    items: [
      { product: 'Brushia Matte Foundation - Light', qty: 200, unitCost: 18000, total: 3600000 },
      { product: 'Brushia Matte Foundation - Medium', qty: 200, unitCost: 18000, total: 3600000 },
      { product: 'Brushia Setting Powder', qty: 150, unitCost: 14000, total: 2100000 },
    ],
    subtotal: 9300000, shippingCost: 450000, customsDuty: 280000, landedCost: 10030000, notes: 'Urgent restock for summer season',
  },
  {
    id: '2', poNumber: 'PO-2024-091', vendor: 'Qingdao Mink Lash Factory', date: '2026-05-15', expectedDate: '2026-06-20', status: 'sent',
    items: [
      { product: 'Mink Lashes - Natural', qty: 500, unitCost: 5000, total: 2500000 },
      { product: 'Mink Lashes - Dramatic', qty: 300, unitCost: 6000, total: 1800000 },
      { product: 'Faux Mink Lashes - Everyday', qty: 400, unitCost: 4000, total: 1600000 },
    ],
    subtotal: 5900000, shippingCost: 320000, customsDuty: 180000, landedCost: 6400000, notes: 'Lash restocking Q3',
  },
  {
    id: '3', poNumber: 'PO-2024-090', vendor: 'Shenzhen Brush Master Ltd.', date: '2026-05-10', expectedDate: '2026-06-20', status: 'partial_received',
    items: [
      { product: 'Pro Foundation Brush', qty: 100, unitCost: 5000, total: 500000 },
      { product: 'Pro Contour Brush', qty: 100, unitCost: 4500, total: 450000 },
      { product: 'Essential Brush Set (8pc)', qty: 50, unitCost: 22000, total: 1100000 },
      { product: 'Pro Brush Set (12pc)', qty: 30, unitCost: 35000, total: 1050000 },
    ],
    subtotal: 3100000, shippingCost: 280000, customsDuty: 150000, landedCost: 3530000, notes: 'Partial shipment received May 16',
  },
  {
    id: '4', poNumber: 'PO-2024-089', vendor: 'Shanghai Beauty Cosmetics Co.', date: '2026-04-25', expectedDate: '2026-06-10', status: 'received',
    items: [
      { product: 'Matte Lipstick - Ruby Red', qty: 200, unitCost: 7500, total: 1500000 },
      { product: 'Matte Lipstick - Nude Pink', qty: 200, unitCost: 7500, total: 1500000 },
      { product: 'Lip Gloss - Clear Shine', qty: 300, unitCost: 5500, total: 1650000 },
    ],
    subtotal: 4650000, shippingCost: 350000, customsDuty: 200000, landedCost: 5200000, notes: 'All items received and inspected',
  },
  {
    id: '5', poNumber: 'PO-2024-088', vendor: 'Italian Cosmetics Lab', date: '2026-04-20', expectedDate: '2026-06-20', status: 'received',
    items: [
      { product: 'Brushia Eyeshadow Palette', qty: 80, unitCost: 20000, total: 1600000 },
      { product: 'Brushia Mascara - Volume Max', qty: 200, unitCost: 7000, total: 1400000 },
    ],
    subtotal: 3000000, shippingCost: 420000, customsDuty: 190000, landedCost: 3610000, notes: 'Premium Italian formulation',
  },
  {
    id: '6', poNumber: 'PO-2024-087', vendor: 'Cairo Packaging Solutions', date: '2026-05-20', expectedDate: '2026-05-27', status: 'draft',
    items: [
      { product: 'Gift Boxes - Large', qty: 500, unitCost: 1500, total: 750000 },
      { product: 'Gift Boxes - Small', qty: 1000, unitCost: 800, total: 800000 },
    ],
    subtotal: 1550000, shippingCost: 50000, customsDuty: 0, landedCost: 1600000, notes: 'Summer packaging for gift sets',
  },
];

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  partial_received: 'bg-yellow-100 text-yellow-700',
  received: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  partial_received: 'Partial',
  received: 'Received',
  cancelled: 'Cancelled',
};

export default function PurchaseOrdersPage() {
  const [search, setSearch] = useState('');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const filtered = useMemo(() => {
    if (!search) return purchaseOrders;
    const q = search.toLowerCase();
    return purchaseOrders.filter((po) => po.poNumber.toLowerCase().includes(q) || po.vendor.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{purchaseOrders.length} purchase orders</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:from-rose-600 hover:to-purple-700">
          <Plus className="h-4 w-4" />
          Create PO
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{purchaseOrders.filter(p => p.status === 'draft').length}</p>
          <p className="text-sm text-gray-500">Draft</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{purchaseOrders.filter(p => p.status === 'sent').length}</p>
          <p className="text-sm text-gray-500">Sent / Pending</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-yellow-600">{purchaseOrders.filter(p => p.status === 'partial_received').length}</p>
          <p className="text-sm text-gray-500">Partial Received</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{formatEGP(purchaseOrders.reduce((s, p) => s + p.landedCost, 0))}</p>
          <p className="text-sm text-gray-500">Total Value</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Search PO# or vendor..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">PO #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Expected</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Total</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Landed Cost</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{po.poNumber}</td>
                  <td className="px-6 py-4 text-gray-600">{po.vendor}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(po.date)}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(po.expectedDate)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[po.status]}`}>
                      {statusLabels[po.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">{formatEGP(po.subtotal)}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatEGP(po.landedCost)}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => setSelectedPO(po)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Eye className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO Detail Modal */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedPO.poNumber}</h2>
                <p className="text-sm text-gray-500">{selectedPO.vendor}</p>
              </div>
              <button onClick={() => setSelectedPO(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>

            {/* Status flow */}
            <div className="flex items-center gap-2 mb-6 text-xs">
              {['draft', 'sent', 'partial_received', 'received'].map((s, i) => {
                const isActive = ['draft', 'sent', 'partial_received', 'received'].indexOf(selectedPO.status) >= i;
                return (
                  <div key={s} className="flex items-center gap-2">
                    {i > 0 && <ChevronRight className="h-3 w-3 text-gray-300" />}
                    <span className={cn('rounded-full px-2.5 py-1 font-medium', isActive ? statusStyles[s] : 'bg-gray-50 text-gray-400')}>
                      {statusLabels[s]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-xs text-gray-500">Order Date</p>
                <p className="font-medium text-gray-900">{formatDate(selectedPO.date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Expected Delivery</p>
                <p className="font-medium text-gray-900">{formatDate(selectedPO.expectedDate)}</p>
              </div>
            </div>

            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 text-left text-xs text-gray-500">Item</th>
                  <th className="pb-2 text-center text-xs text-gray-500">Qty</th>
                  <th className="pb-2 text-right text-xs text-gray-500">Unit Cost</th>
                  <th className="pb-2 text-right text-xs text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {selectedPO.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 text-gray-900">{item.product}</td>
                    <td className="py-2 text-center text-gray-600">{item.qty}</td>
                    <td className="py-2 text-right text-gray-600">{formatEGP(item.unitCost)}</td>
                    <td className="py-2 text-right font-medium text-gray-900">{formatEGP(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-gray-200 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatEGP(selectedPO.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{formatEGP(selectedPO.shippingCost)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Customs Duty</span><span>{formatEGP(selectedPO.customsDuty)}</span></div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-200"><span>Landed Cost</span><span>{formatEGP(selectedPO.landedCost)}</span></div>
            </div>

            {selectedPO.notes && (
              <div className="mt-4 p-3 rounded-lg bg-gray-50 text-sm text-gray-600">
                <span className="font-medium text-gray-700">Notes: </span>{selectedPO.notes}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button onClick={() => setSelectedPO(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
