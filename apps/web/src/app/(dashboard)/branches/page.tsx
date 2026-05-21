'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  Store,
  Tent,
  MessageCircle,
  Globe,
  Plus,
  X,
  Search,
  MapPin,
  Monitor,
  Package,
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  Brain,
  ArrowRight,
  UserCircle,
  Phone,
} from 'lucide-react';

const GOVERNORATES = [
  'Cairo', 'Giza', 'Alexandria', 'Dakahlia', 'Beheira', 'Sharqia', 'Qalyubia',
  'Monufia', 'Gharbia', 'Kafr El Sheikh', 'Damietta', 'Port Said', 'Ismailia',
  'Suez', 'North Sinai', 'South Sinai', 'Beni Suef', 'Fayoum', 'Minya', 'Asyut',
  'Sohag', 'Qena', 'Luxor', 'Aswan', 'Red Sea', 'New Valley', 'Matrouh',
];

interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
  type: string;
  pos_register_count: number;
  sku_count: number;
  total_stock: number;
  is_active: boolean;
}

interface POSRegister {
  id: string;
  name: string;
  code: string;
  status: 'open' | 'closed';
  assigned_cashier: string;
}

interface ChannelStats {
  active_branches: number;
  active_exhibitions: number;
  open_whatsapp: number;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [channelStats, setChannelStats] = useState<ChannelStats>({ active_branches: 0, active_exhibitions: 0, open_whatsapp: 0 });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
  const [posRegisters, setPosRegisters] = useState<POSRegister[]>([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: '', code: '' });
  const [form, setForm] = useState({
    name: '',
    code: '',
    type: 'POS Branch',
    city: '',
    governorate: '',
    address: '',
    manager_name: '',
    phone: '+20',
    warehouse_id: '',
  });

  useEffect(() => {
    loadBranches();
    loadChannelStats();
  }, []);

