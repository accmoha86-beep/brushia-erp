'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';

function getToken() {
  try {
    const raw = localStorage.getItem('brushia-auth');
    if (!raw) return localStorage.getItem('token') || '';
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken || parsed?.state?.token || localStorage.getItem('token') || '';
  } catch { return localStorage.getItem('token') || ''; }
}

async function apiFetch(url: string, opts: any = {}) {
  const token = getToken();
  const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

const fmtEGP = (v: any) => {
  const n = Number(v || 0) / 100;
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(n);
};

const ENTITY_CONFIG: Record<string, { label: string; labelAr: string; icon: string; color: string }> = {
  customer: { label: 'Customer', labelAr: 'عميل', icon: '👤', color: 'bg-blue-100 text-blue-800' },
  vendor:   { label: 'Vendor',   labelAr: 'مورد', icon: '🏭', color: 'bg-orange-100 text-orange-800' },
  bank:     { label: 'Bank',     labelAr: 'بنك',  icon: '🏦', color: 'bg-green-100 text-green-800' },
  employee: { label: 'Employee', labelAr: 'موظف', icon: '👨‍💼', color: 'bg-purple-100 text-purple-800' },
};

interface AuxAccount {
  id: string; code: string; entity_type: string; entity_name: string; entity_name_ar?: string;
  account_name: string; account_number: string; opening_balance: string; current_balance: string;
  credit_limit: string; is_active: boolean; notes?: string;
}

interface BankAccount {
  id: string; bank_name: string; bank_name_ar?: string; account_number: string;
  iban?: string; swift_code?: string; account_type: string; currency: string;
  opening_balance: string; current_balance: string; is_active: boolean; ledger_balance?: string;
}

export default function SubLedgersPage() {
  const { t, locale, isRTL } = useI18n();
  const [tab, setTab] = useState<'auxiliary' | 'banks'>('auxiliary');
  const [accounts, setAccounts] = useState<AuxAccount[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [statementItem, setStatementItem] = useState<AuxAccount | null>(null);
  const [statementData, setStatementData] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      if (tab === 'auxiliary') {
        const typeParam = filterType !== 'all' ? `?entity_type=${filterType}` : '';
        const res = await apiFetch(`/api/v1/accounting/auxiliary-accounts${typeParam}`);
        setAccounts(res.data || []);
      } else {
        const res = await apiFetch('/api/v1/accounting/bank-accounts');
        setBanks(res.data || []);
      }
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, [tab, filterType]);

  useEffect(() => { loadData(); }, [loadData]);

  const openStatement = async (acc: AuxAccount) => {
    setStatementItem(acc);
    try {
      const data = await apiFetch(`/api/v1/accounting/auxiliary-accounts/${acc.id}/statement`);
      setStatementData(data);
    } catch { setStatementData(null); }
  };

  // Stats
  const customerAccts = accounts.filter(a => a.entity_type === 'customer');
  const vendorAccts = accounts.filter(a => a.entity_type === 'vendor');
  const bankAccts = accounts.filter(a => a.entity_type === 'bank');
  const totalAR = customerAccts.reduce((s, a) => s + Number(a.current_balance || 0), 0);
  const totalAP = vendorAccts.reduce((s, a) => s + Number(a.current_balance || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📒 Sub-Ledgers & Bank Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">حسابات مساعدة — Customer AR, Vendor AP, Bank tracking</p>
        </div>
      </div>

      {/* Tab Switch */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('auxiliary')} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${tab === 'auxiliary' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          📒 Auxiliary Accounts
        </button>
        <button onClick={() => setTab('banks')} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${tab === 'banks' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          🏦 Bank Accounts
        </button>
      </div>

      {/* Auxiliary Tab */}
      {tab === 'auxiliary' && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Customer Accounts', value: customerAccts.length, sub: `AR: ${fmtEGP(totalAR)}`, icon: '👤', gradient: 'from-blue-500 to-indigo-600' },
              { label: 'Vendor Accounts', value: vendorAccts.length, sub: `AP: ${fmtEGP(totalAP)}`, icon: '🏭', gradient: 'from-orange-500 to-red-600' },
              { label: 'Bank Sub-Ledgers', value: bankAccts.length, sub: 'Linked accounts', icon: '🏦', gradient: 'from-green-500 to-emerald-600' },
              { label: 'Total Accounts', value: accounts.length, sub: `${accounts.filter(a => a.is_active).length} active`, icon: '📊', gradient: 'from-purple-500 to-pink-600' },
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

          {/* Entity Type Filters */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'customer', 'vendor', 'bank', 'employee'].map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  filterType === t ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {t === 'all' ? '🔍 All' : `${ENTITY_CONFIG[t]?.icon} ${ENTITY_CONFIG[t]?.label}`}
              </button>
            ))}
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error}</div>}
          {loading && <div className="text-center py-8 text-gray-400">{t('common.loading')}</div>}

          {!loading && accounts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Code</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Parent Account</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Opening Balance</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Current Balance</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Credit Limit</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {accounts.map(acc => {
                    const cfg = ENTITY_CONFIG[acc.entity_type] || ENTITY_CONFIG.customer;
                    return (
                      <tr key={acc.id} className="hover:bg-gray-50 cursor-pointer transition" onClick={() => openStatement(acc)}>
                        <td className="px-4 py-3 font-mono text-xs">{acc.code || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{acc.entity_name}</div>
                          {acc.entity_name_ar && <div className="text-xs text-gray-400" dir="rtl">{acc.entity_name_ar}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{acc.account_number} — {acc.account_name}</td>
                        <td className="px-4 py-3 text-right">{fmtEGP(acc.opening_balance)}</td>
                        <td className="px-4 py-3 text-right font-medium">{fmtEGP(acc.current_balance)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{fmtEGP(acc.credit_limit)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block w-2 h-2 rounded-full ${acc.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && accounts.length === 0 && !error && (
            <div className="text-center py-12 bg-white rounded-xl border">
              <div className="text-4xl mb-3">📒</div>
              <div className="text-gray-500">No auxiliary accounts found</div>
            </div>
          )}
        </>
      )}

      {/* Banks Tab */}
      {tab === 'banks' && (
        <>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error}</div>}
          {loading && <div className="text-center py-8 text-gray-400">Loading bank accounts...</div>}

          {!loading && banks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banks.map(bank => (
                <div key={bank.id} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{bank.bank_name}</h3>
                      {bank.bank_name_ar && <p className="text-sm text-gray-400" dir="rtl">{bank.bank_name_ar}</p>}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      bank.account_type === 'e-wallet' ? 'bg-purple-100 text-purple-700' :
                      bank.account_type === 'savings' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>{bank.account_type === 'e-wallet' ? '📱 E-Wallet' : bank.account_type === 'savings' ? '💰 Savings' : '🏦 Current'}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Account No.</span>
                      <span className="font-mono text-gray-700">{bank.account_number}</span>
                    </div>
                    {bank.iban && <div className="flex justify-between"><span className="text-gray-500">IBAN</span><span className="font-mono text-xs">{bank.iban}</span></div>}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Currency</span>
                      <span className="font-medium">{bank.currency}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-gray-500">Opening Balance</span>
                      <span className="font-medium">{fmtEGP(bank.opening_balance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Current Balance</span>
                      <span className="font-bold text-lg text-gray-900">{fmtEGP(bank.current_balance)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${bank.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-xs text-gray-400">{bank.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && banks.length === 0 && !error && (
            <div className="text-center py-12 bg-white rounded-xl border">
              <div className="text-4xl mb-3">🏦</div>
              <div className="text-gray-500">No bank accounts configured</div>
            </div>
          )}
        </>
      )}

      {/* Statement Modal */}
      {statementItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setStatementItem(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{ENTITY_CONFIG[statementItem.entity_type]?.icon} {statementItem.entity_name}</h2>
                <p className="text-sm text-gray-500">{statementItem.code} — {statementItem.account_name} ({statementItem.account_number})</p>
              </div>
              <button onClick={() => setStatementItem(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-lg font-bold text-blue-700">{fmtEGP(statementData?.totalDebit)}</div>
                <div className="text-xs text-blue-500">Total Debit</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-lg font-bold text-green-700">{fmtEGP(statementData?.totalCredit)}</div>
                <div className="text-xs text-green-500">Total Credit</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="text-lg font-bold text-amber-700">{fmtEGP(statementData?.netBalance)}</div>
                <div className="text-xs text-amber-500">Net Balance</div>
              </div>
            </div>

            {statementData?.transactions?.length > 0 ? (
              <div className="bg-gray-50 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Entry</th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-right">Debit</th>
                      <th className="px-3 py-2 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {statementData.transactions.map((t: any, i: number) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-mono">{t.entry_number}</td>
                        <td className="px-3 py-2">{t.date}</td>
                        <td className="px-3 py-2">{t.description || t.line_description || '—'}</td>
                        <td className="px-3 py-2 text-right">{fmtEGP(t.debit)}</td>
                        <td className="px-3 py-2 text-right">{fmtEGP(t.credit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">No transactions recorded yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
