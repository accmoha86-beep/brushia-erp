'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import {
  BookOpen, Plus, FileText, BarChart3, TrendingUp, TrendingDown,
  DollarSign, ChevronRight, ChevronDown, Eye, Search, Filter,
  Check, X, AlertCircle, ArrowUpDown, RefreshCw, Calculator
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchWithAuth(path: string, token: string, options?: RequestInit) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Format helpers ────────────────────────────────
function formatEGP(piasters: number): string {
  const amount = (piasters || 0) / 100;
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(d: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-EG', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// ─── Account type colors ───────────────────────────
const typeColors: Record<string, string> = {
  asset: 'bg-blue-100 text-blue-700',
  liability: 'bg-red-100 text-red-700',
  equity: 'bg-purple-100 text-purple-700',
  revenue: 'bg-green-100 text-green-700',
  expense: 'bg-orange-100 text-orange-700',
  contra_asset: 'bg-blue-50 text-blue-500',
  contra_liability: 'bg-red-50 text-red-500',
  contra_revenue: 'bg-green-50 text-green-500',
  contra_expense: 'bg-orange-50 text-orange-500',
};

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  posted: 'bg-green-100 text-green-700',
  voided: 'bg-red-100 text-red-700',
};

// ─── Tabs ──────────────────────────────────────────
type Tab = 'accounts' | 'journal' | 'trial-balance' | 'profit-loss' | 'balance-sheet';

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'accounts', label: 'Chart of Accounts', icon: BookOpen },
  { id: 'journal', label: 'Journal Entries', icon: FileText },
  { id: 'trial-balance', label: 'Trial Balance', icon: Calculator },
  { id: 'profit-loss', label: 'Profit & Loss', icon: TrendingUp },
  { id: 'balance-sheet', label: 'Balance Sheet', icon: BarChart3 },
];

