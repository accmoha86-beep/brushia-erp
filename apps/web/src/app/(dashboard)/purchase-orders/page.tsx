'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api-client';
import { formatEGP, formatDate, cn } from '@/lib/utils';
import { Plus, Search, Eye, X, RefreshCw, FileText, ChevronRight, Package, TruckIcon, DollarSign, Send, Check, XCircle, Edit, ArrowRight } from 'lucide-react';

interface PO { id: string; po_number: string; vendor_name: string; status: string; expected_date?: string; subtotal: number; total: number; total_landed_cost: number; item_count: number; grn_count: number; china_shipping_cost: number; china_agent_fee: number; egypt_customs_duty: number; egypt_clearance_fee: number; egypt_local_shipping: number; other_costs: number; currency: string; exchange_rate: number; created_at: string; warehouse_id: string; notes?: string; }
interface Vendor { id: string; company_name: string; vendor_code: string; country: string; default_currency: string; }
interface Product { id: string; name: string; sku: string; base_price: number; }
interface Warehouse { id: string; name: string; code: string; }

const statusColors: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', submitted: 'bg-blue-100 text-blue-700', approved: 'bg-indigo-100 text-indigo-700', ordered: 'bg-purple-100 text-purple-700', partial_received: 'bg-yellow-100 text-yellow-700', received: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700', closed: 'bg-gray-200 text-gray-700' };
const statusFlow = ['draft','submitted','approved','ordered','partial_received','received','closed'];

