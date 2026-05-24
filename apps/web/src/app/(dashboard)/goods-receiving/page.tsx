'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { formatEGP, formatDate, cn } from '@/lib/utils';
import { Plus, RefreshCw, Eye, X, Package, Check, XCircle, AlertTriangle, ClipboardCheck, Truck, Edit3, Search, Filter, Calendar, Hash, Save, Trash2, ChevronRight, CheckCircle2, Clock, Ban, FileText } from 'lucide-react';

interface GRN {
  id: string; receipt_number: string; po_number: string; vendor_name: string;
  warehouse_id: string; status: string; item_count: number; total_qty_received: number;
  received_by_email: string; created_at: string; notes?: string;
}
interface PO {
  id: string; po_number: string; vendor_name: string; status: string;
  items: any[]; warehouse_id: string; item_count?: number;
}

const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-700', icon: Clock, label: 'Draft' },
  inspecting: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Search, label: 'Inspecting' },
  accepted: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2, label: 'Accepted' },
  partial_accepted: { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertTriangle, label: 'Partial' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: Ban, label: 'Rejected' },
};

const tabs = [
  { key: 'all', label: 'All', icon: Package },
  { key: 'draft', label: 'Draft', icon: Clock },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle2 },
  { key: 'partial_accepted', label: 'Partial', icon: AlertTriangle },
  { key: 'rejected', label: 'Rejected', icon: Ban },
];

