'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  ClipboardList,
  Package,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
  Ban,
  BarChart3,
} from 'lucide-react';

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface StockCount {
  id: string;
  count_number: string;
  warehouse_id: string;
  warehouse_name: string;
  type: 'full' | 'partial' | 'cycle';
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  item_count: number;
  variance_value: number;
  created_at: string;
  notes: string;
}

interface StockCountItem {
  id: string;
  product_name: string;
  variant_name: string;
  system_qty: number;
  counted_qty: number | null;
  variance: number;
  notes: string;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount / 100);

export default function StockCountsPage() {
  const { t, locale, isRTL } = useI18n();
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [countItems, setCountItems] = useState<StockCountItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    warehouse_id: '',
    type: 'full' as 'full' | 'partial' | 'cycle',
    notes: '',
  });

  useEffect(() => {
    loadCounts();
    loadWarehouses();
  }, []);

  const loadCounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/stock-counts');
      const data = Array.isArray(res) ? res : res.data || [];
      setCounts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      const res = await api.get('/warehouses');
      const data = Array.isArray(res) ? res : res.data || [];
      setWarehouses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCountItems = async (countId: string) => {
    try {
      setItemsLoading(true);
      const res = await api.get(`/stock-counts/${countId}/items`);
      const data = Array.isArray(res) ? res : res.data || [];
      setCountItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setCountItems([]);
    } else {
      setExpandedId(id);
      loadCountItems(id);
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/stock-counts', {
        warehouse_id: form.warehouse_id,
        type: form.type,
        notes: form.notes,
      });
      setShowModal(false);
      setForm({ warehouse_id: '', type: 'full', notes: '' });
      loadCounts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveItems = async () => {
    if (!expandedId) return;
    try {
      setSaving(true);
      await api.put(`/stock-counts/${expandedId}/items`, {
        items: countItems.map((item) => ({
          id: item.id,
          counted_qty: item.counted_qty,
          notes: item.notes,
        })),
      });
      loadCountItems(expandedId);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await api.post(`/stock-counts/${id}/complete`, {});
      loadCounts();
      setExpandedId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await api.post(`/stock-counts/${id}/cancel`, {});
      loadCounts();
      setExpandedId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const updateItemCount = (itemId: string, value: string) => {
    setCountItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, counted_qty: value === '' ? null : parseInt(value), variance: (value === '' ? 0 : parseInt(value)) - item.system_qty }
          : item
      )
    );
  };

  const totalCounts = counts.length;
  const inProgress = counts.filter((c) => c.status === 'in_progress').length;
  const completed = counts.filter((c) => c.status === 'completed').length;
  const totalVariance = counts.reduce((s, c) => s + Math.abs(c.variance_value || 0), 0);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return (
      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', colors[status] || 'bg-gray-100 text-gray-700')}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = {
      full: 'bg-purple-100 text-purple-700',
      partial: 'bg-amber-100 text-amber-700',
      cycle: 'bg-blue-100 text-blue-700',
    };
    return (
      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', colors[type] || 'bg-gray-100 text-gray-700')}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Counts</h1>
          <p className="text-sm text-gray-500">Cycle counting and stock reconciliation</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
        >
          <Plus className="h-4 w-4" />
          New Stock Count
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rose-50 p-2">
              <ClipboardList className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Counts</p>
              <p className="text-2xl font-bold text-gray-900">{totalCounts}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Loader2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{inProgress}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completed}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Variance</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(totalVariance)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Counts Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 w-8"></th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Count #</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Warehouse</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('common.status')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Items</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Variance</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {counts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                  <ClipboardList className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  No stock counts yet. Start your first count to reconcile inventory.
                </td>
              </tr>
            ) : (
              counts.map((count) => (
                <>
                  <tr
                    key={count.id}
                    onClick={() => handleExpand(count.id)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      {expandedId === count.id ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{count.count_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{count.warehouse_name}</td>
                    <td className="px-4 py-3">{typeBadge(count.type)}</td>
                    <td className="px-4 py-3">{statusBadge(count.status)}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">{count.item_count}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{fmt(count.variance_value || 0)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(count.created_at).toLocaleDateString('en-EG')}</td>
                  </tr>
                  {expandedId === count.id && (
                    <tr key={`${count.id}-detail`}>
                      <td colSpan={8} className="bg-gray-50 px-6 py-4">
                        {itemsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900">Count Items</h3>
                              <div className="flex items-center gap-2">
                                {count.status !== 'completed' && count.status !== 'cancelled' && (
                                  <>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleSaveItems(); }}
                                      disabled={saving}
                                      className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
                                    >
                                      <Save className="h-3 w-3" />
                                      {saving ? 'Saving...' : 'Save Counts'}
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleComplete(count.id); }}
                                      className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
                                    >
                                      <CheckCircle2 className="h-3 w-3" />
                                      Complete Count
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleCancel(count.id); }}
                                      className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                                    >
                                      <Ban className="h-3 w-3" />
                                      Cancel
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            <table className="w-full">
                              <thead className="bg-white">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Product</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Variant</th>
                                  <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">System Qty</th>
                                  <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Counted Qty</th>
                                  <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Variance</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Notes</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {countItems.map((item) => (
                                  <tr key={item.id}>
                                    <td className="px-3 py-2 text-sm font-medium text-gray-900">{item.product_name}</td>
                                    <td className="px-3 py-2 text-sm text-gray-600">{item.variant_name || '—'}</td>
                                    <td className="px-3 py-2 text-right text-sm text-gray-900">{item.system_qty}</td>
                                    <td className="px-3 py-2 text-right">
                                      {count.status === 'completed' || count.status === 'cancelled' ? (
                                        <span className="text-sm text-gray-900">{item.counted_qty ?? '—'}</span>
                                      ) : (
                                        <input
                                          type="number"
                                          value={item.counted_qty ?? ''}
                                          onChange={(e) => updateItemCount(item.id, e.target.value)}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-20 rounded border px-2 py-1 text-right text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                          placeholder="—"
                                        />
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <span
                                        className={cn(
                                          'text-sm font-medium',
                                          item.variance === 0 && 'text-emerald-600',
                                          item.variance < 0 && 'text-red-600',
                                          item.variance > 0 && 'text-amber-600'
                                        )}
                                      >
                                        {item.counted_qty !== null ? (item.variance > 0 ? '+' : '') + item.variance : '—'}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-500">{item.notes || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Stock Count Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">New Stock Count</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                <select
                  value={form.warehouse_id}
                  onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="">Select warehouse...</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Count Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="full">Full Count</option>
                  <option value="partial">Partial Count</option>
                  <option value="cycle">Cycle Count</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Optional notes for this count..."
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!form.warehouse_id}
                  className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50"
                >
                  Start Count
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