export default function PurchaseOrdersPage() {
  const { t, locale, isRTL } = useI18n();
  const [pos, setPOs] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState<any>(null);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Create form state
  const [formVendor, setFormVendor] = useState('');
  const [formWarehouse, setFormWarehouse] = useState('');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formExRate, setFormExRate] = useState('48.50');
  const [formExpected, setFormExpected] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<{product_id:string; product_name:string; sku:string; quantity_ordered:number; unit_cost:number}[]>([]);
  // Landed costs
  const [chinaShipping, setChinaShipping] = useState('0');
  const [chinaAgent, setChinaAgent] = useState('0');
  const [egyptCustoms, setEgyptCustoms] = useState('0');
  const [egyptClearance, setEgyptClearance] = useState('0');
  const [egyptLocal, setEgyptLocal] = useState('0');
  const [otherCosts, setOtherCosts] = useState('0');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      const [res, s, v, p, w] = await Promise.all([
        api.get<any>('/purchasing/orders', params),
        api.get<any>('/purchasing/stats'),
        api.get<any>('/purchasing/vendors'),
        api.get<any>('/catalog/products'),
        api.get<any>('/warehouses').catch(() => []),
      ]);
      setPOs(res?.data || []);
      setStats(s);
      setVendors(Array.isArray(v) ? v : []);
      const prodList = Array.isArray(p) ? p : (p?.data || []);
      setProducts(prodList);
      setWarehouses(Array.isArray(w) ? w : (w?.data || []));
    } catch { setPOs([]); } finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const viewPO = async (id: string) => {
    try { const d = await api.get<any>(`/purchasing/orders/${id}`); setSelectedPO(d); } catch {}
  };

  const updateStatus = async (id: string, status: string) => {
    try { await api.put(`/purchasing/orders/${id}/status`, { status }); if (selectedPO?.id === id) viewPO(id); fetchData(); } catch (e: any) { alert(e?.message || 'Failed'); }
  };

  const getNextStatus = (current: string) => {
    const map: Record<string, string[]> = { draft: ['submitted','cancelled'], submitted: ['approved','cancelled'], approved: ['ordered','cancelled'], ordered: ['partial_received','received'], partial_received: ['received'], received: ['closed'] };
    return map[current] || [];
  };

  const subtotal = formItems.reduce((s, i) => s + i.quantity_ordered * i.unit_cost, 0);
  const landedTotal = [chinaShipping, chinaAgent, egyptCustoms, egyptClearance, egyptLocal, otherCosts].reduce((s, v) => s + (parseInt(v) || 0), 0);
  const totalQty = formItems.reduce((s, i) => s + i.quantity_ordered, 0);
  const landedPerUnit = totalQty > 0 ? Math.round(landedTotal / totalQty) : 0;

  const addItem = (p: Product) => {
    if (formItems.find(i => i.product_id === p.id)) return;
    setFormItems([...formItems, { product_id: p.id, product_name: p.name, sku: p.sku, quantity_ordered: 1, unit_cost: 0 }]);
  };

  const removeItem = (idx: number) => setFormItems(formItems.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, val: any) => {
    const copy = [...formItems]; (copy[idx] as any)[field] = val; setFormItems(copy);
  };

  const savePO = async () => {
    if (!formVendor) return alert('Select a vendor');
    if (formItems.length === 0) return alert('Add at least one item');
    setSaving(true);
    try {
      await api.post('/purchasing/orders', {
        vendor_id: formVendor,
        warehouse_id: formWarehouse || null,
        currency: formCurrency,
        exchange_rate: parseFloat(formExRate) || 1,
        expected_date: formExpected || null,
        notes: formNotes || null,
        china_shipping_cost: parseInt(chinaShipping) || 0,
        china_agent_fee: parseInt(chinaAgent) || 0,
        egypt_customs_duty: parseInt(egyptCustoms) || 0,
        egypt_clearance_fee: parseInt(egyptClearance) || 0,
        egypt_local_shipping: parseInt(egyptLocal) || 0,
        other_costs: parseInt(otherCosts) || 0,
        items: formItems.map(i => ({ product_id: i.product_id, product_name: i.product_name, sku: i.sku, quantity_ordered: i.quantity_ordered, unit_cost: i.unit_cost })),
      });
      setShowCreate(false);
      setFormItems([]); setFormVendor(''); setFormNotes('');
      setChinaShipping('0'); setChinaAgent('0'); setEgyptCustoms('0'); setEgyptClearance('0'); setEgyptLocal('0'); setOtherCosts('0');
      fetchData();
    } catch (e: any) { alert(e?.message || 'Failed to create PO'); } finally { setSaving(false); }
  };

  const fmt = (v: number) => formatEGP(v);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage orders from China & local suppliers with landed cost tracking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"><Plus className="h-4 w-4" />New PO</button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold">{stats.total_pos}</p><p className="text-xs text-gray-500">Total POs</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold text-yellow-600">{stats.draft_count}</p><p className="text-xs text-gray-500">Drafts</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold text-blue-600">{stats.pending_count}</p><p className="text-xs text-gray-500">In Progress</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold text-emerald-600">{stats.received_count}</p><p className="text-xs text-gray-500">Received</p></div>
          <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold text-rose-600">{fmt(Number(stats.total_payable || 0))}</p><p className="text-xs text-gray-500">Total Payable</p></div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all','draft','submitted','approved','ordered','partial_received','received','cancelled'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={cn('px-3 py-2 rounded-lg text-sm font-medium capitalize', filterStatus === s ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>{s.replace('_', ' ')}</button>
        ))}
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-500">PO #</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Vendor</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">{t('common.status')}</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Items</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Subtotal</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Landed Cost</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">GRNs</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? [0,1,2].map(i => <tr key={i}><td colSpan={9} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
            : pos.length === 0 ? <tr><td colSpan={9} className="text-center py-12 text-gray-400"><FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />No purchase orders yet — create your first one!</td></tr>
            : pos.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => viewPO(p.id)}>
                <td className="px-4 py-3 font-mono font-medium text-rose-600">{p.po_number}</td>
                <td className="px-4 py-3 text-gray-700">{p.vendor_name || '—'}</td>
                <td className="px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', statusColors[p.status])}>{p.status.replace('_',' ')}</span></td>
                <td className="px-4 py-3 text-right">{p.item_count}</td>
                <td className="px-4 py-3 text-right font-medium">{fmt(Number(p.subtotal || 0))}</td>
                <td className="px-4 py-3 text-right text-amber-600 font-medium">{fmt(Number(p.total_landed_cost || 0))}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{p.grn_count} GRN</span></td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(p.created_at)}</td>
                <td className="px-4 py-3 text-right"><Eye className="h-4 w-4 text-gray-400" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ CREATE PO MODAL ═══ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">Create Purchase Order</h3>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Vendor + Warehouse + Currency */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Vendor *</label>
                  <select value={formVendor} onChange={e => { setFormVendor(e.target.value); const v = vendors.find(x => x.id === e.target.value); if (v) setFormCurrency(v.default_currency); }} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select vendor...</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name} ({v.vendor_code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Warehouse</label>
                  <select value={formWarehouse} onChange={e => setFormWarehouse(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select...</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Expected Date</label>
                  <input type="date" value={formExpected} onChange={e => setFormExpected(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Currency</label>
                  <select value={formCurrency} onChange={e => setFormCurrency(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="USD">USD (US Dollar)</option><option value="CNY">CNY (Chinese Yuan)</option><option value="EGP">EGP (Egyptian Pound)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Exchange Rate → EGP</label>
                  <input type="number" step="0.01" value={formExRate} onChange={e => setFormExRate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-700">📦 Order Items</h4>
                  <div className="relative">
                    <select onChange={e => { const p = products.find(x => x.id === e.target.value); if (p) addItem(p); e.target.value = ''; }} className="border rounded-lg px-3 py-2 text-sm text-gray-600">
                      <option value="">+ Add product...</option>
                      {products.filter(p => !formItems.find(i => i.product_id === p.id)).map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                  </div>
                </div>
                {formItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 border rounded-xl border-dashed">Select products to add to this order</div>
                ) : (
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50"><tr>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Product</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Qty</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Unit Cost (piastres)</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Total</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Landed/Unit</th>
                        <th className="px-2 py-2"></th>
                      </tr></thead>
                      <tbody className="divide-y">
                        {formItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2"><p className="font-medium">{item.product_name}</p><p className="text-xs text-gray-400">{item.sku}</p></td>
                            <td className="px-3 py-2 text-right"><input type="number" min="1" value={item.quantity_ordered} onChange={e => updateItem(idx, 'quantity_ordered', parseInt(e.target.value) || 1)} className="w-20 border rounded px-2 py-1 text-right text-sm" /></td>
                            <td className="px-3 py-2 text-right"><input type="number" min="0" value={item.unit_cost} onChange={e => updateItem(idx, 'unit_cost', parseInt(e.target.value) || 0)} className="w-28 border rounded px-2 py-1 text-right text-sm" /></td>
                            <td className="px-3 py-2 text-right font-medium">{fmt(item.quantity_ordered * item.unit_cost)}</td>
                            <td className="px-3 py-2 text-right text-amber-600">{fmt(item.unit_cost + landedPerUnit)}</td>
                            <td className="px-2 py-2"><button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><XCircle className="h-4 w-4" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Landed Costs */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <h4 className="font-semibold text-amber-800 mb-3">🚢 Landed Cost Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div><label className="text-xs text-amber-700">🇨🇳 China Shipping</label><input type="number" value={chinaShipping} onChange={e => setChinaShipping(e.target.value)} className="w-full border border-amber-300 rounded px-3 py-2 text-sm bg-white" /></div>
                  <div><label className="text-xs text-amber-700">🇨🇳 Agent Fee</label><input type="number" value={chinaAgent} onChange={e => setChinaAgent(e.target.value)} className="w-full border border-amber-300 rounded px-3 py-2 text-sm bg-white" /></div>
                  <div><label className="text-xs text-amber-700">🇪🇬 Customs Duty</label><input type="number" value={egyptCustoms} onChange={e => setEgyptCustoms(e.target.value)} className="w-full border border-amber-300 rounded px-3 py-2 text-sm bg-white" /></div>
                  <div><label className="text-xs text-amber-700">🇪🇬 Clearance Fee</label><input type="number" value={egyptClearance} onChange={e => setEgyptClearance(e.target.value)} className="w-full border border-amber-300 rounded px-3 py-2 text-sm bg-white" /></div>
                  <div><label className="text-xs text-amber-700">🇪🇬 Local Shipping</label><input type="number" value={egyptLocal} onChange={e => setEgyptLocal(e.target.value)} className="w-full border border-amber-300 rounded px-3 py-2 text-sm bg-white" /></div>
                  <div><label className="text-xs text-amber-700">Other Costs</label><input type="number" value={otherCosts} onChange={e => setOtherCosts(e.target.value)} className="w-full border border-amber-300 rounded px-3 py-2 text-sm bg-white" /></div>
                </div>
                <div className="mt-3 flex justify-between text-sm font-medium text-amber-900">
                  <span>Total Landed Costs: {fmt(landedTotal)}</span>
                  <span>Per Unit: {fmt(landedPerUnit)} × {totalQty} units</span>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal ({formItems.length} items)</span><span className="font-medium">{fmt(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Landed Costs</span><span className="font-medium text-amber-600">{fmt(landedTotal)}</span></div>
                <div className="flex justify-between text-base font-bold border-t pt-2"><span>Grand Total (Landed)</span><span className="text-rose-600">{fmt(subtotal + landedTotal)}</span></div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Notes</label>
                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Internal notes..." />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={savePO} disabled={saving} className="px-6 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 disabled:opacity-50">{saving ? 'Creating...' : 'Create Purchase Order'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PO DETAIL MODAL ═══ */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold font-mono">{selectedPO.po_number}</h3>
                <p className="text-sm text-gray-500">{selectedPO.vendor_name}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn('px-3 py-1 rounded-full text-xs font-medium capitalize', statusColors[selectedPO.status])}>{selectedPO.status.replace('_',' ')}</span>
                <button onClick={() => setSelectedPO(null)}><X className="h-5 w-5 text-gray-400" /></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Status actions */}
              {getNextStatus(selectedPO.status).length > 0 && (
                <div className="flex gap-2">
                  {getNextStatus(selectedPO.status).map(s => (
                    <button key={s} onClick={() => updateStatus(selectedPO.id, s)} className={cn('px-4 py-2 rounded-lg text-sm font-medium capitalize flex items-center gap-1', s === 'cancelled' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-rose-500 text-white hover:bg-rose-600')}>
                      <ArrowRight className="h-3 w-3" />{s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              )}

              {/* Cost breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500 text-xs">Subtotal</p><p className="font-bold">{fmt(Number(selectedPO.subtotal || 0))}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500 text-xs">Tax (14%)</p><p className="font-bold">{fmt(Number(selectedPO.tax_amount || 0))}</p></div>
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200"><p className="text-amber-700 text-xs">Landed Total</p><p className="font-bold text-amber-700">{fmt(Number(selectedPO.total_landed_cost || 0))}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500 text-xs">Currency</p><p className="font-bold">{selectedPO.currency} @ {selectedPO.exchange_rate}</p></div>
              </div>

              {/* Landed cost details */}
              {(Number(selectedPO.china_shipping_cost) > 0 || Number(selectedPO.egypt_customs_duty) > 0) && (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 text-xs space-y-1">
                  <p className="font-medium text-amber-800 mb-1">🚢 Landed Cost Breakdown</p>
                  <div className="grid grid-cols-3 gap-2">
                    <span>🇨🇳 Shipping: {fmt(Number(selectedPO.china_shipping_cost))}</span>
                    <span>🇨🇳 Agent: {fmt(Number(selectedPO.china_agent_fee))}</span>
                    <span>🇪🇬 Customs: {fmt(Number(selectedPO.egypt_customs_duty))}</span>
                    <span>🇪🇬 Clearance: {fmt(Number(selectedPO.egypt_clearance_fee))}</span>
                    <span>🇪🇬 Local: {fmt(Number(selectedPO.egypt_local_shipping))}</span>
                    <span>Other: {fmt(Number(selectedPO.other_costs))}</span>
                  </div>
                </div>
              )}

              {/* Items */}
              {selectedPO.items?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Items ({selectedPO.items.length})</h4>
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50"><tr>
                        <th className="text-left px-3 py-2 text-xs">Product</th>
                        <th className="text-right px-3 py-2 text-xs">Ordered</th>
                        <th className="text-right px-3 py-2 text-xs">Received</th>
                        <th className="text-right px-3 py-2 text-xs">Unit Cost</th>
                        <th className="text-right px-3 py-2 text-xs">Landed/Unit</th>
                        <th className="text-right px-3 py-2 text-xs">Total</th>
                      </tr></thead>
                      <tbody className="divide-y">
                        {selectedPO.items.map((item: any, i: number) => (
                          <tr key={i}>
                            <td className="px-3 py-2"><p className="font-medium">{item.product_name || item.current_product_name || 'Product'}</p><p className="text-xs text-gray-400">{item.sku}</p></td>
                            <td className="px-3 py-2 text-right">{item.quantity_ordered}</td>
                            <td className="px-3 py-2 text-right"><span className={item.quantity_received >= item.quantity_ordered ? 'text-emerald-600 font-medium' : 'text-amber-600'}>{item.quantity_received || 0}</span></td>
                            <td className="px-3 py-2 text-right">{fmt(Number(item.unit_cost))}</td>
                            <td className="px-3 py-2 text-right text-amber-600">{fmt(Number(item.landed_unit_cost))}</td>
                            <td className="px-3 py-2 text-right font-medium">{fmt(Number(item.total_cost))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* GRNs */}
              {selectedPO.goods_receipts?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">📦 Goods Receive Notes ({selectedPO.goods_receipts.length})</h4>
                  {selectedPO.goods_receipts.map((grn: any) => (
                    <div key={grn.id} className="border rounded-lg p-3 mb-2 flex justify-between items-center">
                      <div>
                        <p className="font-mono font-medium text-sm">{grn.receipt_number}</p>
                        <p className="text-xs text-gray-500">{formatDate(grn.created_at)} • by {grn.received_by_email}</p>
                      </div>
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', grn.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : grn.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>{grn.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedPO.notes && <div className="text-sm"><p className="text-gray-500 text-xs mb-1">Notes</p><p className="text-gray-700">{selectedPO.notes}</p></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
