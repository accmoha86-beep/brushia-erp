'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/stores/auth.store';
import {
  BookOpen, Plus, Edit2, Trash2, ChevronRight, ChevronDown, Search,
  Filter, Download, Upload, TreePine, Eye, EyeOff, ToggleLeft, ToggleRight,
  Building2, DollarSign, TrendingUp, TrendingDown, Scale, Wallet,
  AlertCircle, Check, X, FolderTree, Layers, RefreshCw, FileSpreadsheet,
  Copy, MoreVertical, ChevronUp
} from 'lucide-react';

const API = '';

async function api(path: string, token: string, opts?: RequestInit) {
  const res = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, ...(opts?.headers || {}) },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `HTTP ${res.status}`); }
  return res.json();
}

function fmtEGP(piasters: number): string {
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 2 }).format((piasters || 0) / 100);
}

// Account type config
const accountTypes: Record<string, { label: string; labelAr: string; color: string; bg: string; icon: any; gradient: string }> = {
  asset: { label: 'Assets', labelAr: 'الأصول', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Building2, gradient: 'from-blue-500 to-blue-600' },
  liability: { label: 'Liabilities', labelAr: 'الالتزامات', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: Scale, gradient: 'from-red-500 to-red-600' },
  equity: { label: 'Equity', labelAr: 'حقوق الملكية', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: Wallet, gradient: 'from-purple-500 to-purple-600' },
  revenue: { label: 'Revenue', labelAr: 'الإيرادات', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: TrendingUp, gradient: 'from-green-500 to-green-600' },
  expense: { label: 'Expenses', labelAr: 'المصروفات', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: TrendingDown, gradient: 'from-orange-500 to-orange-600' },
};

type Account = {
  id: string; account_number: string; code?: string; name: string; name_ar?: string;
  account_type: string; parent_id?: string; parent_name?: string;
  is_system: boolean; is_active: boolean; balance: number; currency: string;
  description?: string; is_bank_account?: boolean; child_count?: number;
  children?: Account[];
};

