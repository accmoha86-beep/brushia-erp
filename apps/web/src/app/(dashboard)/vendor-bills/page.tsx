'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { formatEGP, formatDate, cn } from '@/lib/utils';
import { Plus, RefreshCw, Eye, X, DollarSign, FileText, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

interface Bill { id: string; bill_number: string; vendor_name: string; po_number?: string; bill_date: string; due_date?: string; subtotal: number; tax_amount: number; total: number; amount_paid: number; amount_due: number; currency: string; status: string; payment_count: number; created_at: string; notes?: string; }
interface Vendor { id: string; company_name: string; vendor_code: string; }

const statusColors: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700', partial: 'bg-amber-100 text-amber-700', paid: 'bg-emerald-100 text-emerald-700', overdue: 'bg-red-100 text-red-700', voided: 'bg-gray-200 text-gray-500' };

export default function VendorBillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showPay, setShowPay] = useState<any>(null);

  // Create form
  const [formVendor, setFormVendor] = useState('');
  const [formPO, setFormPO] = useState('');
  const [formBillDate, setFormBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDueDate, setFormDueDate] = useState('');
  const [formSubtotal, setFormSubtotal] = useState('');
  const [formTaxAmount, setFormTaxAmount] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formCurrency, setFormCurrency] = useState('EGP');
  const [saving, setSaving] = useState(false);

  // Payment form
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [payRef, setPayRef] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);

  // POs for linking
  const [pos, setPOs] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [b, v, p] = await Promise.all([
        api.get<any>('/purchasing/bills', filterStatus !== 'all' ? { status: filterStatus } : {}),
        api.get<any>('/purchasing/vendors'),
        api.get<any>('/purchasing/orders'),
      ]);
      setBills(Array.isArray(b) ? b : []);
      setVendors(Array.isArray(v) ? v : []);
      setPOs(p?.data || []);
    } catch { setBills([]); } finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createBill = async () => {
    if (!formVendor) return alert('Select a vendor');
    if (!formSubtotal) return alert('Enter subtotal');
    setSaving(true);
    try {
      await api.post('/purchasing/bills', {
        vendor_id: formVendor,
        purchase_order_id: formPO || null,
        bill_date: formBillDate,
        due_date: formDueDate || null,
        subtotal: parseInt(formSubtotal) || 0,
        tax_amount: parseInt(formTaxAmount) || 0,
        currency: formCurrency,
        notes: formNotes || null,
      });
      setShowCreate(false);
      setFormVendor(''); setFormSubtotal(''); setFormTaxAmount(''); setFormNotes('');
      fetchData();
    } catch (e: any) { alert(e?.message || 'Failed'); } finally { setSaving(false); }
  };

  const viewBill = async (id: string) => {
    try { const r = await api.get<any>(`/purchasing/bills/${id}`); setSelectedBill(r); } catch {}
  };

  const updateBillStatus = async (id: string, status: string) => {
    try { await api.put(`/purchasing/bills/${id}/status`, { status }); if (selectedBill?.id === id) viewBill(id); fetchData(); } catch (e: any) { alert(e?.message || 'Failed'); }
  };

  const submitPayment = async () => {
    if (!showPay || !payAmount) return;
    setSaving(true);
    try {
      await api.post(`/purchasing/bills/${showPay.id}/pay`, {
        amount: parseInt(payAmount) || 0,
        payment_method: payMethod,
        reference: payRef || null,
        payment_date: payDate,
      });
      setShowPay(null);
      setPayAmount(''); setPayRef('');
      fetchData();
    } catch (e: any) { alert(e?.message || 'Failed'); } finally { setSaving(false); }
  };

  const autoCalcTax = (sub: string) => {
    setFormSubtotal(sub);
    const s = parseInt(sub) || 0;
    setFormTaxAmount(String(Math.round(s * 0.14)));
  };

  const fmt = (v: number) => formatEGP(v);
  const totalPayable = bills.filter(b => ['pending','partial','approved'].includes(b.status)).reduce((s, b) => s + Number(b.amount_due || 0), 0);
  const overdueBills = bills.filter(b => b.due_date && new Date(b.due_date) < new Date() && !['paid','voided'].includes(b.status));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Bills</h1>
          <p className="text-sm text-gray-500 mt-1">Track invoices from suppliers and manage payments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"><Plus className="h-4 w-4" />New Bill</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold">{bills.length}</p><p className="text-xs text-gray-500">Total Bills</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold text-amber-600">{fmt(totalPayable)}</p><p className="text-xs text-gray-500">Total Payable</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold text-emerald-600">{bills.filter(b => b.status === 'paid').length}</p><p className="text-xs text-gray-500">Paid Bills</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-2xl font-bold text-red-600">{overdueBills.length}</p><p className="text-xs text-gray-500">Overdue</p></div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all','pending','approved','partial','paid','overdue','voided'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={cn('px-3 py-2 rounded-lg text-sm font-medium capitalize', filterStatus === s ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>{s}</button>
        ))}
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Bill #</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Vendor</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">PO</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Paid</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Due</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Due Date</th>
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? [0,1,2].map(i => <tr key={i}><td colSpan={9} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
            : bills.length === 0 ? <tr><td colSpan={9} className="text-center py-12 text-gray-400"><FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />No vendor bills yet</td></tr>
            : bills.map(b => {
              const isOverdue = b.due_date && new Date(b.due_date) < new Date() && !['paid','voided'].includes(b.status);
              return (
                <tr key={b.id} className={cn('hover:bg-gray-50 cursor-pointer', isOverdue && 'bg-red-50')} onClick={() => viewBill(b.id)}>
                  <td className="px-4 py-3 font-mono font-medium">{b.bill_number}</td>
                  <td className="px-4 py-3 text-gray-700">{b.vendor_name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{b.po_number || '—'}</td>
                  <td className="px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', statusColors[b.status])}>{b.status}</span></td>
                  <td className="px-4 py-3 text-right font-medium">{fmt(Number(b.total))}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{fmt(Number(b.amount_paid))}</td>
                  <td className="px-4 py-3 text-right font-medium text-amber-600">{fmt(Number(b.amount_due))}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{b.due_date ? formatDate(b.due_date) : '—'} {isOverdue && <AlertCircle className="h-3 w-3 text-red-500 inline ml-1" />}</td>
                  <td className="px-4 py-3 text-right flex gap-1">
                    <button onClick={e => { e.stopPropagation(); viewBill(b.id); }} className="text-blue-500 p-1"><Eye className="h-4 w-4" /></button>
                    {!['paid','voided'].includes(b.status) && (
                      <button onClick={e => { e.stopPropagation(); setShowPay(b); setPayAmount(String(Number(b.amount_due))); }} className="text-emerald-500 p-1" title="Pay"><CreditCard className="h-4 w-4" /></button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ═══ CREATE BILL MODAL ═══ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">Create Vendor Bill</h3>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Vendor *</label>
                <select value={formVendor} onChange={e => setFormVendor(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select vendor...</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Linked PO (optional)</label>
                <select value={formPO} onChange={e => setFormPO(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">No linked PO</option>
                  {pos.filter(p => !formVendor || p.vendor_id === formVendor).map(p => <option key={p.id} value={p.id}>{p.po_number} — {p.vendor_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-500 mb-1 block">Bill Date</label><input type="date" value={formBillDate} onChange={e => setFormBillDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-gray-500 mb-1 block">Due Date</label><input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-xs font-medium text-gray-500 mb-1 block">Subtotal (piastres)</label><input type="number" value={formSubtotal} onChange={e => autoCalcTax(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0" /></div>
                <div><label className="text-xs font-medium text-gray-500 mb-1 block">Tax (14% auto)</label><input type="number" value={formTaxAmount} onChange={e => setFormTaxAmount(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-gray-500 mb-1 block">Currency</label><select value={formCurrency} onChange={e => setFormCurrency(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="EGP">EGP</option><option value="USD">USD</option><option value="CNY">CNY</option></select></div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm"><span className="text-gray-500">Total: </span><span className="font-bold text-lg">{fmt((parseInt(formSubtotal)||0) + (parseInt(formTaxAmount)||0))}</span></div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Notes</label><textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={createBill} disabled={saving} className="px-6 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 disabled:opacity-50">{saving ? 'Creating...' : 'Create Bill'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PAY BILL MODAL ═══ */}
      {showPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <div><h3 className="text-lg font-bold">💳 Record Payment</h3><p className="text-sm text-gray-500">{showPay.bill_number} — {showPay.vendor_name}</p></div>
              <button onClick={() => setShowPay(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 rounded-lg p-3 flex justify-between text-sm border border-amber-200">
                <span className="text-amber-700">Amount Due</span>
                <span className="font-bold text-amber-900">{fmt(Number(showPay.amount_due))}</span>
              </div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Payment Amount (piastres)</label><input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Payment Method</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="bank_transfer">Bank Transfer</option><option value="cash">Cash</option><option value="check">Check</option><option value="instapay">InstaPay</option><option value="vodafone_cash">Vodafone Cash</option>
                </select>
              </div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Payment Date</label><input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Reference #</label><input type="text" value={payRef} onChange={e => setPayRef(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Bank transfer ref, check #..." /></div>
            </div>
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setShowPay(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={submitPayment} disabled={saving} className="px-6 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50">{saving ? 'Processing...' : '✅ Record Payment'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ VIEW BILL MODAL ═══ */}
      {selectedBill && !showPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div><h3 className="text-lg font-bold font-mono">{selectedBill.bill_number}</h3><p className="text-sm text-gray-500">{selectedBill.vendor_name}</p></div>
              <div className="flex items-center gap-2">
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', statusColors[selectedBill.status])}>{selectedBill.status}</span>
                <button onClick={() => setSelectedBill(null)}><X className="h-5 w-5 text-gray-400" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500 text-xs">Subtotal</p><p className="font-bold">{fmt(Number(selectedBill.subtotal))}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500 text-xs">Tax</p><p className="font-bold">{fmt(Number(selectedBill.tax_amount))}</p></div>
                <div className="bg-rose-50 rounded-lg p-3 border border-rose-200"><p className="text-rose-700 text-xs">Total</p><p className="font-bold text-rose-700">{fmt(Number(selectedBill.total))}</p></div>
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200"><p className="text-emerald-700 text-xs">Paid</p><p className="font-bold text-emerald-700">{fmt(Number(selectedBill.amount_paid))}</p></div>
              </div>
              {Number(selectedBill.amount_due) > 0 && (
                <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-200">
                  <p className="text-amber-700 text-xs">Remaining Due</p>
                  <p className="text-2xl font-bold text-amber-800">{fmt(Number(selectedBill.amount_due))}</p>
                </div>
              )}

              {/* Status actions */}
              {selectedBill.status === 'pending' && <button onClick={() => updateBillStatus(selectedBill.id, 'approved')} className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">✅ Approve Bill</button>}
              {!['paid','voided'].includes(selectedBill.status) && (
                <button onClick={() => { setSelectedBill(null); setShowPay(selectedBill); setPayAmount(String(Number(selectedBill.amount_due))); }} className="w-full py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600">💳 Record Payment</button>
              )}

              {/* Payment history */}
              {selectedBill.payments?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Payment History</h4>
                  {selectedBill.payments.map((p: any) => (
                    <div key={p.id} className="flex justify-between py-2 border-b border-gray-100 text-sm">
                      <div><p className="font-medium capitalize">{(p.payment_method || '').replace('_', ' ')}</p><p className="text-xs text-gray-400">{formatDate(p.payment_date)} {p.reference && `• ${p.reference}`}</p></div>
                      <p className="font-medium text-emerald-600">{fmt(Number(p.amount))}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedBill.po_number && <div className="text-sm"><span className="text-gray-500">Linked PO: </span><span className="font-mono font-medium">{selectedBill.po_number}</span></div>}
              {selectedBill.notes && <div className="text-sm"><p className="text-gray-500 text-xs mb-1">Notes</p><p>{selectedBill.notes}</p></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
