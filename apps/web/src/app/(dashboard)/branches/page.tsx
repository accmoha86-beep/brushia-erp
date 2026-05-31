'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  Store, Tent, MessageCircle, Globe, Plus, X, Search, MapPin, Monitor,
  ChevronDown, ChevronUp, Pencil, Trash2, ArrowRight, UserCircle, Phone,
  Shield, Settings,
} from 'lucide-react';

const GOVERNORATES = [
  'Cairo', 'Giza', 'Alexandria', 'Dakahlia', 'Beheira', 'Sharqia', 'Qalyubia',
  'Monufia', 'Gharbia', 'Kafr El Sheikh', 'Damietta', 'Port Said', 'Ismailia',
  'Suez', 'North Sinai', 'South Sinai', 'Beni Suef', 'Fayoum', 'Minya', 'Asyut',
  'Sohag', 'Qena', 'Luxor', 'Aswan', 'Red Sea', 'New Valley', 'Matrouh',
];

interface Branch {
  id: string; name: string; code: string; city: string; type: string;
  pos_register_count: number; sku_count: number; total_stock: number;
  is_active: boolean; address?: string; governorate?: string;
  manager_name?: string; phone?: string;
}

interface POSRegister {
  id: string; name: string; code: string; status: 'open' | 'closed';
  assigned_cashier?: string;
}

