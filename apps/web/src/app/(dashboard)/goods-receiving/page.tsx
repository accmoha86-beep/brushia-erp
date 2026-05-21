'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { formatEGP, formatDate, cn } from '@/lib/utils';
import { Plus, RefreshCw, Eye, X, Package, Check, XCircle, AlertTriangle, ClipboardCheck, Truck } from 'lucide-react';

interface GRN { id: string; receipt_number: string; po_number: string; vendor_name: string; warehouse_id: string; status: string; item_count: number; total_qty_received: number; received_by_email: string; created_at: string; notes?: string; }
interface PO { id: string; po_number: string; vendor_name: string; status: string; items: any[]; warehouse_id: string; }

const statusColors: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', inspecting: 'bg-yellow-100 text-yellow-700', accepted: 'bg-emerald-100 text-emerald-700', partial_accepted: 'bg-amber-100 text-amber-700', rejected: 'bg-red-100 text-red-700' };

export default function GoodsReceivingPage() {
  const [grns, setGRNs] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState<any>(null);
  const [showInspect, setShowInspect] = useState<any>(null);

  // Create form
  const [eligiblePOs, setEligiblePOs] = useState<PO[]>([]);
  const [selectedPO, setSelectedPO] = useState<PO | null>(null);
  const [receiveItems, setReceiveItems] = useState<{po_item_id:string; product_id:string; variant_id:string|null; product_name:string; sku:string; quantity_ordered:number; quantity_received:number; already_received:number; unit_cost:number; landed_unit_cost:number}[]>([]);
  const [grnNotes, setGrnNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchGRNs = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get<any>('/purchasing/grn'); setGRNs(Array.isArray(r) ? r : []); } catch { setGRNs([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGRNs(); }, [fetchGRNs]);

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
        quantity_ordered: item.quantity_ordered,
        already_received: item.quantity_received || 0,
        quantity_received: item.quantity_ordered - (item.quantity_received || 0),
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
          po_item_id: i.po_item_id,
          product_id: i.product_id,
          variant_id: i.variant_id,
          quantity_received: i.quantity_received,
          unit_cost: i.unit_cost,
          landed_unit_cost: i.landed_unit_cost,
        })),
      });
      setShowCreate(false);
      setSelectedPO(null);
      setReceiveItems([]);
      fetchGRNs();
    } catch (e: any) { alert(e?.message || 'Failed'); } finally { setSaving(false); }
  };

  const viewGRN = async (id: string) => {
    try { const r = await api.get<any>(`/purchasing/grn/${id}`); setSelectedGRN(r); } catch {}
  };

  const startInspect = async (grn: any) => {
    const detail = await api.get<any>(`/purchasing/grn/${grn.id}`);
    setShowInspect({
      ...detail,
      inspectItems: (detail.items || []).map((item: any) => ({
        item_id: item.id,
        po_item_id: item.po_item_id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product_name,
        quantity_received: item.quantity_received,
        quantity_accepted: item.quantity_received,
        quantity_rejected: 0,
        rejection_reason: '',
      })),
    });
  };

  const submitInspection = async () => {
    if (!showInspect) return;
    setSaving(true);
    try {
      await api.post(`/purchasing/grn/${showInspect.id}/accept`, {
        items: showInspect.inspectItems.map((i: any) => ({
          item_id: i.item_id,
          po_item_id: i.po_item_id,
          product_id: i.product_id,
          variant_id: i.variant_id,
          quantity_accepted: i.quantity_accepted,
          quantity_rejected: i.quantity_rejected,
          rejection_reason: i.rejection_reason || null,
        })),
      });
      setShowInspect(null);
      fetchGRNs();
    } catch (e: any) { alert(e?.message || 'Failed'); } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goods Receiving</h1>
          <p className="text-sm text-gray-500 mt-1">Receive, inspect, and accept goods from purchase orders</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchGRNs} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={startCreate} className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"><Plus className="h-4 w-4" />Receive Goods</button>
        </div>
      </div>

      {/* GRN List */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-500">GRN #</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">PO #</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Vendor</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Items</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Qty Received</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Received By</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? [0,1,2].map(i => <tr key={i}><td colSpan={9} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
            : grns.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-gray-400">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                No goods received yet. Click "Receive Goods" to get started.
              </td></tr>
            ) : grns.map(g => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium text-blue-600">{g.receipt_number}</td>
                <td className="px-4 py-3 font-mono text-sm">{g.po_number}</td>
                <td className="px-4 py-3 text-gray-700">{g.vendor_name}</td>
                <td className="px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', statusColors[g.status])}>{g.status.replace('_', ' ')}</span></td>
                <td className="px-4 py-3 text-right">{g.item_count}</td>
                <td className="px-4 py-3 text-right font-medium">{g.total_qty_received}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{g.received_by_email}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(g.created_at)}</td>
                <td className="px-4 py-3 text-right flex gap-1">
                  <button onClick={() => viewGRN(g.id)} className="text-blue-500 hover:text-blue-600 p-1"><Eye className="h-4 w-4" /></button>
                  {g.status === 'draft' && <button onClick={() => startInspect(g)} className="text-amber-500 hover:text-amber-600 p-1" title="Inspect"><ClipboardCheck className="h-4 w-4" /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ CREATE GRN MODAL ═══ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">📦 Receive Goods</h3>
              <button onClick={() => { setShowCreate(false); setSelectedPO(null); }}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-6">
              {!selectedPO ? (
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Select Purchase Order to receive against:</h4>
                  {eligiblePOs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">No eligible POs (must be approved/ordered/partial_received)</div>
                  ) : (
                    <div className="space-y-2">
                      {eligiblePOs.map(po => (
                        <button key={po.id} onClick={() => selectPO(po.id)} className="w-full text-left border rounded-xl p-4 hover:bg-gray-50 flex justify-between items-center">
                          <div>
                            <p className="font-mono font-medium">{po.po_number}</p>
                            <p className="text-sm text-gray-500">{po.vendor_name} • {po.item_count} items</p>
                          </div>
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', statusColors[po.status] || 'bg-gray-100')}>{po.status.replace('_',' ')}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p className="font-medium text-blue-900">Receiving against: {selectedPO.po_number}</p>
                    <p className="text-sm text-blue-700">{selectedPO.vendor_name}</p>
                  </div>

                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50"><tr>
                        <th className="text-left px-3 py-2 text-xs">Product</th>
                        <th className="text-right px-3 py-2 text-xs">Ordered</th>
                        <th className="text-right px-3 py-2 text-xs">Previously Received</th>
                        <th className="text-right px-3 py-2 text-xs">Remaining</th>
                        <th className="text-right px-3 py-2 text-xs">Receiving Now</th>
                      </tr></thead>
                      <tbody className="divide-y">
                        {receiveItems.map((item, idx) => {
                          const remaining = item.quantity_ordered - item.already_received;
                          return (
                            <tr key={idx} className={remaining <= 0 ? 'opacity-50' : ''}>
                              <td className="px-3 py-2"><p className="font-medium">{item.product_name}</p><p className="text-xs text-gray-400">{item.sku}</p></td>
                              <td className="px-3 py-2 text-right">{item.quantity_ordered}</td>
                              <td className="px-3 py-2 text-right text-gray-500">{item.already_received}</td>
                              <td className="px-3 py-2 text-right font-medium text-amber-600">{remaining}</td>
                              <td className="px-3 py-2 text-right">
                                <input type="number" min="0" max={remaining} value={item.quantity_received}
                                  onChange={e => { const copy = [...receiveItems]; copy[idx].quantity_received = Math.min(parseInt(e.target.value) || 0, remaining); setReceiveItems(copy); }}
                                  className="w-20 border rounded px-2 py-1 text-right text-sm" disabled={remaining <= 0} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Notes</label>
                    <textarea value={grnNotes} onChange={e => setGrnNotes(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Delivery condition, discrepancies..." />
                  </div>

                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-sm">
                    <p className="font-medium text-emerald-800">
                      Total receiving: {receiveItems.reduce((s, i) => s + i.quantity_received, 0)} units across {receiveItems.filter(i => i.quantity_received > 0).length} items
                    </p>
                  </div>
                </div>
              )}
            </div>
            {selectedPO && (
              <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-between">
                <button onClick={() => setSelectedPO(null)} className="px-4 py-2 border rounded-lg text-sm">← Back to PO list</button>
                <button onClick={createGRN} disabled={saving} className="px-6 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50">{saving ? 'Creating...' : '✅ Confirm Receipt'}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ INSPECT GRN MODAL ═══ */}
      {showInspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div><h3 className="text-lg font-bold">🔍 Inspect {showInspect.receipt_number}</h3><p className="text-sm text-gray-500">Accept or reject received items → updates inventory</p></div>
              <button onClick={() => setShowInspect(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-6">
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr>
                    <th className="text-left px-3 py-2 text-xs">Product</th>
                    <th className="text-right px-3 py-2 text-xs">Received</th>
                    <th className="text-right px-3 py-2 text-xs">Accept</th>
                    <th className="text-right px-3 py-2 text-xs">Reject</th>
                    <th className="text-left px-3 py-2 text-xs">Reason</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {showInspect.inspectItems.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-medium">{item.product_name}</td>
                        <td className="px-3 py-2 text-right">{item.quantity_received}</td>
                        <td className="px-3 py-2 text-right">
                          <input type="number" min="0" max={item.quantity_received} value={item.quantity_accepted}
                            onChange={e => { const copy = {...showInspect}; copy.inspectItems[idx].quantity_accepted = Math.min(parseInt(e.target.value)||0, item.quantity_received); copy.inspectItems[idx].quantity_rejected = item.quantity_received - copy.inspectItems[idx].quantity_accepted; setShowInspect({...copy}); }}
                            className="w-16 border rounded px-2 py-1 text-right text-sm" />
                        </td>
                        <td className="px-3 py-2 text-right text-red-600 font-medium">{item.quantity_rejected}</td>
                        <td className="px-3 py-2">
                          {item.quantity_rejected > 0 && <input type="text" value={item.rejection_reason} onChange={e => { const copy = {...showInspect}; copy.inspectItems[idx].rejection_reason = e.target.value; setShowInspect({...copy}); }} className="w-full border rounded px-2 py-1 text-xs" placeholder="Damaged, wrong color..." />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setShowInspect(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
                <button onClick={submitInspection} disabled={saving} className="px-6 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50">{saving ? 'Processing...' : '✅ Submit Inspection'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ VIEW GRN MODAL ═══ */}
      {selectedGRN && !showInspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div><h3 className="text-lg font-bold font-mono">{selectedGRN.receipt_number}</h3><p className="text-sm text-gray-500">PO: {selectedGRN.po_number} • {selectedGRN.vendor_name}</p></div>
              <div className="flex items-center gap-3">
                <span className={cn('px-3 py-1 rounded-full text-xs font-medium capitalize', statusColors[selectedGRN.status])}>{selectedGRN.status.replace('_',' ')}</span>
                <button onClick={() => setSelectedGRN(null)}><X className="h-5 w-5 text-gray-400" /></button>
              </div>
            </div>
            <div className="p-6">
              {selectedGRN.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between py-3 border-b border-gray-100 text-sm">
                  <div><p className="font-medium">{item.product_name}</p><p className="text-xs text-gray-400">{item.sku}</p></div>
                  <div className="text-right">
                    <p>Received: <span className="font-medium">{item.quantity_received}</span></p>
                    {item.quantity_accepted > 0 && <p className="text-emerald-600 text-xs">Accepted: {item.quantity_accepted}</p>}
                    {item.quantity_rejected > 0 && <p className="text-red-600 text-xs">Rejected: {item.quantity_rejected} — {item.rejection_reason}</p>}
                  </div>
                </div>
              ))}
              {selectedGRN.notes && <p className="mt-4 text-sm text-gray-500">{selectedGRN.notes}</p>}
              {selectedGRN.status === 'draft' && (
                <button onClick={() => { setSelectedGRN(null); startInspect(selectedGRN); }} className="mt-4 w-full py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600">🔍 Start Inspection</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
