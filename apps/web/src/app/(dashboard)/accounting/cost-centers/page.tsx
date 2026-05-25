'use client';

import { useState, useEffect, useCallback } from 'react';

const API = '/api/v1/accounting/cost-centers';

function getToken() {
  try {
    const raw = localStorage.getItem('brushia-auth');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return parsed?.state?.token || '';
  } catch { return ''; }
}

async function apiFetch(url: string, opts: any = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

const fmtEGP = (v: any) => {
  const n = Number(v || 0) / 100;
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(n);
};

const TYPE_CONFIG: Record<string, { label: string; labelAr: string; color: string; icon: string }> = {
  branch:     { label: 'Branch',      labelAr: 'فرع',      color: 'bg-blue-100 text-blue-800',    icon: '🏪' },
  department: { label: 'Department',  labelAr: 'قسم',      color: 'bg-purple-100 text-purple-800', icon: '🏢' },
  exhibition: { label: 'Exhibition',  labelAr: 'معرض',     color: 'bg-amber-100 text-amber-800',   icon: '🎪' },
  project:    { label: 'Project',     labelAr: 'مشروع',    color: 'bg-green-100 text-green-800',   icon: '📋' },
};

interface CostCenter {
  id: string; code: string; name: string; name_ar?: string; type: string;
  branch_name?: string; is_active: boolean; budget_amount?: string;
  transaction_count?: string; total_debits?: string; total_credits?: string;
  description?: string;
}

export default function CostCentersPage() {
  const [centers, setCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<CostCenter | null>(null);
  const [detailItem, setDetailItem] = useState<CostCenter | null>(null);
  const [detailReport, setDetailReport] = useState<any>(null);
  const [form, setForm] = useState({ code: '', name: '', name_ar: '', type: 'branch', branch_id: '', budget_amount: '', description: '' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const typeParam = filterType !== 'all' ? `?type=${filterType}` : '';
      const res = await apiFetch(`${API}${typeParam}`);
      setCenters(res.data || []);
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ code: '', name: '', name_ar: '', type: 'branch', branch_id: '', budget_amount: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (cc: CostCenter) => {
    setEditItem(cc);
    setForm({
      code: cc.code, name: cc.name, name_ar: cc.name_ar || '', type: cc.type,
      branch_id: '', budget_amount: String(Number(cc.budget_amount || 0) / 100),
      description: cc.description || '',
    });
    setShowModal(true);
  };

  const openDetail = async (cc: CostCenter) => {
    setDetailItem(cc);
    try {
      const report = await apiFetch(`${API}/${cc.id}/report`);
      setDetailReport(report);
    } catch { setDetailReport(null); }
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, budget_amount: Math.round(Number(form.budget_amount || 0) * 100) };
      if (editItem) {
        await apiFetch(`${API}/${editItem.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch(API, { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowModal(false);
      loadData();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleDelete = async (cc: CostCenter) => {
    if (!confirm(`Delete cost center "${cc.name}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`${API}/${cc.id}`, { method: 'DELETE' });
      loadData();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // Stats
  const totalBudget = centers.reduce((s, c) => s + Number(c.budget_amount || 0), 0);
  const totalDebits = centers.reduce((s, c) => s + Number(c.total_debits || 0), 0);
  const totalCredits = centers.reduce((s, c) => s + Number(c.total_credits || 0), 0);
  const activeCount = centers.filter(c => c.is_active).length;
  const branchCount = centers.filter(c => c.type === 'branch').length;
  const deptCount = centers.filter(c => c.type === 'department').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 Cost Centers</h1>
          <p className="text-sm text-gray-500 mt-1">مراكز التكلفة — Track revenue & expenses by branch, department, or project</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm">
          + Add Cost Center
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Centers', value: centers.length, sub: `${activeCount} active`, icon: '🎯', gradient: 'from-indigo-500 to-blue-600' },
          { label: 'Branch Centers', value: branchCount, sub: `${deptCount} departments`, icon: '🏪', gradient: 'from-emerald-500 to-teal-600' },
          { label: 'Total Budget', value: fmtEGP(totalBudget), sub: 'Allocated', icon: '💵', gradient: 'from-amber-500 to-orange-600' },
          { label: 'Total Debits', value: fmtEGP(totalDebits), sub: `Credits: ${fmtEGP(totalCredits)}`, icon: '📊', gradient: 'from-rose-500 to-pink-600' },
        ].map((s, i) => (
          <div key={i} className="relative overflow-hidden rounded-xl bg-white shadow-sm border p-5">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${s.gradient} opacity-10 rounded-bl-full`} />
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'branch', 'department', 'exhibition', 'project'].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filterType === t ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {t === 'all' ? '🔍 All' : `${TYPE_CONFIG[t]?.icon || ''} ${TYPE_CONFIG[t]?.label || t}`}
          </button>
        ))}
      </div>

      {/* Error / Loading */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error}</div>}
      {loading && <div className="text-center py-8 text-gray-400">Loading cost centers...</div>}

      {/* Cost Centers Table */}
      {!loading && centers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Code</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Arabic</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Branch</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Budget</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Transactions</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {centers.map((cc) => {
                const cfg = TYPE_CONFIG[cc.type] || TYPE_CONFIG.branch;
                return (
                  <tr key={cc.id} className="hover:bg-gray-50 cursor-pointer transition" onClick={() => openDetail(cc)}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{cc.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{cc.name}</td>
                    <td className="px-4 py-3 text-gray-500" dir="rtl">{cc.name_ar || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{cc.branch_name || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">{fmtEGP(cc.budget_amount)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{Number(cc.transaction_count || 0)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${cc.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </td>
                    <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(cc)} className="text-indigo-600 hover:text-indigo-800 text-xs mr-2">Edit</button>
                      <button onClick={() => handleDelete(cc)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {!loading && centers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border">
          <div className="text-4xl mb-3">💰</div>
          <div className="text-gray-500">No cost centers found</div>
          <button onClick={openCreate} className="mt-3 text-indigo-600 hover:underline text-sm">Create your first cost center</button>
        </div>
      )}

      {/* Detail Panel */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailItem(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{TYPE_CONFIG[detailItem.type]?.icon} {detailItem.name}</h2>
                <p className="text-sm text-gray-500">{detailItem.code} — {detailItem.name_ar || ''}</p>
              </div>
              <button onClick={() => setDetailItem(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-lg font-bold text-blue-700">{fmtEGP(detailItem.total_debits)}</div>
                <div className="text-xs text-blue-500">Total Debits</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-lg font-bold text-green-700">{fmtEGP(detailItem.total_credits)}</div>
                <div className="text-xs text-green-500">Total Credits</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="text-lg font-bold text-amber-700">{fmtEGP(detailItem.budget_amount)}</div>
                <div className="text-xs text-amber-500">Budget</div>
              </div>
            </div>

            {detailReport?.summary?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">📊 Breakdown by Account Type</h3>
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  {detailReport.summary.map((s: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">{s.account_type}</span>
                      <span className="font-medium">Dr: {fmtEGP(s.total_debit)} | Cr: {fmtEGP(s.total_credit)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailReport?.recentTransactions?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">📝 Recent Transactions</h3>
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left">Entry</th>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Account</th>
                        <th className="px-3 py-2 text-right">Debit</th>
                        <th className="px-3 py-2 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {detailReport.recentTransactions.map((t: any, i: number) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-mono">{t.entry_number}</td>
                          <td className="px-3 py-2">{t.date}</td>
                          <td className="px-3 py-2">{t.account_name}</td>
                          <td className="px-3 py-2 text-right">{fmtEGP(t.debit)}</td>
                          <td className="px-3 py-2 text-right">{fmtEGP(t.credit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(!detailReport?.recentTransactions || detailReport.recentTransactions.length === 0) && (
              <div className="text-center py-6 text-gray-400 text-sm">No transactions recorded for this cost center yet</div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editItem ? 'Edit Cost Center' : 'New Cost Center'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
                  <input value={form.code} onChange={e => setForm({...form, code: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="CC-MAIN" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="branch">🏪 Branch</option>
                    <option value="department">🏢 Department</option>
                    <option value="exhibition">🎪 Exhibition</option>
                    <option value="project">📋 Project</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name (English) *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Main Store" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name (Arabic)</label>
                <input value={form.name_ar} onChange={e => setForm({...form, name_ar: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="الفرع الرئيسي" dir="rtl" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Budget (EGP)</label>
                <input type="number" value={form.budget_amount} onChange={e => setForm({...form, budget_amount: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="50000" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Optional notes..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 shadow-sm">
                {editItem ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