// ═══ Tree Node Component ═══════════════════════════════
function TreeNode({ account, depth, expanded, onToggle, onEdit, onDelete, onAddChild, searchTerm }: {
  account: Account; depth: number; expanded: Set<string>;
  onToggle: (id: string) => void; onEdit: (a: Account) => void;
  onDelete: (a: Account) => void; onAddChild: (a: Account) => void; searchTerm: string;
}) {
  const isOpen = expanded.has(account.id);
  const hasChildren = account.children && account.children.length > 0;
  const typeConf = accountTypes[account.account_type] || accountTypes.asset;
  const TypeIcon = typeConf.icon;

  const highlight = (text: string) => {
    if (!searchTerm || !text) return text;
    const idx = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (idx < 0) return text;
    return <>{text.slice(0, idx)}<mark className="bg-yellow-200 rounded px-0.5">{text.slice(idx, idx + searchTerm.length)}</mark>{text.slice(idx + searchTerm.length)}</>;
  };

  return (
    <>
      <div
        className={`group flex items-center gap-2 py-2.5 px-3 rounded-lg transition-all duration-200 hover:bg-gray-50 border border-transparent hover:border-gray-200 ${!account.is_active ? 'opacity-50' : ''}`}
        style={{ paddingLeft: `${depth * 28 + 12}px` }}
      >
        {/* Expand/Collapse */}
        <button
          onClick={() => hasChildren && onToggle(account.id)}
          className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${hasChildren ? 'hover:bg-gray-200 cursor-pointer' : 'cursor-default'}`}
        >
          {hasChildren ? (
            isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          )}
        </button>

        {/* Type Icon */}
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeConf.gradient} flex items-center justify-center shadow-sm`}>
          <TypeIcon className="w-4 h-4 text-white" />
        </div>

        {/* Account Code */}
        <span className="font-mono text-sm font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded min-w-[60px] text-center">
          {highlight(account.account_number)}
        </span>

        {/* Account Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{highlight(account.name)}</span>
            {account.name_ar && (
              <span className="text-sm text-gray-500 font-arabic truncate" dir="rtl">({highlight(account.name_ar)})</span>
            )}
          </div>
          {account.description && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{account.description}</p>
          )}
        </div>

        {/* Type Badge */}
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeConf.bg} ${typeConf.color} border`}>
          {typeConf.labelAr}
        </span>

        {/* Balance */}
        <span className={`font-mono text-sm font-medium min-w-[100px] text-right ${Number(account.balance) >= 0 ? 'text-gray-700' : 'text-red-600'}`}>
          {fmtEGP(Number(account.balance))}
        </span>

        {/* System badge */}
        {account.is_system && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">نظام</span>
        )}

        {/* Inactive badge */}
        {!account.is_active && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">معطل</span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onAddChild(account)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500" title="إضافة حساب فرعي">
            <Plus className="w-3.5 h-3.5" />
          </button>
          {!account.is_system && (
            <>
              <button onClick={() => onEdit(account)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title="تعديل">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(account)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="حذف">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Children */}
      {isOpen && hasChildren && (
        <div className="relative">
          <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-gray-200" style={{ left: `${depth * 28 + 24}px` }} />
          {account.children!.map(child => (
            <TreeNode key={child.id} account={child} depth={depth + 1} expanded={expanded}
              onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} searchTerm={searchTerm} />
          ))}
        </div>
      )}
    </>
  );
}

// ═══ Account Form Modal ═══════════════════════════════
function AccountFormModal({ isOpen, onClose, onSave, account, parentAccount, allAccounts, isLoading }: {
  isOpen: boolean; onClose: () => void; onSave: (data: any) => void;
  account?: Account | null; parentAccount?: Account | null; allAccounts: Account[];
  isLoading: boolean;
}) {
  const { t, locale, isRTL } = useI18n();
  const [form, setForm] = useState({
    account_number: '', name: '', name_ar: '', account_type: 'asset',
    parent_id: '', description: '', is_bank_account: false, is_active: true, currency: 'EGP',
  });

  useEffect(() => {
    if (account) {
      setForm({
        account_number: account.account_number || '',
        name: account.name || '', name_ar: account.name_ar || '',
        account_type: account.account_type || 'asset',
        parent_id: account.parent_id || '',
        description: account.description || '',
        is_bank_account: account.is_bank_account || false,
        is_active: account.is_active !== false,
        currency: account.currency || 'EGP',
      });
    } else {
      setForm({
        account_number: '', name: '', name_ar: '',
        account_type: parentAccount?.account_type || 'asset',
        parent_id: parentAccount?.id || '',
        description: '', is_bank_account: false, is_active: true, currency: 'EGP',
      });
    }
  }, [account, parentAccount, isOpen]);

  const isEdit = !!account;
  const flatAccounts = useMemo(() => {
    const flat: Account[] = [];
    const walk = (list: Account[]) => list.forEach(a => { flat.push(a); if (a.children) walk(a.children); });
    walk(allAccounts);
    return flat;
  }, [allAccounts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-5 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {isEdit ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {isEdit ? 'تعديل حساب' : parentAccount ? `إضافة حساب فرعي لـ ${parentAccount.name}` : 'إضافة حساب جديد'}
          </h2>
          {isEdit && <p className="text-sm text-white/80 mt-1">{account?.name} ({account?.account_number})</p>}
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Row: Code + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الحساب *</label>
              <input type="text" value={form.account_number} onChange={e => setForm({...form, account_number: e.target.value})}
                placeholder="e.g. 1100" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-400 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع الحساب *</label>
              <select value={form.account_type} onChange={e => setForm({...form, account_type: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-400">
                {Object.entries(accountTypes).map(([k, v]) => (
                  <option key={k} value={k}>{v.labelAr} — {v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: English Name + Arabic Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم الحساب (English) *</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                placeholder="Cash on Hand" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم الحساب (عربي)</label>
              <input type="text" value={form.name_ar} onChange={e => setForm({...form, name_ar: e.target.value})}
                dir="rtl" placeholder="النقدية" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-400" />
            </div>
          </div>

          {/* Parent Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحساب الأب (Parent)</label>
            <select value={form.parent_id} onChange={e => setForm({...form, parent_id: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-400">
              <option value="">— حساب رئيسي (Root) —</option>
              {flatAccounts.filter(a => a.id !== account?.id).map(a => (
                <option key={a.id} value={a.id}>{a.account_number} — {a.name} {a.name_ar ? `(${a.name_ar})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              rows={2} placeholder="وصف الحساب..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-400" />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_bank_account} onChange={e => setForm({...form, is_bank_account: e.target.checked})}
                className="w-4 h-4 text-pink-500 focus:ring-pink-300 rounded" />
              <span className="text-sm text-gray-700">حساب بنكي</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})}
                className="w-4 h-4 text-pink-500 focus:ring-pink-300 rounded" />
              <span className="text-sm text-gray-700">نشط</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">إلغاء</button>
          <button onClick={() => onSave(form)} disabled={isLoading || !form.account_number || !form.name}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isEdit ? 'حفظ التعديلات' : 'إنشاء الحساب'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══ Main Page ═════════════════════════════════════════