export default function BranchesPage() {
  const { t, locale, isRTL } = useI18n();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
  const [posRegisters, setPosRegisters] = useState<POSRegister[]>([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: '', code: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<Branch | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [channelStats, setChannelStats] = useState({ branches: 0, exhibitions: 0, whatsapp: 0 });

  const [form, setForm] = useState({
    name: '', code: '', type: 'retail', city: '', governorate: '',
    address: '', manager_name: '', phone: '+20',
  });

  const loadBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/warehouses');
      const data = Array.isArray(res) ? res : res?.data || [];
      setBranches(data);
      setChannelStats({
        branches: data.filter((b: any) => b.type === 'retail' || b.type === 'warehouse' || b.type === 'showroom' || b.type === 'POS Branch').length,
        exhibitions: data.filter((b: any) => b.type === 'exhibition' || b.type === 'Exhibition Stock').length,
        whatsapp: 0,
      });
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { loadBranches(); }, [loadBranches]);

  const loadPOSRegisters = async (branchId: string) => {
    try {
      const res = await api.get<any>(`/pos/registers?location_id=${branchId}`);
      setPosRegisters(Array.isArray(res) ? res : res?.data || []);
    } catch { setPosRegisters([]); }
  };

  const handleExpand = (id: string) => {
    if (expandedBranch === id) { setExpandedBranch(null); }
    else { setExpandedBranch(id); loadPOSRegisters(id); }
  };

  const openCreate = () => {
    setEditBranch(null);
    setForm({ name: '', code: '', type: 'retail', city: '', governorate: '', address: '', manager_name: '', phone: '+20' });
    setShowModal(true);
  };

  const openEdit = (b: Branch) => {
    setEditBranch(b);
    setForm({
      name: b.name, code: b.code, type: b.type, city: b.city || '',
      governorate: b.governorate || '', address: b.address || '',
      manager_name: b.manager_name || '', phone: b.phone || '+20',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editBranch) {
        await api.put(`/warehouses/${editBranch.id}`, form);
      } else {
        await api.post('/warehouses', form);
      }
      setShowModal(false); loadBranches();
    } catch (e: any) { alert(e.message || 'Failed'); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.delete(`/warehouses/${deleteConfirm.id}`);
      setDeleteConfirm(null); loadBranches();
    } catch (e: any) { alert(e.message || 'Failed to delete'); }
    setDeleting(false);
  };

  const handleAddRegister = async () => {
    if (!expandedBranch) return;
    try {
      await api.post('/pos/registers', {
        name: registerForm.name,
        location_id: expandedBranch,
        device_name: registerForm.code || undefined,
      });
      setShowRegisterModal(false);
      setRegisterForm({ name: '', code: '' });
      loadPOSRegisters(expandedBranch);
    } catch (e: any) { alert(e.message || 'Failed'); }
  };

  const filtered = branches.filter(
    (b) => `${b.name} ${b.code} ${b.city} ${b.type}`.toLowerCase().includes(search.toLowerCase())
  );

  const typeColors: Record<string, string> = {
    retail: 'bg-emerald-100 text-emerald-700', warehouse: 'bg-blue-100 text-blue-700',
    showroom: 'bg-purple-100 text-purple-700', exhibition: 'bg-amber-100 text-amber-700',
    returns: 'bg-red-100 text-red-700', 'POS Branch': 'bg-emerald-100 text-emerald-700',
    'Warehouse': 'bg-blue-100 text-blue-700', 'Exhibition Stock': 'bg-amber-100 text-amber-700',
  };

  const typeLabels: Record<string, string> = {
    retail: 'POS Branch', warehouse: 'Warehouse', showroom: 'Showroom',
    exhibition: 'Exhibition', returns: 'Returns Center',
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Channels & Branches</h1>
        <p className="text-sm text-gray-500 mt-1">
          Back Office controls all sales channels — POS branches, exhibitions, WhatsApp, and e-commerce.
        </p>
      </div>

      {/* 4 Channel Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* POS Branches */}
        <div className="rounded-xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-emerald-100 p-2.5">
              <Store className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">POS Branches</h3>
              <p className="text-xs text-gray-500">Physical store locations with POS registers</p>
            </div>
          </div>
          <button onClick={() => document.getElementById('branch-table')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-700 transition">
            Manage <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Exhibitions */}
        <div className="rounded-xl border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-amber-100 p-2.5">
              <Tent className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Exhibitions</h3>
              <p className="text-xs text-gray-500">Temporary branches — pop-up events & fairs</p>
            </div>
          </div>
          <button onClick={() => document.getElementById('branch-table')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-700 transition">
            Manage <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* WhatsApp */}
        <div className="rounded-xl border-2 border-green-100 bg-gradient-to-br from-green-50 to-white p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-green-100 p-2.5">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">WhatsApp</h3>
              <p className="text-xs text-gray-500">Order intake via WhatsApp conversations</p>
            </div>
          </div>
          <a href="/whatsapp"
            className="flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-700 transition">
            Manage <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* E-commerce */}
        <div className="rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 opacity-80">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-blue-100 p-2.5">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">E-commerce</h3>
              <p className="text-xs text-gray-500">Online store (coming soon)</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-500">
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-600">Coming Soon</span>
          </span>
        </div>
      </div>

      {/* Central Control Notice */}
      <div className="rounded-xl border bg-white p-4 flex items-center gap-4 text-center justify-center">
        <Shield className="h-6 w-6 text-rose-400 flex-shrink-0" />
        <div>
          <p className="font-semibold text-gray-900 text-sm">Back Office Central Control</p>
          <p className="text-xs text-gray-500">
            Promotions, inventory transfers, purchasing, and reports are managed here. POS terminals only handle sales and returns.
          </p>
        </div>
      </div>

      {/* Branch Management Table */}
      <div id="branch-table" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Branch Management</h2>
          <button onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 transition shadow-sm">
            <Plus className="h-4 w-4" /> Add Branch
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search branches..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border py-2 pl-10 pr-4 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
        </div>

        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 w-8"></th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Branch</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">City</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Registers</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('common.status')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}><td colSpan={9} className="px-4 py-4"><div className="h-10 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-500">
                    <Store className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    {search ? 'No branches match your search.' : 'No branches yet. Create your first branch to get started.'}
                  </td>
                </tr>
              ) : (
                filtered.map((branch) => (
                  <tbody key={branch.id}>
                    <tr onClick={() => handleExpand(branch.id)} className="hover:bg-gray-50 cursor-pointer group">
                      <td className="px-4 py-3">
                        {expandedBranch === branch.id
                          ? <ChevronUp className="h-4 w-4 text-gray-400" />
                          : <ChevronDown className="h-4 w-4 text-gray-400" />}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{branch.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{branch.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{branch.city || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', typeColors[branch.type] || 'bg-gray-100 text-gray-700')}>
                          {typeLabels[branch.type] || branch.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">{branch.pos_register_count || 0}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">{branch.total_stock || 0}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                          branch.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700')}>
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={(e) => { e.stopPropagation(); openEdit(branch); }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(branch); }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedBranch === branch.id && (
                      <tr>
                        <td colSpan={9} className="bg-gray-50 px-6 py-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Monitor className="h-4 w-4" /> POS Registers
                              </h3>
                              <button onClick={(e) => { e.stopPropagation(); setShowRegisterModal(true); }}
                                className="flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-600 transition">
                                <Plus className="h-3 w-3" /> Add Register
                              </button>
                            </div>
                            {posRegisters.length === 0 ? (
                              <p className="text-sm text-gray-500 py-4 text-center">No POS registers for this branch.</p>
                            ) : (
                              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                                {posRegisters.map((reg) => (
                                  <div key={reg.id} className="rounded-lg border bg-white p-3 shadow-sm">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-sm font-medium text-gray-900">{reg.name}</p>
                                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                                        reg.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700')}>
                                        {reg.status}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-mono">{reg.code}</p>
                                    {reg.assigned_cashier && (
                                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                        <UserCircle className="h-3 w-3" /> {reg.assigned_cashier}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Branch Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editBranch ? 'Edit Branch' : 'Create Branch'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                  <input type="text" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Heliopolis Showroom"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input type="text" value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="BR-001"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500">
                  <option value="retail">🏪 POS Branch (Retail)</option>
                  <option value="warehouse">📦 Warehouse</option>
                  <option value="showroom">🏬 Showroom</option>
                  <option value="exhibition">🎪 Exhibition</option>
                  <option value="returns">🔄 Returns Center</option>
                </select>
              </div>
              {form.type === 'exhibition' && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                  🎪 Exhibition branches are temporary pop-up locations for events and fairs.
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Heliopolis"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Governorate</label>
                  <select value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500">
                    <option value="">Select...</option>
                    {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Full address..."
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manager Name</label>
                  <input type="text" value={form.manager_name}
                    onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="text" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+20 1XX XXX XXXX"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleSave}
                  className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 transition">
                  {editBranch ? 'Save Changes' : 'Create Branch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Branch</h3>
              <p className="text-sm text-gray-500 mt-1">
                Delete <strong>{deleteConfirm.name}</strong>? This will remove the branch and all its POS registers.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add POS Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Add POS Register</h2>
              <button onClick={() => setShowRegisterModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Register Name</label>
                <input type="text" value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  placeholder="Register 1"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input type="text" value={registerForm.code}
                  onChange={(e) => setRegisterForm({ ...registerForm, code: e.target.value })}
                  placeholder="POS-001"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowRegisterModal(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleAddRegister}
                  className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600">
                  Add Register
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
