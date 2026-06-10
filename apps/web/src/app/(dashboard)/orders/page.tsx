'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { localizedName } from '@/lib/localized-name';
import { api } from '@/lib/api-client';
import { formatEGP, formatDate, cn } from '@/lib/utils';
import { exportToCSV, exportToExcelXML } from '@/lib/export-data';
import { printA4Invoice, printThermalReceipt } from '@/lib/print-invoice';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard, StatCardGrid } from '@/components/ui/stat-card';
import { SearchFilter, FilterTabs } from '@/components/ui/search-filter';
import { BloomModal, BtnPrimary, BtnSecondary } from '@/components/ui/bloom-modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState, TableSkeleton } from '@/components/ui/empty-state';
import { Table, Thead, Th, Td, Tr } from '@/components/ui/table';
import {
  ShoppingBag, Eye, Download, RefreshCw, Printer, Receipt, FileText,
  CreditCard, Banknote, Hash, Clock, CheckCircle2, XCircle, Truck, Package, MapPin,
} from 'lucide-react';

interface Order {
  id: string; order_number: string; customer_name?: string; status: string;
  payment_status: string; channel: string; subtotal: string; discount_amount: string;
  tax_amount: string; shipping_amount: string; total: string; grand_total: string;
  paid_amount: string; payment_method?: string; item_count?: string; created_at: string;
  currency: string; notes?: string;
  // Address fields
  customer_phone?: string; customer_email?: string;
  customer_address?: string; customer_city?: string; customer_governorate?: string;
  shipping_address?: string;
}

interface OrderItem {
  id: string; name: string; sku: string; quantity: number;
  unit_price: string; cost_price: string; discount: string; total: string;
}

const statusConfig: Record<string, { color: 'amber' | 'blue' | 'indigo' | 'purple' | 'emerald' | 'red' | 'gray'; label: string }> = {
  pending:    { color: 'amber',   label: 'Pending' },
  confirmed:  { color: 'blue',    label: 'Confirmed' },
  processing: { color: 'indigo',  label: 'Processing' },
  shipped:    { color: 'purple',  label: 'Shipped' },
  delivered:  { color: 'emerald', label: 'Delivered' },
  cancelled:  { color: 'red',     label: 'Cancelled' },
};

const paymentConfig: Record<string, { color: 'red' | 'amber' | 'emerald' | 'gray'; label: string }> = {
  unpaid:   { color: 'red',     label: 'Unpaid' },
  partial:  { color: 'amber',   label: 'Partial' },
  paid:     { color: 'emerald', label: 'Paid' },
  refunded: { color: 'gray',    label: 'Refunded' },
};

const channelEmoji: Record<string, string> = { pos: '🏪', online: '🌐', whatsapp: '💬', exhibition: '🎪' };

function safeNum(v: any) { return isNaN(Number(v)) ? 0 : Number(v); }

function parseShippingAddr(addr: any): { address?: string; city?: string; governorate?: string; phone?: string } | null {
  if (!addr) return null;
  if (typeof addr === 'string') { try { return JSON.parse(addr); } catch { return { address: addr }; } }
  if (typeof addr === 'object') return addr;
  return null;
}

function buildCustomerAddress(order: Order): string {
  // Use shipping_address JSONB first (has full address), then customer fields
  const ship = parseShippingAddr(order.shipping_address);
  if (ship?.address) {
    const parts = [ship.address];
    if (ship.city) parts.push(ship.city);
    if (ship.governorate && ship.governorate !== ship.city) parts.push(ship.governorate);
    return parts.join('، ');
  }
  const parts: string[] = [];
  if (order.customer_address) parts.push(order.customer_address);
  if (order.customer_city) parts.push(order.customer_city);
  if (order.customer_governorate && order.customer_governorate !== order.customer_city) parts.push(order.customer_governorate);
  return parts.join('، ');
}

