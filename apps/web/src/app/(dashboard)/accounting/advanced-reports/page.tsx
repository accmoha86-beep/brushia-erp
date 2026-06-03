'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';

function getToken() {
  try {
    const raw = localStorage.getItem('bloom-auth');
    if (!raw) return localStorage.getItem('token') || '';
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken || parsed?.state?.token || localStorage.getItem('token') || '';
  } catch { return localStorage.getItem('token') || ''; }
}

async function apiFetch(url: string) {
  const token = getToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

const fmtEGP = (v: any) => {
  const n = Number(v || 0) / 100;
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 2 }).format(n);
};

const fmtRaw = (v: any) => {
  const n = Number(v || 0);
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 2 }).format(n);
};

type Tab = 'vat' | 'aging' | 'budget' | 'comparison';

function StatBox({ icon, value, label, sub, color }: any) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-5 shadow-sm`}>
      <div className="text-3xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function AdvancedReportsPage() {
  const { t, locale, isRTL } = useI18n();
  const [tab, setTab] = useState<Tab>('vat');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      let url = '';
      if (tab === 'vat') url = `/api/v1/accounting/reports/vat?start_date=${startDate}&end_date=${endDate}`;
      else if (tab === 'aging') url = `/api/v1/accounting/auxiliary-accounts?limit=100`;
      else if (tab === 'budget') url = `/api/v1/accounting/reports/budget`;
      else url = `/api/v1/accounting/cost-centers/comparison`;
      const result = await apiFetch(url);
      setData(result);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, [tab, startDate, endDate]);

  useEffect(() => { loadData(); }, [loadData]);

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'vat', label: 'VAT Report', icon: '🧾' },
    { key: 'aging', label: 'AR/AP Aging', icon: '📅' },
    { key: 'budget', label: 'Budget Mgmt', icon: '💰' },
    { key: 'comparison', label: 'Cost Comparison', icon: '📊' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📋 Advanced Reports</h1>
        <p className="text-sm text-gray-500 mt-1">تقارير متقدمة — VAT, Aging, Budgets & Cost Analysis</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Date for VAT */}
      {tab === 'vat' && (
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <button onClick={loadData} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">🔄 Refresh</button>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error}</div>}
      {loading && <div className="text-center py-12 text-gray-400">Loading report...</div>}

      {/* ─── VAT REPORT ─── */}
      {!loading && tab === 'vat' && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox icon="📈" value={fmtEGP(data.sales?.outputVAT)} label="Output VAT (مخرجات)" sub={`${data.sales?.orderCount || 0} invoices`} color="from-green-50 to-emerald-50" />
            <StatBox icon="📉" value={fmtEGP(data.purchases?.inputVAT)} label="Input VAT (مدخلات)" sub={`${data.purchases?.poCount || 0} POs`} color="from-blue-50 to-indigo-50" />
            <StatBox icon="🧾" value={fmtEGP(data.netVATPayable)} label="Net VAT Payable" sub={data.vatPosition === 'payable' ? 'You owe tax' : data.vatPosition === 'refundable' ? 'Refundable' : 'Settled'} color={data.netVATPayable > 0 ? 'from-red-50 to-pink-50' : 'from-green-50 to-teal-50'} />
            <StatBox icon="📊" value={`${data.vatRate}%`} label="VAT Rate" sub="Egypt standard rate" color="from-yellow-50 to-amber-50" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 text-white">
              <h2 className="text-lg font-bold">🧾 VAT Report — تقرير ضريبة القيمة المضافة</h2>
              <p className="text-sm text-red-200">{data.period?.start} to {data.period?.end} | Rate: {data.vatRate}%</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Sales Section */}
              <div>
                <h3 className="font-bold text-gray-800 text-lg mb-3 border-b pb-2">Sales (المبيعات)</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-4"><div className="text-gray-500">Total Sales</div><div className="text-lg font-bold">{fmtEGP(data.sales?.totalSales)}</div></div>
                  <div className="bg-gray-50 rounded-lg p-4"><div className="text-gray-500">Net Sales (excl. VAT)</div><div className="text-lg font-bold">{fmtEGP(data.sales?.netSales)}</div></div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200"><div className="text-green-600">Output VAT (14%)</div><div className="text-lg font-bold text-green-700">{fmtEGP(data.sales?.outputVAT)}</div></div>
                </div>
              </div>

              {/* Purchases Section */}
              <div>
                <h3 className="font-bold text-gray-800 text-lg mb-3 border-b pb-2">Purchases (المشتريات)</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-4"><div className="text-gray-500">Total Purchases</div><div className="text-lg font-bold">{fmtEGP(data.purchases?.totalPurchases)}</div></div>
                  <div className="bg-gray-50 rounded-lg p-4"><div className="text-gray-500">Net Purchases (excl. VAT)</div><div className="text-lg font-bold">{fmtEGP(data.purchases?.netPurchases)}</div></div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200"><div className="text-blue-600">Input VAT (14%)</div><div className="text-lg font-bold text-blue-700">{fmtEGP(data.purchases?.inputVAT)}</div></div>
                </div>
              </div>

              {/* Net VAT */}
              <div className={`rounded-xl p-6 text-center ${data.netVATPayable > 0 ? 'bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200' : 'bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200'}`}>
                <div className="text-sm text-gray-500 mb-1">Net VAT Payable (صافي الضريبة المستحقة)</div>
                <div className={`text-3xl font-bold ${data.netVATPayable > 0 ? 'text-red-700' : 'text-green-700'}`}>{fmtEGP(data.netVATPayable)}</div>
                <div className="text-xs text-gray-400 mt-1">Output VAT − Input VAT = {fmtEGP(data.sales?.outputVAT)} − {fmtEGP(data.purchases?.inputVAT)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── AR/AP AGING ─── */}
      {!loading && tab === 'aging' && data && (() => {
        const accounts = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        const customers = accounts.filter((a: any) => a.entity_type === 'customer');
        const vendors = accounts.filter((a: any) => a.entity_type === 'vendor');
        const totalAR = customers.reduce((s: number, a: any) => s + Number(a.current_balance || 0), 0);
        const totalAP = vendors.reduce((s: number, a: any) => s + Number(a.current_balance || 0), 0);

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox icon="💰" value={fmtEGP(totalAR)} label="Total AR" sub={`${customers.length} customers`} color="from-green-50 to-emerald-50" />
              <StatBox icon="💸" value={fmtEGP(totalAP)} label="Total AP" sub={`${vendors.length} vendors`} color="from-red-50 to-pink-50" />
              <StatBox icon="👥" value={customers.length} label="Customer Accounts" sub="حسابات العملاء" color="from-blue-50 to-indigo-50" />
              <StatBox icon="🏭" value={vendors.length} label="Vendor Accounts" sub="حسابات الموردين" color="from-orange-50 to-amber-50" />
            </div>

            {/* AR Aging */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 text-white">
                <h2 className="text-lg font-bold">📅 Accounts Receivable Aging — أعمار حسابات القبض</h2>
                <p className="text-sm text-blue-200">Customer balances by aging period</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                    <th className="text-right px-4 py-3 font-semibold text-green-600">Current</th>
                    <th className="text-right px-4 py-3 font-semibold text-yellow-600">1-30 Days</th>
                    <th className="text-right px-4 py-3 font-semibold text-orange-600">31-60 Days</th>
                    <th className="text-right px-4 py-3 font-semibold text-red-600">61-90 Days</th>
                    <th className="text-right px-4 py-3 font-semibold text-red-800">90+ Days</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-800">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.length > 0 ? customers.map((c: any, i: number) => {
                    const bal = Number(c.current_balance || 0);
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{c.entity_name}</td>
                        <td className="px-4 py-3 text-right text-green-600">{fmtEGP(bal)}</td>
                        <td className="px-4 py-3 text-right text-gray-400">—</td>
                        <td className="px-4 py-3 text-right text-gray-400">—</td>
                        <td className="px-4 py-3 text-right text-gray-400">—</td>
                        <td className="px-4 py-3 text-right text-gray-400">—</td>
                        <td className="px-4 py-3 text-right font-bold">{fmtEGP(bal)}</td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No outstanding receivables — all current ✅</td></tr>
                  )}
                </tbody>
                <tfoot className="bg-blue-50 border-t-2 border-blue-200 font-bold">
                  <tr>
                    <td className="px-4 py-3">Total AR</td>
                    <td className="px-4 py-3 text-right">{fmtEGP(totalAR)}</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">{fmtEGP(totalAR)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* AP Aging */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 text-white">
                <h2 className="text-lg font-bold">📅 Accounts Payable Aging — أعمار حسابات الدفع</h2>
                <p className="text-sm text-orange-200">Vendor balances by aging period</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Vendor</th>
                    <th className="text-right px-4 py-3 font-semibold text-green-600">Current</th>
                    <th className="text-right px-4 py-3 font-semibold text-yellow-600">1-30 Days</th>
                    <th className="text-right px-4 py-3 font-semibold text-orange-600">31-60 Days</th>
                    <th className="text-right px-4 py-3 font-semibold text-red-600">61-90 Days</th>
                    <th className="text-right px-4 py-3 font-semibold text-red-800">90+ Days</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-800">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vendors.length > 0 ? vendors.map((v: any, i: number) => {
                    const bal = Number(v.current_balance || 0);
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{v.entity_name}</td>
                        <td className="px-4 py-3 text-right text-green-600">{fmtEGP(bal)}</td>
                        <td className="px-4 py-3 text-right text-gray-400">—</td>
                        <td className="px-4 py-3 text-right text-gray-400">—</td>
                        <td className="px-4 py-3 text-right text-gray-400">—</td>
                        <td className="px-4 py-3 text-right text-gray-400">—</td>
                        <td className="px-4 py-3 text-right font-bold">{fmtEGP(bal)}</td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No outstanding payables — all settled ✅</td></tr>
                  )}
                </tbody>
                <tfoot className="bg-orange-50 border-t-2 border-orange-200 font-bold">
                  <tr>
                    <td className="px-4 py-3">Total AP</td>
                    <td className="px-4 py-3 text-right">{fmtEGP(totalAP)}</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">{fmtEGP(totalAP)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ─── BUDGET MANAGEMENT ─── */}
      {!loading && tab === 'budget' && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox icon="💰" value={fmtRaw(data.totalBudget)} label="Total Budget" sub="All cost centers" color="from-blue-50 to-indigo-50" />
            <StatBox icon="📉" value={fmtRaw(data.totalSpent)} label="Actual Spent" sub="Posted expenses" color="from-red-50 to-pink-50" />
            <StatBox icon="📈" value={fmtRaw(data.totalRevenue)} label="Actual Revenue" sub="Posted revenue" color="from-green-50 to-emerald-50" />
            <StatBox icon="📊" value={data.totalBudget > 0 ? `${Math.round((data.totalSpent / data.totalBudget) * 100)}%` : '0%'} label="Budget Utilization" sub="Spent / Budget" color="from-yellow-50 to-amber-50" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 text-white">
              <h2 className="text-lg font-bold">💰 Budget vs Actual — الميزانية مقابل الفعلي</h2>
              <p className="text-sm text-violet-200">Per cost center budget tracking</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Code</th>
                  <th className="text-left px-4 py-3 font-semibold">Cost Center</th>
                  <th className="text-left px-4 py-3 font-semibold">Type</th>
                  <th className="text-right px-4 py-3 font-semibold">Budget</th>
                  <th className="text-right px-4 py-3 font-semibold">Actual Spent</th>
                  <th className="text-right px-4 py-3 font-semibold">Variance</th>
                  <th className="text-right px-4 py-3 font-semibold">% Used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data.data || []).map((r: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-500 text-xs">{r.code}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{r.name}</span>
                      {r.name_ar && <span className="text-xs text-gray-400 ml-2">({r.name_ar})</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.type === 'branch' ? 'bg-blue-100 text-blue-700' : r.type === 'department' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>{r.type}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{fmtRaw(r.budget_amount)}</td>
                    <td className="px-4 py-3 text-right">{fmtRaw(r.actual_spent)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${r.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {r.variance >= 0 ? '+' : ''}{fmtRaw(r.variance)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${r.utilization > 90 ? 'bg-red-500' : r.utilization > 70 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(r.utilization, 100)}%` }}></div>
                        </div>
                        <span className="text-xs font-medium">{r.utilization}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-violet-50 border-t-2 border-violet-200 font-bold">
                <tr>
                  <td className="px-4 py-3" colSpan={3}>Totals</td>
                  <td className="px-4 py-3 text-right">{fmtRaw(data.totalBudget)}</td>
                  <td className="px-4 py-3 text-right">{fmtRaw(data.totalSpent)}</td>
                  <td className={`px-4 py-3 text-right ${(data.totalBudget - data.totalSpent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fmtRaw(data.totalBudget - data.totalSpent)}
                  </td>
                  <td className="px-4 py-3 text-right">{data.totalBudget > 0 ? `${Math.round((data.totalSpent / data.totalBudget) * 100)}%` : '0%'}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ─── COST CENTER COMPARISON ─── */}
      {!loading && tab === 'comparison' && data && (() => {
        const items = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        const totalDebits = items.reduce((s: number, c: any) => s + Number(c.total_debits || 0), 0);
        const totalCredits = items.reduce((s: number, c: any) => s + Number(c.total_credits || 0), 0);

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatBox icon="🏢" value={items.length} label="Cost Centers" sub="Active centers" color="from-blue-50 to-indigo-50" />
              <StatBox icon="📉" value={fmtEGP(totalDebits)} label="Total Debits" sub="All centers combined" color="from-red-50 to-pink-50" />
              <StatBox icon="📈" value={fmtEGP(totalCredits)} label="Total Credits" sub="All centers combined" color="from-green-50 to-emerald-50" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 text-white">
                <h2 className="text-lg font-bold">📊 Cost Center Comparison — مقارنة مراكز التكلفة</h2>
                <p className="text-sm text-teal-200">Side-by-side performance analysis</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Code</th>
                    <th className="text-left px-4 py-3 font-semibold">Cost Center</th>
                    <th className="text-left px-4 py-3 font-semibold">Type</th>
                    <th className="text-right px-4 py-3 font-semibold">Total Debits</th>
                    <th className="text-right px-4 py-3 font-semibold">Total Credits</th>
                    <th className="text-right px-4 py-3 font-semibold">Net Balance</th>
                    <th className="text-right px-4 py-3 font-semibold">Transactions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.length > 0 ? items.map((c: any, i: number) => {
                    const debits = Number(c.total_debits || 0);
                    const credits = Number(c.total_credits || 0);
                    const net = debits - credits;
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-gray-500 text-xs">{c.code}</td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{c.name}</span>
                          {c.name_ar && <span className="text-xs text-gray-400 ml-2">({c.name_ar})</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.type === 'branch' ? 'bg-blue-100 text-blue-700' : c.type === 'department' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>{c.type}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-red-600">{fmtEGP(debits)}</td>
                        <td className="px-4 py-3 text-right text-green-600">{fmtEGP(credits)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${net <= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmtEGP(Math.abs(net))}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{Number(c.transaction_count || 0)}</td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No transactions recorded yet — comparison will populate once entries are posted</td></tr>
                  )}
                </tbody>
                <tfoot className="bg-teal-50 border-t-2 border-teal-200 font-bold">
                  <tr>
                    <td className="px-4 py-3" colSpan={3}>Totals</td>
                    <td className="px-4 py-3 text-right text-red-600">{fmtEGP(totalDebits)}</td>
                    <td className="px-4 py-3 text-right text-green-600">{fmtEGP(totalCredits)}</td>
                    <td className="px-4 py-3 text-right">{fmtEGP(Math.abs(totalDebits - totalCredits))}</td>
                    <td className="px-4 py-3 text-right">{items.reduce((s: number, c: any) => s + Number(c.transaction_count || 0), 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