  const loadBranches = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.get('/inventory/warehouses', token);
      const data = Array.isArray(res) ? res : res.data || [];
      setBranches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadChannelStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      // Load stats from multiple endpoints
      const [branchRes, exhRes, waRes] = await Promise.allSettled([
        api.get('/inventory/warehouses', token),
        api.get('/exhibitions', token),
        api.get('/whatsapp/stats', token),
      ]);
      const branchData = branchRes.status === 'fulfilled' ? (Array.isArray(branchRes.value) ? branchRes.value : branchRes.value.data || []) : [];
      const exhData = exhRes.status === 'fulfilled' ? (Array.isArray(exhRes.value) ? exhRes.value : exhRes.value.data || []) : [];
      const waData = exhRes.status === 'fulfilled' ? (waRes.status === 'fulfilled' ? (waRes.value.data || waRes.value) : {}) : {};
      setChannelStats({
        active_branches: branchData.filter((b: any) => b.is_active).length,
        active_exhibitions: exhData.filter((e: any) => e.status === 'active').length,
        open_whatsapp: (waData as any).open_conversations || 0,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const loadPOSRegisters = async (branchId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await api.get(`/inventory/warehouses/${branchId}/pos-registers`, token);
      const data = Array.isArray(res) ? res : res.data || [];
      setPosRegisters(data);
    } catch (err) {
      console.error(err);
      setPosRegisters([]);
    }
  };

  const handleExpand = (id: string) => {
    if (expandedBranch === id) {
      setExpandedBranch(null);
    } else {
      setExpandedBranch(id);
      loadPOSRegisters(id);
    }
  };

  const handleCreate = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await api.post('/inventory/warehouses', {
        name: form.name,
        code: form.code,
        type: form.type,
        city: form.city,
        governorate: form.governorate,
        address: form.address,
        manager_name: form.manager_name,
        phone: form.phone,
        warehouse_id: form.warehouse_id,
      }, token);
      setShowModal(false);
      setForm({ name: '', code: '', type: 'POS Branch', city: '', governorate: '', address: '', manager_name: '', phone: '+20', warehouse_id: '' });
      loadBranches();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRegister = async () => {
    if (!expandedBranch) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await api.post(`/inventory/warehouses/${expandedBranch}/pos-registers`, {
        name: registerForm.name,
        code: registerForm.code,
      }, token);
      setShowRegisterModal(false);
      setRegisterForm({ name: '', code: '' });
      loadPOSRegisters(expandedBranch);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = branches.filter(
    (b) => `${b.name} ${b.code} ${b.city}`.toLowerCase().includes(search.toLowerCase())
  );

  const typeColors: Record<string, string> = {
    warehouse: 'bg-blue-100 text-blue-700',
    showroom: 'bg-purple-100 text-purple-700',
    exhibition: 'bg-amber-100 text-amber-700',
    returns: 'bg-red-100 text-red-700',
    'POS Branch': 'bg-emerald-100 text-emerald-700',
    Warehouse: 'bg-blue-100 text-blue-700',
    Showroom: 'bg-purple-100 text-purple-700',
    'Exhibition Stock': 'bg-amber-100 text-amber-700',
    'Returns Center': 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="rounded-xl border bg-gradient-to-r from-rose-50 to-pink-50 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-lg bg-rose-100 p-2">
            <Brain className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Channels & Branches</h1>
            <p className="text-sm text-gray-600">
              Back Office controls all channels — POS branches, exhibitions, WhatsApp, and e-commerce
            </p>
          </div>
        </div>
      </div>

      {/* 4 Channel Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* POS Branches */}
        <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-emerald-50 p-2.5">
              <Store className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">POS Branches</h3>
              <p className="text-xs text-gray-500">In-store sales points</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{channelStats.active_branches}</p>
          <p className="text-xs text-gray-500 mb-3">Active branches</p>
          <button
            onClick={() => document.getElementById('branch-table')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-700"
          >
            Manage <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Exhibitions */}
        <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-amber-50 p-2.5">
              <Tent className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Exhibitions</h3>
              <p className="text-xs text-gray-500">Event-based sales</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{channelStats.active_exhibitions}</p>
          <p className="text-xs text-gray-500 mb-3">Active events</p>
          <a
            href="/exhibitions"
            className="flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-700"
          >
            View Events <ArrowRight className="h-3 w-3" />
          </a>
        </div>

        {/* WhatsApp */}
        <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-green-50 p-2.5">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">WhatsApp</h3>
              <p className="text-xs text-gray-500">Chat commerce</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{channelStats.open_whatsapp}</p>
          <p className="text-xs text-gray-500 mb-3">Open conversations</p>
          <a
            href="/whatsapp"
            className="flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-700"
          >
            View Chats <ArrowRight className="h-3 w-3" />
          </a>
        </div>

        {/* E-commerce */}
        <div className="rounded-xl border bg-white p-5 shadow-sm opacity-75">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">E-commerce</h3>
              <p className="text-xs text-gray-500">Online store</p>
            </div>
          </div>
          <div className="mb-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              Coming Soon
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3">Shopify / WooCommerce integration</p>
          <span className="flex items-center gap-1 text-sm font-medium text-gray-400 cursor-not-allowed">
            Coming Soon <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* Branch Management Table */}
      <div id="branch-table" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Branch Management</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
          >
            <Plus className="h-4 w-4" />
            Create Branch
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search branches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border py-2 pl-10 pr-4 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>

        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 w-8"></th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Branch Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">City</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">POS Registers</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">SKUs</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Total Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-500">
                    <Store className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    {search ? 'No branches match your search.' : 'No branches yet. Create your first branch to get started.'}
                  </td>
                </tr>
              ) : (
                filtered.map((branch) => (
                  <>
                    <tr
                      key={branch.id}
                      onClick={() => handleExpand(branch.id)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        {expandedBranch === branch.id ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{branch.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{branch.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{branch.city || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', typeColors[branch.type] || 'bg-gray-100 text-gray-700')}>
                          {branch.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">{branch.pos_register_count || 0}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">{branch.sku_count || 0}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">{branch.total_stock || 0}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            branch.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                    {expandedBranch === branch.id && (
                      <tr key={`${branch.id}-pos`}>
                        <td colSpan={9} className="bg-gray-50 px-6 py-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Monitor className="h-4 w-4" />
                                POS Registers
                              </h3>
                              <button
                                onClick={(e) => { e.stopPropagation(); setShowRegisterModal(true); }}
                                className="flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-600"
                              >
                                <Plus className="h-3 w-3" />
                                Add Register
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
                                      <span
                                        className={cn(
                                          'px-2 py-0.5 rounded-full text-xs font-medium',
                                          reg.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                                        )}
                                      >
                                        {reg.status}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-mono">{reg.code}</p>
                                    {reg.assigned_cashier && (
                                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                        <UserCircle className="h-3 w-3" />
                                        {reg.assigned_cashier}
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
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Branch Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Create Branch</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Heliopolis Showroom"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="BR-001"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="POS Branch">POS Branch</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Showroom">Showroom</option>
                  <option value="Exhibition Stock">Exhibition Stock</option>
                  <option value="Returns Center">Returns Center</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Heliopolis"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Governorate</label>
                  <select
                    value={form.governorate}
                    onChange={(e) => setForm({ ...form, governorate: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="">Select governorate...</option>
                    {GOVERNORATES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Full address..."
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manager Name</label>
                  <input
                    type="text"
                    value={form.manager_name}
                    onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+20 1XX XXX XXXX"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
                >
                  Create Branch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add POS Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
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
                <input
                  type="text"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  placeholder="Register 1"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  value={registerForm.code}
                  onChange={(e) => setRegisterForm({ ...registerForm, code: e.target.value })}
                  placeholder="POS-001"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRegister}
                  className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
                >
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
