'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { formatEGP, formatDate, cn } from '@/lib/utils';
import { Search, Eye, X, Package, Truck, CheckCircle2, Clock, XCircle, RefreshCw, ShoppingBag, CreditCard, Banknote, Hash, Printer, Receipt, FileText , Download } from 'lucide-react';
import { printA4Invoice, printThermalReceipt } from '@/lib/print-invoice';
import { exportToCSV, exportToExcelXML } from '@/lib/export-data';

interface Order {
  id: string; order_number: string; customer_id?: string; customer_name?: string;
  status: string; payment_status: string; channel: string;
  subtotal: string; discount_amount: string; tax_amount: string; shipping_amount: string;
  total: string; grand_total: string; paid_amount: string;
  payment_method?: string; item_count?: string; created_at: string;
  currency: string; order_type: string; notes?: string;
}

interface OrderItem {
  id: string; name: string; sku: string; quantity: number;
  unit_price: string; cost_price: string; discount: string; total: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700', shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700',
};
const paymentColors: Record<string, string> = {
  unpaid: 'bg-red-100 text-red-700', partial: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-emerald-100 text-emerald-700', refunded: 'bg-gray-100 text-gray-600',
};
const channelLabels: Record<string, string> = {
  pos: 'POS', online: 'Online', whatsapp: 'WhatsApp', exhibition: 'Exhibition',
};

function safeEGP(val: any): string {
  const num = Number(val);
  return isNaN(num) ? 'EGP 0.00' : formatEGP(num);
}


function buildInvoiceData(order: any, items: any[]) {
  return {
    order_number: order.order_number || order.id.slice(0, 8),
    receipt_number: order.receipt_number,
    date: new Date(order.created_at).toLocaleDateString('en-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
    customer_name: order.customer_name,
    items: items.map((i: any) => ({
      name: i.name || 'Item',
      sku: i.sku,
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price),
      total: Number(i.total),
    })),
    subtotal: Number(order.subtotal || 0),
    discount: Number(order.discount_amount || 0),
    tax: Number(order.tax_amount || 0),
    shipping: Number(order.shipping_amount || 0),
    total: Number(order.grand_total || order.total || 0),
    paid: Number(order.paid_amount || 0),
    payment_method: order.payment_method || order.method,
    channel: order.channel,
    notes: order.notes,
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      const res = await api.get<any>('/sales/orders', params);
      const data = res?.data || res || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch { setOrders([]); } finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    try {
      const res = await api.get<any>(`/sales/orders/${order.id}`);
      setOrderItems(res?.items || []);
    } catch { setOrderItems([]); }
  };

  const filtered = orders.filter(o =>
    o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getTotal = (o: Order) => Number(o.grand_total) || Number(o.total) || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage sales orders across all channels</p>
        </div>
        <button onClick={fetchOrders} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-2xl font-bold text-emerald-600">
            {safeEGP(orders.reduce((s, o) => s + getTotal(o), 0))}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Paid</p>
          <p className="text-2xl font-bold text-blue-600">
            {orders.filter(o => o.payment_status === 'paid').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {orders.filter(o => o.status === 'pending').length}
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-rose-500" />
        </div>

        <button onClick={() => exportToCSV(orders.map((o: Order) => ({ 'Order #': o.order_number, Date: new Date(o.created_at).toLocaleDateString(), Customer: o.customer_name || '-', Status: o.status, Payment: o.payment_status, Channel: o.channel, Total: safeEGP(getTotal(o)), Paid: safeEGP(o.paid_amount) })), 'brushia_orders')}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition whitespace-nowrap">
          <Download className="w-4 h-4" /> CSV
        </button>
        <button onClick={() => exportToExcelXML(orders.map((o: Order) => ({ 'Order #': o.order_number, Date: new Date(o.created_at).toLocaleDateString(), Customer: o.customer_name || '-', Status: o.status, Payment: o.payment_status, Channel: o.channel, Total: Number(getTotal(o)), Paid: Number(o.paid_amount || 0) })), 'brushia_orders', 'Orders')}
          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition whitespace-nowrap">
          <Download className="w-4 h-4" /> Excel
        </button>
        {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={cn('px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all',
              filterStatus === s ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">{search ? 'No orders match your search' : 'No orders yet'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Order</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Channel</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Items</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Payment</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Total</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{o.order_number}</p>
                    {o.customer_name && <p className="text-xs text-gray-500">{o.customer_name}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {channelLabels[o.channel] || o.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{o.item_count || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium capitalize', statusColors[o.status] || 'bg-gray-100 text-gray-700')}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', paymentColors[o.payment_status] || 'bg-gray-100 text-gray-600')}>
                      {o.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{safeEGP(getTotal(o))}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => viewOrder(o)} className="p-1 rounded hover:bg-gray-100">
                      <Eye className="h-4 w-4 text-rose-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setSelectedOrder(null)}>
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-bold text-lg">{selectedOrder.order_number}</h2>
                <p className="text-sm text-gray-500">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => printThermalReceipt(buildInvoiceData(selectedOrder, orderItems))} title="Print Receipt"
                  className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition"><Receipt className="h-4 w-4" /></button>
                <button onClick={() => printA4Invoice(buildInvoiceData(selectedOrder, orderItems))} title="Print Invoice"
                  className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition"><Printer className="h-4 w-4" /></button>
                <button onClick={() => setSelectedOrder(null)} className="p-1 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Status Row */}
              <div className="flex gap-3">
                <span className={cn('px-3 py-1 rounded-full text-xs font-medium capitalize', statusColors[selectedOrder.status])}>
                  {selectedOrder.status}
                </span>
                <span className={cn('px-3 py-1 rounded-full text-xs font-medium', paymentColors[selectedOrder.payment_status])}>
                  {selectedOrder.payment_status}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {channelLabels[selectedOrder.channel] || selectedOrder.channel}
                </span>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Subtotal</p>
                  <p className="font-semibold">{safeEGP(selectedOrder.subtotal)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Tax (14%)</p>
                  <p className="font-semibold">{safeEGP(selectedOrder.tax_amount)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Discount</p>
                  <p className="font-semibold">{safeEGP(selectedOrder.discount_amount)}</p>
                </div>
                <div className="bg-rose-50 rounded-lg p-3">
                  <p className="text-xs text-rose-600">Grand Total</p>
                  <p className="font-bold text-lg text-rose-600">{safeEGP(getTotal(selectedOrder))}</p>
                </div>
              </div>

              {/* Payment Method */}
              {selectedOrder.payment_method && (
                <div className="flex items-center gap-2 text-sm">
                  {selectedOrder.payment_method === 'cash' ? <Banknote className="h-4 w-4 text-green-600" /> : <CreditCard className="h-4 w-4 text-blue-600" />}
                  <span className="capitalize">{selectedOrder.payment_method}</span>
                </div>
              )}

              {/* Items */}
              <div>
                <h3 className="font-semibold text-sm mb-3">Order Items</h3>
                {orderItems.length === 0 ? (
                  <p className="text-sm text-gray-500">Loading items...</p>
                ) : (
                  <div className="space-y-2">
                    {orderItems.map((item, i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                        <div>
                          <p className="font-medium text-sm">{item.name || 'Product'}</p>
                          <p className="text-xs text-gray-500">{item.sku} × {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-sm">{safeEGP(Number(item.total))}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold text-sm mb-1">Notes</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
