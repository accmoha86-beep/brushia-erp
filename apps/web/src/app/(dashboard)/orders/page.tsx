'use client';

import { useState, useMemo } from 'react';
import { formatEGP, formatDate, cn } from '@/lib/utils';
import { Search, Filter, Eye, X, Package, Truck, CheckCircle2, Clock, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface OrderItem {
  product: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  customer: string;
  phone: string;
  items: OrderItem[];
  subtotal: number;
  vat: number;
  total: number;
  paymentStatus: 'paid' | 'pending' | 'cod' | 'refunded' | 'partial';
  paymentMethod: string;
  shippingStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shippingCity: string;
}

const orders: Order[] = [
  { id: '1', orderNumber: 'ORD-2024-1847', date: '2026-05-21T10:30:00', customer: 'Sara Ahmed', phone: '+201012345678', items: [{ product: 'Brushia Matte Foundation - Light', qty: 1, price: 35000 }, { product: 'Mink Lashes - Natural', qty: 2, price: 15000 }, { product: 'Lip Gloss - Clear Shine', qty: 1, price: 15000 }], subtotal: 80000, vat: 11200, total: 91200, paymentStatus: 'paid', paymentMethod: 'Card', shippingStatus: 'confirmed', shippingCity: 'Cairo' },
  { id: '2', orderNumber: 'ORD-2024-1846', date: '2026-05-21T09:45:00', customer: 'Nour ElSayed', phone: '+201098765432', items: [{ product: 'Pro Brush Set (12pc)', qty: 1, price: 75000 }], subtotal: 75000, vat: 10500, total: 85500, paymentStatus: 'paid', paymentMethod: 'Cash', shippingStatus: 'shipped', shippingCity: 'Alexandria' },
  { id: '3', orderNumber: 'ORD-2024-1845', date: '2026-05-21T09:12:00', customer: 'Fatma Hassan', phone: '+201155667788', items: [{ product: 'Brushia Full Coverage Concealer', qty: 2, price: 25000 }, { product: 'Matte Lipstick - Ruby Red', qty: 1, price: 19000 }, { product: 'Brushia Mascara - Volume Max', qty: 1, price: 18000 }, { product: 'Brushia Eyeliner - Jet Black', qty: 1, price: 14000 }], subtotal: 101000, vat: 14140, total: 115140, paymentStatus: 'pending', paymentMethod: 'COD', shippingStatus: 'pending', shippingCity: 'Giza' },
  { id: '4', orderNumber: 'ORD-2024-1844', date: '2026-05-20T18:30:00', customer: 'Mariam Adel', phone: '+201233445566', items: [{ product: 'Essential Brush Set (8pc)', qty: 1, price: 45000 }, { product: 'Mink Lashes - Dramatic', qty: 1, price: 18000 }], subtotal: 63000, vat: 8820, total: 71820, paymentStatus: 'paid', paymentMethod: 'Card', shippingStatus: 'delivered', shippingCity: 'Cairo' },
  { id: '5', orderNumber: 'ORD-2024-1843', date: '2026-05-20T17:15:00', customer: 'Yasmin Khaled', phone: '+201177889900', items: [{ product: 'Brushia Eyeshadow Palette - Desert Rose', qty: 1, price: 42000 }, { product: 'Brushia Matte Foundation - Medium', qty: 1, price: 35000 }, { product: 'Pro Foundation Brush', qty: 1, price: 12000 }, { product: 'Brushia Setting Powder', qty: 1, price: 28000 }], subtotal: 117000, vat: 16380, total: 133380, paymentStatus: 'paid', paymentMethod: 'Card', shippingStatus: 'confirmed', shippingCity: 'Mansoura' },
  { id: '6', orderNumber: 'ORD-2024-1842', date: '2026-05-20T16:00:00', customer: 'Hana Mostafa', phone: '+201066778899', items: [{ product: 'Pro Brush Set (12pc)', qty: 1, price: 75000 }], subtotal: 75000, vat: 10500, total: 85500, paymentStatus: 'paid', paymentMethod: 'Cash', shippingStatus: 'shipped', shippingCity: 'Tanta' },
  { id: '7', orderNumber: 'ORD-2024-1841', date: '2026-05-20T14:20:00', customer: 'Aya Ibrahim', phone: '+201244556677', items: [{ product: 'Brushia Matte Foundation - Dark', qty: 1, price: 35000 }, { product: 'Brushia Full Coverage Concealer', qty: 1, price: 25000 }, { product: 'Matte Lipstick - Nude Pink', qty: 2, price: 19000 }, { product: 'Mink Lashes - Natural', qty: 3, price: 15000 }], subtotal: 143000, vat: 20020, total: 163020, paymentStatus: 'paid', paymentMethod: 'Card', shippingStatus: 'delivered', shippingCity: 'Cairo' },
  { id: '8', orderNumber: 'ORD-2024-1840', date: '2026-05-20T13:00:00', customer: 'Dina Fawzy', phone: '+201099887766', items: [{ product: 'Lip Liner - Deep Rose', qty: 1, price: 12000 }, { product: 'Matte Lipstick - Ruby Red', qty: 1, price: 19000 }], subtotal: 31000, vat: 4340, total: 35340, paymentStatus: 'refunded', paymentMethod: 'Card', shippingStatus: 'cancelled', shippingCity: 'Cairo' },
  { id: '9', orderNumber: 'ORD-2024-1839', date: '2026-05-20T11:45:00', customer: 'Reem Gamal', phone: '+201122334455', items: [{ product: 'Faux Mink Lashes - Everyday', qty: 5, price: 12000 }, { product: 'Magnetic Lashes - Glamour', qty: 2, price: 22000 }], subtotal: 104000, vat: 14560, total: 118560, paymentStatus: 'paid', paymentMethod: 'Cash', shippingStatus: 'delivered', shippingCity: 'Aswan' },
  { id: '10', orderNumber: 'ORD-2024-1838', date: '2026-05-20T10:30:00', customer: 'Layla Mahmoud', phone: '+201088776655', items: [{ product: 'Brushia Makeup Remover', qty: 2, price: 16000 }], subtotal: 32000, vat: 4480, total: 36480, paymentStatus: 'cod', paymentMethod: 'COD', shippingStatus: 'confirmed', shippingCity: 'Luxor' },
  { id: '11', orderNumber: 'ORD-2024-1837', date: '2026-05-19T19:00:00', customer: 'Salma Tarek', phone: '+201055443322', items: [{ product: 'Pro Powder Brush', qty: 1, price: 11000 }, { product: 'Pro Blending Brush', qty: 1, price: 9500 }], subtotal: 20500, vat: 2870, total: 23370, paymentStatus: 'paid', paymentMethod: 'Cash', shippingStatus: 'delivered', shippingCity: 'Cairo' },
  { id: '12', orderNumber: 'ORD-2024-1836', date: '2026-05-19T15:30:00', customer: 'Mona Saeed', phone: '+201033221100', items: [{ product: 'Brushia BB Cream SPF30', qty: 1, price: 32000 }, { product: 'Brushia Primer - Pore Min', qty: 1, price: 28000 }], subtotal: 60000, vat: 8400, total: 68400, paymentStatus: 'paid', paymentMethod: 'Card', shippingStatus: 'delivered', shippingCity: 'Cairo' },
];

const statusFilters = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

const paymentStyles: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cod: 'bg-blue-100 text-blue-700',
  refunded: 'bg-red-100 text-red-700',
  partial: 'bg-orange-100 text-orange-700',
};

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  confirmed: CheckCircle2,
  shipped: Truck,
  delivered: Package,
  cancelled: XCircle,
};

