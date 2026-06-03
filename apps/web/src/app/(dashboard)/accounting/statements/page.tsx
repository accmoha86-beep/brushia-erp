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

type Tab = 'trial-balance' | 'income-statement' | 'balance-sheet';

interface Account { account_number: string; name: string; name_ar?: string; account_type: string; debit: number; credit: number; balance: number; }

export default function FinancialStatementsPage() {
  const { t, locale, isRTL } = useI18n();
  const [tab, setTab] = useState<Tab>('trial-balance');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      let url = '';
      if (tab === 'trial-balance') url = `/api/v1/accounting/reports/trial-balance?as_of_date=${asOfDate}`;
      else if (tab === 'income-statement') url = `/api/v1/accounting/reports/profit-loss?start_date=${startDate}&end_date=${endDate}`;
      else url = `/api/v1/accounting/reports/balance-sheet?as_of_date=${asOfDate}`;
      const result = await apiFetch(url);
      setData(result);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, [tab, asOfDate, startDate, endDate]);

  useEffect(() => { loadData(); }, [loadData]);

  const TABS: { key: Tab; label: string; labelAr: string; icon: string }[] = [
    { key: 'trial-balance', label: 'Trial Balance', labelAr: 'ميزان المراجعة', icon: '⚖️' },
    { key: 'income-statement', label: 'Income Statement', labelAr: 'قائمة الدخل', icon: '📈' },
    { key: 'balance-sheet', label: 'Balance Sheet', labelAr: 'الميزانية العمومية', icon: '🏛️' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📊 Financial Statements</h1>
        <p className="text-sm text-gray-500 mt-1">القوائم المالية — Professional financial reports</p>
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

      {/* Date Filters */}
      <div className="flex gap-4 items-end">
        {tab === 'income-statement' ? (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm" />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">As of Date</label>
            <input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm" />
          </div>
        )}
        <button onClick={loadData} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 shadow-sm">
          🔄 Refresh
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error}</div>}
      {loading && <div className="text-center py-12 text-gray-400">Generating report...</div>}

      {/* Trial Balance */}
      {!loading && tab === 'trial-balance' && data && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 text-white">
            <h2 className="text-lg font-bold">⚖️ Trial Balance — ميزان المراجعة</h2>
            <p className="text-sm text-indigo-200">As of {data.as_of_date}</p>
          </div>
          {data.accounts?.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Account No.</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Account Name</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-600">Debit (مدين)</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-600">Credit (دائن)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.accounts.map((a: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-gray-600">{a.account_number}</td>
                    <td className="px-6 py-3">
                      <span className="font-medium text-gray-900">{a.name}</span>
                      {a.name_ar && <span className="text-xs text-gray-400 ml-2">({a.name_ar})</span>}
                    </td>
                    <td className="px-6 py-3 text-right font-medium">{Number(a.debit) > 0 ? fmtEGP(a.debit) : '—'}</td>
                    <td className="px-6 py-3 text-right font-medium">{Number(a.credit) > 0 ? fmtEGP(a.credit) : '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr className="font-bold text-gray-900">
                  <td className="px-6 py-3" colSpan={2}>Total (الإجمالي)</td>
                  <td className="px-6 py-3 text-right">{fmtEGP(data.totals?.total_debit)}</td>
                  <td className="px-6 py-3 text-right">{fmtEGP(data.totals?.total_credit)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="px-6 py-2 text-center">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${data.is_balanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {data.is_balanced ? '✅ Balanced (متوازن)' : '❌ NOT Balanced (غير متوازن)'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-gray-500 text-lg font-medium">No journal entries posted yet</div>
              <div className="text-gray-400 text-sm mt-1">Trial balance will populate once accounting entries are recorded</div>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                ✅ Balanced (متوازن) — {fmtEGP(0)} = {fmtEGP(0)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Income Statement */}
      {!loading && tab === 'income-statement' && data && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white">
            <h2 className="text-lg font-bold">📈 Income Statement — قائمة الدخل</h2>
            <p className="text-sm text-emerald-200">{startDate} to {endDate}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Revenue Section */}
            <div>
              <h3 className="font-bold text-gray-800 text-lg mb-3 border-b pb-2">Revenue (الإيرادات)</h3>
              {data.accounts?.filter((a: any) => a.account_type === 'revenue').length > 0 ? (
                <div className="space-y-2">
                  {data.accounts.filter((a: any) => a.account_type === 'revenue').map((a: any, i: number) => (
                    <div key={i} className="flex justify-between px-4 py-2 bg-green-50 rounded-lg">
                      <span>{a.account_number} — {a.name}</span>
                      <span className="font-medium text-green-700">{fmtEGP(a.credit || a.balance)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm italic px-4">No revenue entries for this period</div>
              )}
              <div className="flex justify-between px-4 py-2 mt-2 border-t font-bold">
                <span>Net Revenue</span>
                <span className="text-green-700">{fmtEGP(data.revenue?.net || 0)}</span>
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <h3 className="font-bold text-gray-800 text-lg mb-3 border-b pb-2">Expenses (المصروفات)</h3>
              {data.accounts?.filter((a: any) => a.account_type === 'expense').length > 0 ? (
                <div className="space-y-2">
                  {data.accounts.filter((a: any) => a.account_type === 'expense').map((a: any, i: number) => (
                    <div key={i} className="flex justify-between px-4 py-2 bg-red-50 rounded-lg">
                      <span>{a.account_number} — {a.name}</span>
                      <span className="font-medium text-red-700">{fmtEGP(a.debit || a.balance)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm italic px-4">No expense entries for this period</div>
              )}
              <div className="flex justify-between px-4 py-2 mt-2 border-t font-bold">
                <span>Total Expenses</span>
                <span className="text-red-700">{fmtEGP(data.expenses?.total || 0)}</span>
              </div>
            </div>

            {/* Net Income */}
            <div className={`rounded-xl p-6 text-center ${Number(data.net_income || 0) >= 0 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200' : 'bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200'}`}>
              <div className="text-sm text-gray-500 mb-1">Net Income (صافي الربح)</div>
              <div className={`text-3xl font-bold ${Number(data.net_income || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {fmtEGP(data.net_income)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Sheet */}
      {!loading && tab === 'balance-sheet' && data && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 text-white">
            <h2 className="text-lg font-bold">🏛️ Balance Sheet — الميزانية العمومية</h2>
            <p className="text-sm text-purple-200">As of {data.as_of_date}</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assets */}
              <div>
                <h3 className="font-bold text-gray-800 text-lg mb-3 border-b-2 border-blue-300 pb-2">Assets (الأصول)</h3>
                {data.assets?.accounts?.length > 0 ? (
                  <div className="space-y-2">
                    {data.assets.accounts.map((a: any, i: number) => (
                      <div key={i} className="flex justify-between px-3 py-2 bg-blue-50 rounded-lg text-sm">
                        <span>{a.account_number} — {a.name}</span>
                        <span className="font-medium">{fmtEGP(a.balance)}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-gray-400 text-sm italic">No asset balances</div>}
                <div className="flex justify-between px-3 py-3 mt-3 bg-blue-100 rounded-lg font-bold">
                  <span>Total Assets</span>
                  <span className="text-blue-800">{fmtEGP(data.assets?.total || 0)}</span>
                </div>
              </div>

              {/* Liabilities + Equity */}
              <div>
                <h3 className="font-bold text-gray-800 text-lg mb-3 border-b-2 border-orange-300 pb-2">Liabilities (الالتزامات)</h3>
                {data.liabilities?.accounts?.length > 0 ? (
                  <div className="space-y-2">
                    {data.liabilities.accounts.map((a: any, i: number) => (
                      <div key={i} className="flex justify-between px-3 py-2 bg-orange-50 rounded-lg text-sm">
                        <span>{a.account_number} — {a.name}</span>
                        <span className="font-medium">{fmtEGP(a.balance)}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-gray-400 text-sm italic">No liability balances</div>}
                <div className="flex justify-between px-3 py-3 mt-3 bg-orange-100 rounded-lg font-bold">
                  <span>Total Liabilities</span>
                  <span className="text-orange-800">{fmtEGP(data.liabilities?.total || 0)}</span>
                </div>

                <h3 className="font-bold text-gray-800 text-lg mt-6 mb-3 border-b-2 border-purple-300 pb-2">Equity (حقوق الملكية)</h3>
                {data.equity?.accounts?.length > 0 ? (
                  <div className="space-y-2">
                    {data.equity.accounts.map((a: any, i: number) => (
                      <div key={i} className="flex justify-between px-3 py-2 bg-purple-50 rounded-lg text-sm">
                        <span>{a.account_number} — {a.name}</span>
                        <span className="font-medium">{fmtEGP(a.balance)}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-gray-400 text-sm italic">No equity balances</div>}
                <div className="flex justify-between px-3 py-2 mt-2 text-sm text-gray-600">
                  <span>Retained Earnings</span>
                  <span>{fmtEGP(data.equity?.retained_earnings || 0)}</span>
                </div>
                <div className="flex justify-between px-3 py-3 mt-1 bg-purple-100 rounded-lg font-bold">
                  <span>Total Equity</span>
                  <span className="text-purple-800">{fmtEGP(data.equity?.total || 0)}</span>
                </div>
              </div>
            </div>

            {/* Balance Check */}
            <div className="mt-6 text-center">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${data.is_balanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {data.is_balanced ? '✅ Assets = Liabilities + Equity (متوازنة)' : '❌ NOT Balanced — Check entries'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