export default function ChartOfAccountsPage() {
  const { accessToken } = useAuthStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [flatAccounts, setFlatAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [parentForNew, setParentForNew] = useState<Account | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Account | null>(null);

  const loadAccounts = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const [tree, flat] = await Promise.all([
        api('/api/v1/accounting/accounts/tree', accessToken),
        api('/api/v1/accounting/accounts', accessToken),
      ]);
      const treeData = Array.isArray(tree) ? tree : tree?.data || tree?.rows || [];
      const flatData = Array.isArray(flat) ? flat : flat?.data || flat?.rows || [];
      setAccounts(treeData);
      setFlatAccounts(flatData);
      // Auto-expand root nodes
      setExpanded(prev => {
        const next = new Set(prev);
        treeData.forEach((a: Account) => next.add(a.id));
        return next;
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  // Toggle expand
  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Expand/Collapse all
  const expandAll = () => {
    const allIds = new Set<string>();
    const walk = (list: Account[]) => list.forEach(a => { allIds.add(a.id); if (a.children) walk(a.children); });
    walk(accounts);
    setExpanded(allIds);
  };
  const collapseAll = () => setExpanded(new Set());

  // Filter accounts in tree
  const filterTree = useCallback((nodes: Account[]): Account[] => {
    return nodes.reduce<Account[]>((acc, node) => {
      const matchesSearch = !search ||
        node.name.toLowerCase().includes(search.toLowerCase()) ||
        (node.name_ar || '').includes(search) ||
        node.account_number.includes(search);
      const matchesType = typeFilter === 'all' || node.account_type === typeFilter;
      const matchesActive = showInactive || node.is_active;
      const filteredChildren = node.children ? filterTree(node.children) : [];

      if ((matchesSearch && matchesType && matchesActive) || filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren });
      }
      return acc;
    }, []);
  }, [search, typeFilter, showInactive]);

  const filteredAccounts = useMemo(() => filterTree(accounts), [accounts, filterTree]);

  // Save account
  const handleSave = async (data: any) => {
    if (!accessToken) return;
    setSaving(true);
    try {
      if (editAccount) {
        await api(`/api/v1/accounting/accounts/${editAccount.id}`, accessToken, { method: 'PUT', body: JSON.stringify(data) });
      } else {
        await api('/api/v1/accounting/accounts', accessToken, { method: 'POST', body: JSON.stringify(data) });
      }
      setModalOpen(false);
      setEditAccount(null);
      setParentForNew(null);
      await loadAccounts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete account
  const handleDelete = async () => {
    if (!accessToken || !confirmDelete) return;
    setSaving(true);
    try {
      await api(`/api/v1/accounting/accounts/${confirmDelete.id}`, accessToken, { method: 'DELETE' });
      setConfirmDelete(null);
      await loadAccounts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ['رقم الحساب', 'اسم الحساب', 'الاسم بالعربي', 'النوع', 'الحساب الأب', 'الرصيد', 'نشط', 'نظام'];
    const rows = flatAccounts.map(a => [
      a.account_number, a.name, a.name_ar || '', a.account_type,
      a.parent_name || '', fmtEGP(Number(a.balance)), a.is_active ? 'نعم' : 'لا', a.is_system ? 'نعم' : 'لا'
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `chart-of-accounts-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  // Stats
  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    let active = 0, inactive = 0, total = flatAccounts.length;
    flatAccounts.forEach(a => {
      byType[a.account_type] = (byType[a.account_type] || 0) + 1;
      if (a.is_active) active++; else inactive++;
    });
    return { byType, active, inactive, total };
  }, [flatAccounts]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ─── Header ───────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
              <FolderTree className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                شجرة الحسابات
                <span className="text-lg text-gray-400">Chart of Accounts</span>
              </h1>
              <p className="text-sm text-gray-500">إدارة الحسابات المحاسبية — الأصول والالتزامات وحقوق الملكية والإيرادات والمصروفات</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50 text-sm">
              <Download className="w-4 h-4" /> تصدير CSV
            </button>
            <button onClick={() => { setEditAccount(null); setParentForNew(null); setModalOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
              <Plus className="w-4 h-4" /> حساب جديد
            </button>
          </div>
        </div>
      </div>

      {/* ─── Stats Cards ────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">إجمالي الحسابات</p>
        </div>
        {Object.entries(accountTypes).map(([key, conf]) => {
          const Icon = conf.icon;
          return (
            <button key={key} onClick={() => setTypeFilter(typeFilter === key ? 'all' : key)}
              className={`bg-white rounded-xl p-3 border shadow-sm text-center transition-all hover:shadow-md ${typeFilter === key ? 'ring-2 ring-pink-400' : ''}`}>
              <div className="flex items-center justify-center gap-1">
                <Icon className={`w-4 h-4 ${conf.color}`} />
                <span className="text-2xl font-bold text-gray-900">{stats.byType[key] || 0}</span>
              </div>
              <p className="text-xs text-gray-500">{conf.labelAr}</p>
            </button>
          );
        })}
        <div className="bg-white rounded-xl p-3 border shadow-sm text-center">
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <p className="text-xs text-gray-500">نشط</p>
        </div>
      </div>

      {/* ─── Toolbar ──────────────────────── */}
      <div className="bg-white rounded-xl border shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="بحث بالرقم أو الاسم..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-400 text-sm" />
          </div>

          {/* Type filter buttons */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${typeFilter === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              الكل
            </button>
            {Object.entries(accountTypes).map(([key, conf]) => (
              <button key={key} onClick={() => setTypeFilter(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${typeFilter === key ? 'bg-white shadow ' + conf.color : 'text-gray-500 hover:text-gray-700'}`}>
                {conf.labelAr}
              </button>
            ))}
          </div>

          {/* Toggle inactive */}
          <button onClick={() => setShowInactive(!showInactive)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${showInactive ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-50'}`}>
            {showInactive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showInactive ? 'إخفاء المعطل' : 'عرض المعطل'}
          </button>

          {/* Expand/Collapse */}
          <button onClick={expandAll} className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg">
            <ChevronDown className="w-3.5 h-3.5" /> فتح الكل
          </button>
          <button onClick={collapseAll} className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg">
            <ChevronUp className="w-3.5 h-3.5" /> إغلاق الكل
          </button>

          {/* Refresh */}
          <button onClick={loadAccounts} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Tree View ──────────────────────── */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="w-6" />
          <div className="w-8" />
          <div className="min-w-[60px] text-center">الرقم</div>
          <div className="flex-1">اسم الحساب</div>
          <div className="min-w-[80px] text-center">النوع</div>
          <div className="min-w-[100px] text-right">الرصيد</div>
          <div className="w-[90px]" />
        </div>

        {/* Tree */}
        <div className="divide-y divide-gray-50 p-2">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-8 h-8 text-pink-400 animate-spin" />
              <span className="ml-3 text-gray-500">جاري تحميل شجرة الحسابات...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 text-red-500">
              <AlertCircle className="w-6 h-6 mr-2" />{error}
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد حسابات</p>
            </div>
          ) : (
            filteredAccounts.map(account => (
              <TreeNode key={account.id} account={account} depth={0} expanded={expanded}
                onToggle={toggleExpand}
                onEdit={a => { setEditAccount(a); setParentForNew(null); setModalOpen(true); }}
                onDelete={a => setConfirmDelete(a)}
                onAddChild={a => { setEditAccount(null); setParentForNew(a); setModalOpen(true); }}
                searchTerm={search}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t text-sm text-gray-500">
          <span>{filteredAccounts.length} حساب رئيسي — {stats.total} إجمالي</span>
          <span className="font-arabic text-xs">Brushia ERP — شجرة الحسابات المحاسبية</span>
        </div>
      </div>

      {/* ─── Account Form Modal ─────────────── */}
      <AccountFormModal
        isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditAccount(null); setParentForNew(null); }}
        onSave={handleSave} account={editAccount} parentAccount={parentForNew}
        allAccounts={accounts} isLoading={saving}
      />

      {/* ─── Delete Confirmation ──────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">حذف الحساب</h3>
                <p className="text-sm text-gray-500">هل أنت متأكد من حذف هذا الحساب؟</p>
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 mb-4">
              <p className="font-medium text-red-800">{confirmDelete.account_number} — {confirmDelete.name}</p>
              {confirmDelete.name_ar && <p className="text-sm text-red-600" dir="rtl">{confirmDelete.name_ar}</p>}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
              <button onClick={handleDelete} disabled={saving}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                حذف نهائي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