export default function AccountingPage() {
  const { accessToken } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('accounts');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-rose-500" />
            Accounting
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Chart of Accounts, Journal Entries & Financial Reports
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-rose-500 text-rose-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'accounts' && <ChartOfAccountsTab token={accessToken} />}
      {activeTab === 'journal' && <JournalEntriesTab token={accessToken} />}
      {activeTab === 'trial-balance' && <TrialBalanceTab token={accessToken} />}
      {activeTab === 'profit-loss' && <ProfitLossTab token={accessToken} />}
      {activeTab === 'balance-sheet' && <BalanceSheetTab token={accessToken} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CHART OF ACCOUNTS TAB
// ═══════════════════════════════════════════════════════

function ChartOfAccountsTab({ token }: { token: string | null }) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');

  const loadAccounts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchWithAuth('/api/v1/accounting/accounts', token);
      setAccounts(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAccounts(); }, [token]);

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const matchSearch = !search || 
        (a.code || a.account_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.name || '').toLowerCase().includes(search.toLowerCase());
      const matchType = !filterType || a.account_type === filterType;
      return matchSearch && matchType;
    });
  }, [accounts, search, filterType]);

  const accountTypes = useMemo(() => {
    const types = new Set(accounts.map((a) => a.account_type));
    return Array.from(types).sort();
  }, [accounts]);

  // Group accounts by type
  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const a of filtered) {
      const t = a.account_type || 'other';
      if (!groups[t]) groups[t] = [];
      groups[t].push(a);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500"
        >
          <option value="">All Types</option>
          {accountTypes.map((t) => (
            <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-600 transition"
        >
          <Plus className="h-4 w-4" /> New Account
        </button>
        <button onClick={loadAccounts} className="p-2 text-gray-400 hover:text-gray-600 transition" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {['asset', 'liability', 'equity', 'revenue', 'expense'].map((type) => {
          const count = accounts.filter((a) => a.account_type === type).length;
          return (
            <div key={type} className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="text-xs text-gray-500 uppercase tracking-wide">{type}</div>
              <div className="text-xl font-bold text-gray-900 mt-1">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Accounts Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Arabic Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Parent</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      {account.code || account.account_number}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{account.name}</div>
                    {account.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{account.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600" dir="rtl">
                    {account.name_ar || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[account.account_type] || 'bg-gray-100 text-gray-700'}`}>
                      {(account.account_type || '').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {account.parent_name ? `${account.parent_code} — ${account.parent_name}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {account.is_active !== false ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                        <Check className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-500 text-xs">
                        <X className="h-3 w-3" /> Inactive
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No accounts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-t">
            Showing {filtered.length} of {accounts.length} accounts
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {showCreate && (
        <CreateAccountModal
          token={token}
          accounts={accounts}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadAccounts(); }}
        />
      )}
    </div>
  );
}

// ─── Create Account Modal ──────────────────────────

function CreateAccountModal({ token, accounts, onClose, onCreated }: {
  token: string | null;
  accounts: any[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    code: '', name: '', name_ar: '', account_type: 'asset',
    parent_id: '', description: '', is_bank_account: false, currency: 'EGP',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      await fetchWithAuth('/api/v1/accounting/accounts', token, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          parent_id: form.parent_id || undefined,
        }),
      });
      onCreated();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">New Account</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Account Code *</label>
              <input
                type="text" required placeholder="e.g. 1500"
                value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
              <select
                value={form.account_type}
                onChange={(e) => setForm({ ...form, account_type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500"
              >
                {['asset', 'liability', 'equity', 'revenue', 'expense', 'contra_asset', 'contra_liability', 'contra_revenue', 'contra_expense'].map((t) => (
                  <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name (English) *</label>
            <input
              type="text" required placeholder="Account name"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name (Arabic)</label>
            <input
              type="text" dir="rtl" placeholder="اسم الحساب"
              value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Parent Account</label>
            <select
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500"
            >
              <option value="">— No Parent (Top Level) —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code || a.account_number} — {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              placeholder="Optional description"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 resize-none"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox" checked={form.is_bank_account}
                onChange={(e) => setForm({ ...form, is_bank_account: e.target.checked })}
                className="rounded border-gray-300 text-rose-500 focus:ring-rose-500"
              />
              Bank Account
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 disabled:opacity-50 transition">
              {saving ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// JOURNAL ENTRIES TAB
// ═══════════════════════════════════════════════════════

function JournalEntriesTab({ token }: { token: string | null }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');

  const loadEntries = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let path = '/api/v1/accounting/journal-entries?limit=50';
      if (filterStatus) path += '&status=' + filterStatus;
      if (filterSource) path += '&source=' + filterSource;
      const data = await fetchWithAuth(path, token);
      setEntries(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEntries(); }, [token, filterStatus, filterSource]);

  const handlePostEntry = async (id: string) => {
    if (!token) return;
    try {
      await fetchWithAuth(`/api/v1/accounting/journal-entries/${id}/post`, token, { method: 'POST' });
      loadEntries();
    } catch (e: any) {
      alert('Failed to post: ' + e.message);
    }
  };

  const handleVoidEntry = async (id: string) => {
    const reason = prompt('Reason for voiding this entry:');
    if (!reason || !token) return;
    try {
      await fetchWithAuth(`/api/v1/accounting/journal-entries/${id}/void`, token, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      loadEntries();
    } catch (e: any) {
      alert('Failed to void: ' + e.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="posted">Posted</option>
          <option value="voided">Voided</option>
        </select>
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Sources</option>
          {['manual', 'sales', 'purchase', 'inventory', 'pos', 'expense', 'bank', 'adjustment'].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-600 transition"
        >
          <Plus className="h-4 w-4" /> New Journal Entry
        </button>
        <button onClick={loadEntries} className="p-2 text-gray-400 hover:text-gray-600 transition">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">No Journal Entries Yet</h3>
          <p className="text-sm text-gray-500 mt-1">
            Journal entries are created automatically from sales & purchases, or manually.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 inline-flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-600 transition"
          >
            <Plus className="h-4 w-4" /> Create Manual Entry
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Entry #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Source</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Debit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Credit</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-rose-600">{entry.entry_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(entry.entry_date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-[250px] truncate">{entry.description}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 font-medium">
                      {entry.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono text-gray-900">{formatEGP(entry.total_debit)}</td>
                  <td className="px-4 py-3 text-sm text-right font-mono text-gray-900">{formatEGP(entry.total_credit)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[entry.status] || 'bg-gray-100 text-gray-600'}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="p-1 text-gray-400 hover:text-rose-500 transition"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {entry.status === 'draft' && (
                        <button
                          onClick={() => handlePostEntry(entry.id)}
                          className="p-1 text-gray-400 hover:text-green-500 transition"
                          title="Post entry"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {entry.status === 'posted' && (
                        <button
                          onClick={() => handleVoidEntry(entry.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition"
                          title="Void entry"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateJournalEntryModal
          token={token}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadEntries(); }}
        />
      )}

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <JournalEntryDetailModal
          token={token}
          entryId={selectedEntry.id}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
}

// ─── Create Journal Entry Modal ────────────────────

function CreateJournalEntryModal({ token, onClose, onCreated }: {
  token: string | null; onClose: () => void; onCreated: () => void;
}) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    source: 'manual' as string,
    auto_post: false,
  });
  const [lines, setLines] = useState<{ account_id: string; debit: string; credit: string; description: string }[]>([
    { account_id: '', debit: '', credit: '', description: '' },
    { account_id: '', debit: '', credit: '', description: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    fetchWithAuth('/api/v1/accounting/accounts', token)
      .then((d) => setAccounts(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [token]);

  const totalDebit = lines.reduce((s, l) => s + (parseInt(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseInt(l.credit) || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const addLine = () => setLines([...lines, { account_id: '', debit: '', credit: '', description: '' }]);
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: string, value: string) => {
    const newLines = [...lines];
    (newLines[i] as any)[field] = value;
    setLines(newLines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !isBalanced) return;
    setSaving(true);
    setError('');
    try {
      await fetchWithAuth('/api/v1/accounting/journal-entries', token, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          lines: lines.filter((l) => l.account_id).map((l) => ({
            account_id: l.account_id,
            debit: parseInt(l.debit) || 0,
            credit: parseInt(l.credit) || 0,
            description: l.description || undefined,
          })),
        }),
      });
      onCreated();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">New Journal Entry</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
              <input
                type="date" required value={form.entry_date}
                onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {['manual', 'sales', 'purchase', 'inventory', 'pos', 'expense', 'bank', 'adjustment'].map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox" checked={form.auto_post}
                  onChange={(e) => setForm({ ...form, auto_post: e.target.checked })}
                  className="rounded border-gray-300 text-rose-500 focus:ring-rose-500"
                />
                Auto-post
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
            <input
              type="text" required placeholder="Journal entry description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Entry Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600 uppercase">Entry Lines</label>
              <button type="button" onClick={addLine} className="text-xs text-rose-500 hover:text-rose-600 font-medium">
                + Add Line
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Account</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 w-32">Debit (pt)</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 w-32">Credit (pt)</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Memo</th>
                    <th className="px-3 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((line, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">
                        <select
                          value={line.account_id}
                          onChange={(e) => updateLine(i, 'account_id', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                        >
                          <option value="">Select account</option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code || a.account_number} — {a.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number" min="0" placeholder="0"
                          value={line.debit}
                          onChange={(e) => updateLine(i, 'debit', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-right font-mono"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number" min="0" placeholder="0"
                          value={line.credit}
                          onChange={(e) => updateLine(i, 'credit', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-right font-mono"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text" placeholder="Optional memo"
                          value={line.description}
                          onChange={(e) => updateLine(i, 'description', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        {lines.length > 2 && (
                          <button type="button" onClick={() => removeLine(i)} className="text-gray-400 hover:text-red-500">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td className="px-3 py-2 text-xs font-semibold text-gray-600">Totals</td>
                    <td className="px-3 py-2 text-right font-mono text-sm font-semibold">{totalDebit}</td>
                    <td className="px-3 py-2 text-right font-mono text-sm font-semibold">{totalCredit}</td>
                    <td className="px-3 py-2">
                      {isBalanced ? (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <Check className="h-3 w-3" /> Balanced
                        </span>
                      ) : totalDebit > 0 || totalCredit > 0 ? (
                        <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Unbalanced ({totalDebit - totalCredit})
                        </span>
                      ) : null}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Amounts in piasters (1 EGP = 100 pt). Enter 15000 for EGP 150.00.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !isBalanced}
              className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 disabled:opacity-50 transition"
            >
              {saving ? 'Creating...' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Journal Entry Detail Modal ────────────────────

function JournalEntryDetailModal({ token, entryId, onClose }: {
  token: string | null; entryId: string; onClose: () => void;
}) {
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetchWithAuth(`/api/v1/accounting/journal-entries/${entryId}`, token)
      .then(setEntry)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, entryId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Journal Entry Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
          </div>
        ) : entry ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Entry #:</span>
                <span className="ml-2 font-mono font-semibold text-rose-600">{entry.entry_number}</span>
              </div>
              <div>
                <span className="text-gray-500">Date:</span>
                <span className="ml-2">{formatDate(entry.entry_date)}</span>
              </div>
              <div>
                <span className="text-gray-500">Source:</span>
                <span className="ml-2 capitalize">{entry.source}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[entry.status]}`}>
                  {entry.status}
                </span>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Description:</span>
              <span className="ml-2">{entry.description}</span>
            </div>

            {entry.lines && entry.lines.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">#</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Account</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Debit</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Credit</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Memo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {entry.lines.map((line: any, i: number) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-xs text-gray-400">{line.line_number || i + 1}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className="font-mono text-xs text-gray-400">{line.account_code}</span>
                          <span className="ml-2 text-gray-900">{line.account_name}</span>
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-mono">
                          {parseInt(line.debit) > 0 ? formatEGP(parseInt(line.debit)) : '—'}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-mono">
                          {parseInt(line.credit) > 0 ? formatEGP(parseInt(line.credit)) : '—'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">{line.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t">
                    <tr>
                      <td colSpan={2} className="px-4 py-2 text-xs font-semibold text-gray-600">Total</td>
                      <td className="px-4 py-2 text-sm text-right font-mono font-semibold">{formatEGP(parseInt(entry.total_debit))}</td>
                      <td className="px-4 py-2 text-sm text-right font-mono font-semibold">{formatEGP(parseInt(entry.total_credit))}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Failed to load entry details</p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TRIAL BALANCE TAB
// ═══════════════════════════════════════════════════════

function TrialBalanceTab({ token }: { token: string | null }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const d = await fetchWithAuth(`/api/v1/accounting/reports/trial-balance?as_of_date=${asOfDate}`, token);
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [token, asOfDate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">As of Date:</label>
        <input
          type="date" value={asOfDate}
          onChange={(e) => setAsOfDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <button onClick={loadData} className="p-2 text-gray-400 hover:text-gray-600">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
        </div>
      ) : data ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <div className="text-xs text-gray-500 uppercase">Total Debits</div>
              <div className="text-xl font-bold text-gray-900 mt-1">{formatEGP(data.totals.total_debit)}</div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="text-xs text-gray-500 uppercase">Total Credits</div>
              <div className="text-xl font-bold text-gray-900 mt-1">{formatEGP(data.totals.total_credit)}</div>
            </div>
            <div className={`rounded-lg border p-4 ${data.is_balanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="text-xs text-gray-500 uppercase">Status</div>
              <div className={`text-xl font-bold mt-1 flex items-center gap-2 ${data.is_balanced ? 'text-green-700' : 'text-red-700'}`}>
                {data.is_balanced ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                {data.is_balanced ? 'Balanced ✓' : 'Unbalanced!'}
              </div>
            </div>
          </div>

          {data.accounts.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">No Posted Entries</h3>
              <p className="text-sm text-gray-500 mt-1">
                Trial balance will populate once journal entries are posted.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Account</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Debit</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Credit</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.accounts.map((acc: any) => (
                    <tr key={acc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm">{acc.code}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{acc.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[acc.account_type] || 'bg-gray-100'}`}>
                          {acc.account_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{formatEGP(parseInt(acc.total_debit))}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{formatEGP(parseInt(acc.total_credit))}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-semibold">
                        <span className={parseInt(acc.balance) >= 0 ? 'text-gray-900' : 'text-red-600'}>
                          {formatEGP(Math.abs(parseInt(acc.balance)))}
                          {parseInt(acc.balance) < 0 ? ' CR' : ' DR'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PROFIT & LOSS TAB
// ═══════════════════════════════════════════════════════

function ProfitLossTab({ token }: { token: string | null }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const yearStart = `${now.getFullYear()}-01-01`;
  const today = now.toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(yearStart);
  const [toDate, setToDate] = useState(today);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const d = await fetchWithAuth(
        `/api/v1/accounting/reports/profit-loss?from_date=${fromDate}&to_date=${toDate}`, token
      );
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [token]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">From:</label>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <label className="text-sm text-gray-600">To:</label>
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <button onClick={loadData} className="flex items-center gap-1 bg-rose-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-rose-600">
          <RefreshCw className="h-3.5 w-3.5" /> Generate
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
        </div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <div className="text-xs text-gray-500 uppercase flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-green-500" /> Revenue
              </div>
              <div className="text-xl font-bold text-green-700 mt-1">{formatEGP(data.revenue.total)}</div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="text-xs text-gray-500 uppercase">Contra Revenue</div>
              <div className="text-xl font-bold text-orange-600 mt-1">{formatEGP(data.revenue.contra)}</div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="text-xs text-gray-500 uppercase flex items-center gap-1">
                <TrendingDown className="h-3.5 w-3.5 text-red-500" /> Expenses
              </div>
              <div className="text-xl font-bold text-red-700 mt-1">{formatEGP(data.expenses.total)}</div>
            </div>
            <div className={`rounded-lg border p-4 ${data.net_income >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="text-xs text-gray-500 uppercase flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" /> Net Income
              </div>
              <div className={`text-xl font-bold mt-1 ${data.net_income >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatEGP(data.net_income)}
              </div>
            </div>
          </div>

          {data.accounts.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">No P&L Activity</h3>
              <p className="text-sm text-gray-500 mt-1">
                Revenue and expense entries will appear here once posted.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Account</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Debit</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.accounts.map((acc: any) => (
                    <tr key={acc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm">{acc.code}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{acc.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[acc.account_type]}`}>
                          {acc.account_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{formatEGP(parseInt(acc.total_debit))}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{formatEGP(parseInt(acc.total_credit))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BALANCE SHEET TAB
// ═══════════════════════════════════════════════════════

function BalanceSheetTab({ token }: { token: string | null }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const d = await fetchWithAuth(`/api/v1/accounting/reports/balance-sheet?as_of_date=${asOfDate}`, token);
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [token]);

  const renderSection = (title: string, section: any, color: string) => (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className={`px-4 py-3 ${color} border-b`}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold">{title}</h4>
          <span className="text-lg font-bold font-mono">{formatEGP(section.total)}</span>
        </div>
      </div>
      {section.accounts && section.accounts.length > 0 ? (
        <table className="min-w-full">
          <tbody className="divide-y divide-gray-100">
            {section.accounts.map((acc: any) => (
              <tr key={acc.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs text-gray-400">{acc.code}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{acc.name}</td>
                <td className="px-4 py-2 text-sm text-right font-mono font-medium">
                  {formatEGP(Math.abs(parseInt(acc.balance)))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="px-4 py-6 text-center text-sm text-gray-400">No entries</div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">As of Date:</label>
        <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <button onClick={loadData} className="flex items-center gap-1 bg-rose-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-rose-600">
          <RefreshCw className="h-3.5 w-3.5" /> Generate
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
        </div>
      ) : data ? (
        <>
          {/* Balance check */}
          <div className={`rounded-lg border p-4 ${data.is_balanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {data.is_balanced ? <Check className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
                <span className="text-sm font-medium">
                  Assets = Liabilities + Equity → {data.is_balanced ? 'Balanced ✓' : 'Not Balanced!'}
                </span>
              </div>
              <span className="text-xs text-gray-500">As of {formatDate(data.as_of_date)}</span>
            </div>
          </div>

          <div className="grid gap-4">
            {renderSection('Assets', data.assets, 'bg-blue-50')}
            {renderSection('Liabilities', data.liabilities, 'bg-red-50')}
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-4 py-3 bg-purple-50 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold">Equity</h4>
                  <span className="text-lg font-bold font-mono">{formatEGP(data.equity.total)}</span>
                </div>
              </div>
              {data.equity.accounts && data.equity.accounts.length > 0 ? (
                <table className="min-w-full">
                  <tbody className="divide-y divide-gray-100">
                    {data.equity.accounts.map((acc: any) => (
                      <tr key={acc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-xs text-gray-400">{acc.code}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{acc.name}</td>
                        <td className="px-4 py-2 text-sm text-right font-mono font-medium">
                          {formatEGP(Math.abs(parseInt(acc.balance)))}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-purple-50/50">
                      <td className="px-4 py-2 font-mono text-xs text-gray-400">—</td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-medium italic">Retained Earnings</td>
                      <td className="px-4 py-2 text-sm text-right font-mono font-medium">
                        {formatEGP(data.equity.retained_earnings)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div className="px-4 py-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 italic">Retained Earnings</span>
                    <span className="font-mono font-medium">{formatEGP(data.equity.retained_earnings)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