const ITEMS_PER_PAGE = 8;

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch = search === '' || o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || o.shippingStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{orders.length} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order # or customer..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors',
                statusFilter === s ? 'bg-rose-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Order</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Items</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Total</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Payment</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Shipping</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((order) => {
                const StatusIcon = statusIcons[order.shippingStatus] || Clock;
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(order.date)}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{order.customer}</p>
                      <p className="text-xs text-gray-400">{order.shippingCity}</p>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">{order.items.reduce((s, i) => s + i.qty, 0)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatEGP(order.total)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentStyles[order.paymentStatus]}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[order.shippingStatus]}`}>
                        <StatusIcon className="h-3 w-3" />
                        {order.shippingStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => setSelectedOrder(order)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
          <p className="text-sm text-gray-500">Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={cn('h-8 w-8 rounded-lg text-sm font-medium', p === page ? 'bg-rose-500 text-white' : 'text-gray-600 hover:bg-gray-100')}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedOrder.orderNumber}</h2>
                <p className="text-sm text-gray-500">{formatDate(selectedOrder.date)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase">Customer</p>
                <p className="font-medium text-gray-900">{selectedOrder.customer}</p>
                <p className="text-sm text-gray-500">{selectedOrder.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Shipping</p>
                <p className="font-medium text-gray-900">{selectedOrder.shippingCity}</p>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[selectedOrder.shippingStatus]}`}>{selectedOrder.shippingStatus}</span>
              </div>
            </div>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 text-left text-xs text-gray-500">Product</th>
                  <th className="pb-2 text-center text-xs text-gray-500">Qty</th>
                  <th className="pb-2 text-right text-xs text-gray-500">Price</th>
                  <th className="pb-2 text-right text-xs text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {selectedOrder.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 text-gray-900">{item.product}</td>
                    <td className="py-2 text-center text-gray-600">{item.qty}</td>
                    <td className="py-2 text-right text-gray-600">{formatEGP(item.price)}</td>
                    <td className="py-2 text-right font-medium text-gray-900">{formatEGP(item.price * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-gray-200 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="text-gray-900">{formatEGP(selectedOrder.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">VAT (14%)</span><span className="text-gray-900">{formatEGP(selectedOrder.vat)}</span></div>
              <div className="flex justify-between font-semibold text-base"><span>Total</span><span>{formatEGP(selectedOrder.total)}</span></div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentStyles[selectedOrder.paymentStatus]}`}>{selectedOrder.paymentStatus} · {selectedOrder.paymentMethod}</span>
              <button onClick={() => setSelectedOrder(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