export default function OrdersPage() {
  const { t, locale } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/sales/orders');
      setOrders(Array.isArray(res) ? res : res?.data || []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const viewOrder = async (order: Order) => {
    try {
      const res = await api.get<any>(`/sales/orders/${order.id}`);
      // Merge detail data (with address) into order
      setSelectedOrder({ ...order, ...res, items: undefined });
      setOrderItems(res?.items || []);
    } catch {
      setSelectedOrder(order);
      setOrderItems([]);
    }
  };

  const filtered = orders.filter(o => {
    const matchSearch = `${o.order_number} ${o.customer_name || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalRevenue = orders.reduce((s, o) => s + safeNum(o.grand_total || o.total), 0);
  const totalPaid = orders.reduce((s, o) => s + safeNum(o.paid_amount), 0);
  const avgOrder = orders.length > 0 ? totalRevenue / orders.length : 0;

  const exportData = () => {
    exportToCSV(filtered.map(o => ({
      'Order #': o.order_number, Customer: o.customer_name || 'Walk-in', Status: o.status,
      Payment: o.payment_status, Channel: o.channel, Total: safeNum(o.grand_total || o.total).toFixed(2),
      Date: new Date(o.created_at).toLocaleDateString(),
    })), 'orders');
  };

  const buildInvoiceData = (order: Order) => ({
    order_number: order.order_number, date: new Date(order.created_at).toLocaleDateString('en-EG', { year:'numeric',month:'long',day:'numeric' }),
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    customer_email: order.customer_email,
    customer_address: order.customer_address,
    customer_city: order.customer_city,
    customer_governorate: order.customer_governorate,
    shipping_address: order.shipping_address,
    items: orderItems.map(i => ({ name: localizedName(i, locale), sku: i.sku, quantity: Number(i.quantity), unit_price: safeNum(i.unit_price), total: safeNum(i.total) })),
    subtotal: safeNum(order.subtotal), discount: safeNum(order.discount_amount), tax: safeNum(order.tax_amount),
    shipping: safeNum(order.shipping_amount), total: safeNum(order.grand_total || order.total),
    paid: safeNum(order.paid_amount), payment_method: order.payment_method, channel: order.channel, notes: order.notes === 'Imported from Excel sheet' ? '' : (order.notes || ''),
  });

  const customerAddr = selectedOrder ? buildCustomerAddress(selectedOrder) : '';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={t('orders.title') || 'Orders'}
        subtitle={t('orders.subtitle') || 'Track and manage all sales orders across channels'}
        icon={<ShoppingBag className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            <button onClick={exportData} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition" title="Export">
              <Download className="h-4 w-4" />
            </button>
            <button onClick={fetchOrders} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <StatCardGrid cols={4}>
        <StatCard label={t('orders.totalOrders') || 'Total Orders'} value={orders.length} icon={<ShoppingBag className="h-5 w-5" />} color="emerald" />
        <StatCard label={t('orders.revenue') || 'Revenue'} value={formatEGP(totalRevenue)} icon={<CreditCard className="h-5 w-5" />} color="blue" />
        <StatCard label={t('orders.collected') || 'Collected'} value={formatEGP(totalPaid)} icon={<Banknote className="h-5 w-5" />} color="amber" />
        <StatCard label={t('orders.avgOrder') || 'Avg. Order'} value={formatEGP(avgOrder)} icon={<Hash className="h-5 w-5" />} color="purple" />
      </StatCardGrid>

      <SearchFilter
        search={search} onSearchChange={setSearch}
        placeholder={t('orders.search') || 'Search by order number or customer...'}
        filters={
          <FilterTabs
            tabs={[
              { key: 'all', label: 'All', count: orders.length },
              { key: 'pending', label: '⏳ Pending' },
              { key: 'confirmed', label: '✅ Confirmed' },
              { key: 'delivered', label: '📦 Delivered' },
              { key: 'cancelled', label: '❌ Cancelled' },
            ]}
            active={filterStatus} onChange={setFilterStatus}
          />
        }
      />

      <Table>
        <Thead>
          <tr>
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th>Channel</Th>
            <Th>Status</Th>
            <Th>Payment</Th>
            <Th align="right">Total</Th>
            <Th>Date</Th>
            <Th align="right">Actions</Th>
          </tr>
        </Thead>
        <tbody>
          {loading ? <TableSkeleton rows={5} cols={8} /> : filtered.length === 0 ? (
            <tr><td colSpan={8}>
              <EmptyState icon={<ShoppingBag className="h-7 w-7" />} title="No orders found" description="Orders will appear here once sales are made" />
            </td></tr>
          ) : (
            filtered.map((o) => {
              const sc = statusConfig[o.status] || statusConfig.pending;
              const pc = paymentConfig[o.payment_status] || paymentConfig.unpaid;
              return (
                <Tr key={o.id} onClick={() => viewOrder(o)}>
                  <Td>
                    <div>
                      <p className="font-semibold text-gray-900 font-mono text-xs">{o.order_number}</p>
                      <p className="text-[10px] text-gray-400">{Number(o.item_count || 0)} items</p>
                    </div>
                  </Td>
                  <Td><span className="text-sm text-gray-700">{o.customer_name || 'Walk-in Customer'}</span></Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span>{channelEmoji[o.channel] || '🛒'}</span>
                      <span className="capitalize text-gray-600">{o.channel}</span>
                    </span>
                  </Td>
                  <Td><Badge color={sc.color} dot>{sc.label}</Badge></Td>
                  <Td><Badge color={pc.color}>{pc.label}</Badge></Td>
                  <Td align="right"><span className="font-semibold text-gray-900">{formatEGP(safeNum(o.grand_total || o.total))}</span></Td>
                  <Td><span className="text-sm text-gray-500">{new Date(o.created_at).toLocaleDateString('en-GB')}</span></Td>
                  <Td align="right">
                    <button onClick={(e) => { e.stopPropagation(); viewOrder(o); }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition">
                      <Eye className="h-4 w-4" />
                    </button>
                  </Td>
                </Tr>
              );
            })
          )}
        </tbody>
      </Table>

      {/* Order Detail Modal */}
      <BloomModal open={!!selectedOrder} onClose={() => setSelectedOrder(null)}
        title={`Order ${selectedOrder?.order_number || ''}`}
        subtitle={selectedOrder?.customer_name || 'Walk-in Customer'}
        size="lg"
        footer={
          selectedOrder ? (
            <>
              <button onClick={() => printThermalReceipt(buildInvoiceData(selectedOrder))}
                className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Receipt className="h-4 w-4" /> Receipt
              </button>
              <button onClick={() => printA4Invoice(buildInvoiceData(selectedOrder))}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
                <FileText className="h-4 w-4" /> Invoice
              </button>
            </>
          ) : undefined
        }
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-0.5">Status</p>
                <Badge color={(statusConfig[selectedOrder.status] || statusConfig.pending).color} dot>{(statusConfig[selectedOrder.status] || statusConfig.pending).label}</Badge>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-0.5">Payment</p>
                <Badge color={(paymentConfig[selectedOrder.payment_status] || paymentConfig.unpaid).color}>{(paymentConfig[selectedOrder.payment_status] || paymentConfig.unpaid).label}</Badge>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-0.5">Channel</p>
                <p className="text-sm font-medium">{channelEmoji[selectedOrder.channel]} {selectedOrder.channel}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-0.5">Date</p>
                <p className="text-sm font-medium">{new Date(selectedOrder.created_at).toLocaleDateString('en-GB')}</p>
              </div>
            </div>

            {/* Customer Info + Address */}
            {(selectedOrder.customer_name || customerAddr) && (
              <div className="rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-emerald-600" /> Customer Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {selectedOrder.customer_name && (
                    <div><span className="text-gray-400 text-xs">Name</span><p className="font-medium text-gray-800">{selectedOrder.customer_name}</p></div>
                  )}
                  {(selectedOrder.customer_phone || parseShippingAddr(selectedOrder.shipping_address)?.phone) && (
                    <div><span className="text-gray-400 text-xs">Phone</span><p className="font-medium text-gray-800">{selectedOrder.customer_phone || parseShippingAddr(selectedOrder.shipping_address)?.phone}</p></div>
                  )}
                  {selectedOrder.customer_email && (
                    <div><span className="text-gray-400 text-xs">Email</span><p className="font-medium text-gray-800">{selectedOrder.customer_email}</p></div>
                  )}
                  {customerAddr && (
                    <div><span className="text-gray-400 text-xs">Address</span><p className="font-medium text-gray-800">📍 {customerAddr}</p></div>
                  )}

                </div>
              </div>
            )}

            {orderItems.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
                <div className="rounded-xl border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Product</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Qty</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Price</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Total</th>
                    </tr></thead>
                    <tbody className="divide-y">
                      {orderItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2.5"><p className="font-medium text-gray-900">{localizedName(item, locale)}</p><p className="text-xs text-gray-400 font-mono">{item.sku}</p></td>
                          <td className="px-4 py-2.5 text-right text-gray-700">{item.quantity}</td>
                          <td className="px-4 py-2.5 text-right text-gray-700">{formatEGP(safeNum(item.unit_price))}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{formatEGP(safeNum(item.total))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-gray-50 p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatEGP(safeNum(selectedOrder.subtotal))}</span></div>
              {safeNum(selectedOrder.discount_amount) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="text-red-600">-{formatEGP(safeNum(selectedOrder.discount_amount))}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-gray-500">VAT (14%)</span><span>{formatEGP(safeNum(selectedOrder.tax_amount))}</span></div>
              {safeNum(selectedOrder.shipping_amount) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span>{formatEGP(safeNum(selectedOrder.shipping_amount))}</span></div>}
              <div className="border-t pt-2 flex justify-between text-base font-bold"><span>Total</span><span>{formatEGP(safeNum(selectedOrder.grand_total || selectedOrder.total))}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Paid</span><span className="text-emerald-600 font-semibold">{formatEGP(safeNum(selectedOrder.paid_amount))}</span></div>
            </div>
          </div>
        )}
      </BloomModal>
    </div>
  );
}