export default function GoodsReceivingPage() {
  const [grns, setGRNs] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState<any>(null);
  const [showInspect, setShowInspect] = useState<any>(null);
  const [showEdit, setShowEdit] = useState<any>(null);

  // Create form
  const [eligiblePOs, setEligiblePOs] = useState<PO[]>([]);
  const [selectedPO, setSelectedPO] = useState<PO | null>(null);
  const [receiveItems, setReceiveItems] = useState<any[]>([]);
  const [grnNotes, setGrnNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchGRNs = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get<any>('/purchasing/grn'); setGRNs(Array.isArray(r) ? r : []); }
    catch { setGRNs([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGRNs(); }, [fetchGRNs]);

  // ═══ Stats ═══
  const totalGRNs = grns.length;
  const totalUnits = grns.reduce((s, g) => s + Number(g.total_qty_received || 0), 0);
  const draftCount = grns.filter(g => g.status === 'draft').length;
  const acceptedCount = grns.filter(g => g.status === 'accepted').length;
  const uniqueVendors = new Set(grns.map(g => g.vendor_name)).size;

  // ═══ Filters ═══
  const filtered = grns.filter(g => {
    if (activeTab !== 'all' && g.status !== activeTab) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return g.receipt_number.toLowerCase().includes(q) ||
        g.po_number.toLowerCase().includes(q) ||
        g.vendor_name.toLowerCase().includes(q);
    }
    return true;
  });

  // ═══ Create GRN ═══
  const startCreate = async () => {
    try {
      const res = await api.get<any>('/purchasing/orders');
      const all = res?.data || [];
      const eligible = all.filter((p: any) => ['approved','ordered','partial_received'].includes(p.status));
      setEligiblePOs(eligible);
      setShowCreate(true);
    } catch {}
  };

  const selectPO = async (poId: string) => {
    try {
      const po = await api.get<any>(`/purchasing/orders/${poId}`);
      setSelectedPO(po);
      setReceiveItems((po.items || []).map((item: any) => ({
        po_item_id: item.id,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        product_name: item.product_name || item.current_product_name || 'Product',
        sku: item.sku || '',
        quantity_ordered: item.quantity_ordered || item.quantity || 0,
        already_received: item.quantity_received || item.received_qty || 0,
        quantity_received: (item.quantity_ordered || item.quantity || 0) - (item.quantity_received || item.received_qty || 0),
        unit_cost: Number(item.unit_cost) || 0,
        landed_unit_cost: Number(item.landed_unit_cost) || 0,
      })));
    } catch {}
  };

  const createGRN = async () => {
    if (!selectedPO) return;
    const items = receiveItems.filter(i => i.quantity_received > 0);
    if (items.length === 0) return alert('Enter received quantities');
    setSaving(true);
    try {
      await api.post('/purchasing/grn', {
        purchase_order_id: selectedPO.id,
        warehouse_id: selectedPO.warehouse_id,
        notes: grnNotes || null,
        items: items.map(i => ({
          po_item_id: i.po_item_id, product_id: i.product_id, variant_id: i.variant_id,
          quantity_received: i.quantity_received, unit_cost: i.unit_cost, landed_unit_cost: i.landed_unit_cost,
        })),
      });
      setShowCreate(false); setSelectedPO(null); setReceiveItems([]); setGrnNotes('');
      fetchGRNs();
    } catch (e: any) { alert(e?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  // ═══ View GRN ═══
  const viewGRN = async (id: string) => {
    try { const r = await api.get<any>(`/purchasing/grn/${id}`); setSelectedGRN(r); } catch {}
  };

  // ═══ Edit GRN ═══
  const startEdit = async (grn: GRN) => {
    try {
      const detail = await api.get<any>(`/purchasing/grn/${grn.id}`);
      setShowEdit({
        ...detail,
        editNotes: detail.notes || '',
        editItems: (detail.items || []).map((item: any) => ({
          id: item.id,
          product_name: item.product_name,
          sku: item.sku,
          quantity_received: Number(item.quantity_received) || 0,
          quantity_ordered: Number(item.quantity_ordered) || 0,
          unit_cost: Number(item.unit_cost) || 0,
          landed_unit_cost: Number(item.landed_unit_cost) || 0,
        })),
      });
    } catch {}
  };

  const saveEdit = async () => {
    if (!showEdit) return;
    setSaving(true);
    try {
      await api.put(`/purchasing/grn/${showEdit.id}`, {
        notes: showEdit.editNotes || null,
        items: showEdit.editItems.map((i: any) => ({
          id: i.id,
          quantity_received: i.quantity_received,
          unit_cost: i.unit_cost,
          landed_unit_cost: i.landed_unit_cost,
        })),
      });
      setShowEdit(null);
      fetchGRNs();
    } catch (e: any) { alert(e?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  // ═══ Inspect GRN ═══
  const startInspect = async (grn: any) => {
    const detail = await api.get<any>(`/purchasing/grn/${grn.id}`);
    setShowInspect({
      ...detail,
      inspectItems: (detail.items || []).map((item: any) => ({
        item_id: item.id, po_item_id: item.po_item_id,
        product_id: item.product_id, variant_id: item.variant_id,
        product_name: item.product_name, sku: item.sku,
        quantity_received: Number(item.quantity_received),
        quantity_accepted: Number(item.quantity_received),
        quantity_rejected: 0, rejection_reason: '',
      })),
    });
  };

  const submitInspection = async () => {
    if (!showInspect) return;
    setSaving(true);
    try {
      await api.post(`/purchasing/grn/${showInspect.id}/accept`, {
        items: showInspect.inspectItems.map((i: any) => ({
          item_id: i.item_id, po_item_id: i.po_item_id,
          product_id: i.product_id, variant_id: i.variant_id,
          quantity_accepted: i.quantity_accepted,
          quantity_rejected: i.quantity_rejected,
          rejection_reason: i.rejection_reason || null,
        })),
      });
      setShowInspect(null);
      fetchGRNs();
    } catch (e: any) { alert(e?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg = statusConfig[status] || statusConfig.draft;
    const Icon = cfg.icon;
    return (
      <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', cfg.bg, cfg.text)}>
        <Icon className="h-3 w-3" />
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📦 Goods Receiving
          </h1>
          <p className="text-sm text-gray-500 mt-1">Receive, inspect, and accept goods from purchase orders</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchGRNs} className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </button>
          <button onClick={startCreate} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-medium hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-200 transition-all">
            <Plus className="h-4 w-4" />Receive Goods
          </button>
        </div>
      </div>

      {/* ═══ Stat Cards ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total GRNs', value: totalGRNs, icon: FileText, color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50' },
          { label: 'Total Units', value: totalUnits.toLocaleString(), icon: Package, color: 'from-violet-500 to-purple-500', bg: 'bg-violet-50' },
          { label: 'Draft', value: draftCount, icon: Clock, color: 'from-slate-500 to-gray-500', bg: 'bg-slate-50' },
          { label: 'Accepted', value: acceptedCount, icon: CheckCircle2, color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50' },
          { label: 'Vendors', value: uniqueVendors, icon: Truck, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</span>
              <div className={cn('p-2 rounded-xl', stat.bg)}>
                <stat.icon className={cn('h-4 w-4 bg-gradient-to-r bg-clip-text', stat.color)} style={{ color: 'transparent', backgroundImage: `linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))` }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ═══ Tabs + Search ═══ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={cn('flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.key !== 'all' && (
                <span className={cn('text-xs px-1.5 py-0.5 rounded-full',
                  activeTab === tab.key ? 'bg-rose-100 text-rose-700' : 'bg-gray-200 text-gray-600')}>
                  {grns.filter(g => g.status === tab.key).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search GRN, PO, vendor..."
            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300" />
        </div>
      </div>

      {/* ═══ GRN Table ═══ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b">
              <th className="text-left px-5 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">GRN #</th>
              <th className="text-left px-4 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">PO #</th>
              <th className="text-left px-4 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Vendor</th>
              <th className="text-left px-4 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Items</th>
              <th className="text-right px-4 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Qty</th>
              <th className="text-left px-4 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Received By</th>
              <th className="text-left px-4 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date</th>
              <th className="px-4 py-4 text-right font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? [0,1,2,3].map(i => (
              <tr key={i}><td colSpan={9} className="px-5 py-4"><div className="h-5 bg-gray-100 rounded-lg animate-pulse" /></td></tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-16 text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium text-gray-500">No goods receipts found</p>
                <p className="text-sm mt-1">Click "Receive Goods" to create your first GRN</p>
              </td></tr>
            ) : filtered.map(g => (
              <tr key={g.id} onClick={() => viewGRN(g.id)} className="hover:bg-rose-50/30 transition-colors group cursor-pointer">
                <td className="px-5 py-4">
                  <span className="font-mono font-bold text-rose-600 group-hover:text-rose-700">{g.receipt_number}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{g.po_number}</span>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium text-gray-800">{g.vendor_name}</p>
                </td>
                <td className="px-4 py-4"><StatusBadge status={g.status} /></td>
                <td className="px-4 py-4 text-right">
                  <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">{g.item_count}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="font-bold text-gray-900">{Number(g.total_qty_received).toLocaleString()}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-gray-500 text-xs">{g.received_by_email?.split('@')[0]}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="text-xs">{formatDate(g.created_at)}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={(e) => { e.stopPropagation(); viewGRN(g.id); }} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors" title="View details">
                      <Eye className="h-4 w-4" />
                    </button>
                    {g.status === 'draft' && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); startEdit(g); }} className="p-2 rounded-lg text-violet-500 hover:bg-violet-50 transition-colors" title="Edit GRN">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); startInspect(g); }} className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors" title="Inspect & Accept">
                          <ClipboardCheck className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ CREATE GRN MODAL ═══ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white"><Package className="h-5 w-5" /></div>
                <div><h3 className="text-lg font-bold text-gray-900">Receive Goods</h3><p className="text-xs text-gray-500">Select a purchase order to receive against</p></div>
              </div>
              <button onClick={() => { setShowCreate(false); setSelectedPO(null); setReceiveItems([]); setGrnNotes(''); }} className="p-2 rounded-lg hover:bg-gray-100"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-6">
              {!selectedPO ? (
                <div>
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2"><Filter className="h-4 w-4" /> Eligible Purchase Orders</h4>
                  {eligiblePOs.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Package className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-gray-500 font-medium">No eligible POs</p>
                      <p className="text-sm text-gray-400 mt-1">POs must be approved, ordered, or partially received</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {eligiblePOs.map(po => (
                        <button key={po.id} onClick={() => selectPO(po.id)}
                          className="w-full text-left border border-gray-200 rounded-xl p-4 hover:bg-rose-50 hover:border-rose-200 transition-all flex justify-between items-center group">
                          <div>
                            <p className="font-mono font-bold text-gray-900 group-hover:text-rose-700">{po.po_number}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{po.vendor_name}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <StatusBadge status={po.status} />
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-rose-500" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center text-white text-sm font-bold">PO</div>
                      <div>
                        <p className="font-bold text-blue-900">{selectedPO.po_number}</p>
                        <p className="text-sm text-blue-700">{(selectedPO as any).vendor_name || 'Vendor'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b"><tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Product</th>
                        <th className="text-right px-3 py-3 text-xs font-semibold text-gray-600 uppercase">Ordered</th>
                        <th className="text-right px-3 py-3 text-xs font-semibold text-gray-600 uppercase">Prev. Received</th>
                        <th className="text-right px-3 py-3 text-xs font-semibold text-gray-600 uppercase">Remaining</th>
                        <th className="text-right px-3 py-3 text-xs font-semibold text-gray-600 uppercase">Receiving Now</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {receiveItems.map((item, idx) => {
                          const remaining = item.quantity_ordered - item.already_received;
                          return (
                            <tr key={idx} className={cn(remaining <= 0 ? 'opacity-40 bg-gray-50' : 'hover:bg-gray-50')}>
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-900">{item.product_name}</p>
                                <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                              </td>
                              <td className="px-3 py-3 text-right text-gray-700">{item.quantity_ordered}</td>
                              <td className="px-3 py-3 text-right text-gray-500">{item.already_received}</td>
                              <td className="px-3 py-3 text-right">
                                <span className={cn('font-bold', remaining > 0 ? 'text-amber-600' : 'text-gray-400')}>{remaining}</span>
                              </td>
                              <td className="px-3 py-3 text-right">
                                <input type="number" min="0" max={remaining} value={item.quantity_received}
                                  onChange={e => { const copy = [...receiveItems]; copy[idx].quantity_received = Math.min(parseInt(e.target.value) || 0, remaining); setReceiveItems(copy); }}
                                  className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-right text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:outline-none"
                                  disabled={remaining <= 0} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">Notes</label>
                    <textarea value={grnNotes} onChange={e => setGrnNotes(e.target.value)} rows={2}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:outline-none resize-none"
                      placeholder="Delivery condition, package damage, discrepancies..." />
                  </div>

                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <p className="font-bold text-emerald-800">
                        Total: {receiveItems.reduce((s, i) => s + i.quantity_received, 0)} units across {receiveItems.filter(i => i.quantity_received > 0).length} items
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {selectedPO && (
              <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-between">
                <button onClick={() => setSelectedPO(null)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">← Back to PO list</button>
                <button onClick={createGRN} disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-200 disabled:opacity-50 transition-all">
                  {saving ? 'Creating...' : '✅ Confirm Receipt'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ EDIT GRN MODAL ═══ */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white"><Edit3 className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Edit {showEdit.receipt_number}</h3>
                  <p className="text-xs text-gray-500">PO: {showEdit.po_number} • {showEdit.vendor_name}</p>
                </div>
              </div>
              <button onClick={() => setShowEdit(null)} className="p-2 rounded-lg hover:bg-gray-100"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Items table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b"><tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Product</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-gray-600 uppercase">PO Qty</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-gray-600 uppercase">Qty Received</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-gray-600 uppercase">Unit Cost</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-gray-600 uppercase">Landed Cost</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {showEdit.editItems.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                        </td>
                        <td className="px-3 py-3 text-right text-gray-500">{item.quantity_ordered}</td>
                        <td className="px-3 py-3 text-right">
                          <input type="number" min="0" max={item.quantity_ordered} value={item.quantity_received}
                            onChange={e => {
                              const copy = { ...showEdit };
                              copy.editItems = [...copy.editItems];
                              copy.editItems[idx] = { ...copy.editItems[idx], quantity_received: Math.min(parseInt(e.target.value) || 0, item.quantity_ordered) };
                              setShowEdit(copy);
                            }}
                            className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-right text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-300 focus:outline-none" />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <input type="number" min="0" step="0.01" value={item.unit_cost}
                            onChange={e => {
                              const copy = { ...showEdit };
                              copy.editItems = [...copy.editItems];
                              copy.editItems[idx] = { ...copy.editItems[idx], unit_cost: parseFloat(e.target.value) || 0 };
                              setShowEdit(copy);
                            }}
                            className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-right text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-300 focus:outline-none" />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <input type="number" min="0" step="0.01" value={item.landed_unit_cost}
                            onChange={e => {
                              const copy = { ...showEdit };
                              copy.editItems = [...copy.editItems];
                              copy.editItems[idx] = { ...copy.editItems[idx], landed_unit_cost: parseFloat(e.target.value) || 0 };
                              setShowEdit(copy);
                            }}
                            className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-right text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-300 focus:outline-none" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">Notes</label>
                <textarea value={showEdit.editNotes}
                  onChange={e => setShowEdit({ ...showEdit, editNotes: e.target.value })} rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-300 focus:outline-none resize-none"
                  placeholder="Update delivery notes, discrepancies..." />
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-200">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-violet-600" />
                  <p className="font-bold text-violet-800">
                    Total: {showEdit.editItems.reduce((s: number, i: any) => s + Number(i.quantity_received), 0)} units across {showEdit.editItems.length} items
                  </p>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setShowEdit(null)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={saveEdit} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl text-sm font-bold hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-200 disabled:opacity-50 transition-all">
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ INSPECT GRN MODAL ═══ */}
      {showInspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white"><ClipboardCheck className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Inspect {showInspect.receipt_number}</h3>
                  <p className="text-xs text-gray-500">Accept or reject items → updates inventory automatically</p>
                </div>
              </div>
              <button onClick={() => setShowInspect(null)} className="p-2 rounded-lg hover:bg-gray-100"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b"><tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Product</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-gray-600 uppercase">Received</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-gray-600 uppercase">Accept</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-gray-600 uppercase">Reject</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-600 uppercase">Reason</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {showInspect.inspectItems.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-gray-700">{item.quantity_received}</td>
                        <td className="px-3 py-3 text-right">
                          <input type="number" min="0" max={item.quantity_received} value={item.quantity_accepted}
                            onChange={e => {
                              const copy = { ...showInspect };
                              copy.inspectItems = [...copy.inspectItems];
                              const accepted = Math.min(parseInt(e.target.value) || 0, item.quantity_received);
                              copy.inspectItems[idx] = { ...copy.inspectItems[idx], quantity_accepted: accepted, quantity_rejected: item.quantity_received - accepted };
                              setShowInspect(copy);
                            }}
                            className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-right text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none" />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className={cn('font-bold text-sm', item.quantity_rejected > 0 ? 'text-red-600' : 'text-gray-400')}>{item.quantity_rejected}</span>
                        </td>
                        <td className="px-3 py-3">
                          {item.quantity_rejected > 0 && (
                            <input type="text" value={item.rejection_reason}
                              onChange={e => {
                                const copy = { ...showInspect };
                                copy.inspectItems = [...copy.inspectItems];
                                copy.inspectItems[idx] = { ...copy.inspectItems[idx], rejection_reason: e.target.value };
                                setShowInspect(copy);
                              }}
                              className="w-full border border-red-200 rounded-lg px-3 py-1.5 text-xs bg-red-50 focus:ring-2 focus:ring-red-200 focus:border-red-300 focus:outline-none"
                              placeholder="Damaged, wrong color, missing..." />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-center">
                  <p className="text-xs text-emerald-600 font-semibold uppercase">Accepting</p>
                  <p className="text-xl font-bold text-emerald-700">{showInspect.inspectItems.reduce((s: number, i: any) => s + Number(i.quantity_accepted), 0)} units</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 border border-red-200 text-center">
                  <p className="text-xs text-red-600 font-semibold uppercase">Rejecting</p>
                  <p className="text-xl font-bold text-red-700">{showInspect.inspectItems.reduce((s: number, i: any) => s + Number(i.quantity_rejected), 0)} units</p>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setShowInspect(null)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={submitInspection} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-200 disabled:opacity-50 transition-all">
                <Check className="h-4 w-4" />
                {saving ? 'Processing...' : 'Submit Inspection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ VIEW GRN MODAL ═══ */}
      {selectedGRN && !showInspect && !showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white"><FileText className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-lg font-bold font-mono text-gray-900">{selectedGRN.receipt_number}</h3>
                  <p className="text-xs text-gray-500">PO: {selectedGRN.po_number} • {selectedGRN.vendor_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedGRN.status} />
                <button onClick={() => setSelectedGRN(null)} className="p-2 rounded-lg hover:bg-gray-100"><X className="h-5 w-5 text-gray-400" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {(selectedGRN.items || []).map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-sm">Received: <span className="font-bold text-gray-900">{item.quantity_received}</span></p>
                    {Number(item.quantity_accepted) > 0 && (
                      <p className="text-xs text-emerald-600 flex items-center justify-end gap-1"><CheckCircle2 className="h-3 w-3" /> Accepted: {item.quantity_accepted}</p>
                    )}
                    {Number(item.quantity_rejected) > 0 && (
                      <p className="text-xs text-red-600 flex items-center justify-end gap-1"><XCircle className="h-3 w-3" /> Rejected: {item.quantity_rejected}{item.rejection_reason ? ` — ${item.rejection_reason}` : ''}</p>
                    )}
                    {Number(item.unit_cost) > 0 && (
                      <p className="text-xs text-gray-400">Cost: {formatEGP(Number(item.unit_cost))}</p>
                    )}
                  </div>
                </div>
              ))}

              {selectedGRN.notes && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{selectedGRN.notes}</p>
                </div>
              )}

              {selectedGRN.status === 'draft' && (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setSelectedGRN(null); startEdit(selectedGRN); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl text-sm font-bold hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-200 transition-all">
                    <Edit3 className="h-4 w-4" /> Edit GRN
                  </button>
                  <button onClick={() => { setSelectedGRN(null); startInspect(selectedGRN); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-200 transition-all">
                    <ClipboardCheck className="h-4 w-4" /> Start Inspection
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
