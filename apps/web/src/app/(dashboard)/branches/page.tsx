'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { cn, formatDate } from '@/lib/utils';
import {
  Store, Tent, Plus, X, MapPin, Monitor, Eye, Pencil, Phone, Users,
  RefreshCw, ChevronDown, ChevronUp, Package, CheckCircle2, Globe,
  Calendar, Building2,
} from 'lucide-react';

const GOVERNORATES = [
  'Cairo', 'Giza', 'Alexandria', 'Dakahlia', 'Beheira', 'Sharqia', 'Qalyubia',
  'Monufia', 'Gharbia', 'Kafr El Sheikh', 'Damietta', 'Port Said', 'Ismailia',
  'Suez', 'North Sinai', 'South Sinai', 'Beni Suef', 'Fayoum', 'Minya', 'Asyut',
  'Sohag', 'Qena', 'Luxor', 'Aswan', 'Red Sea', 'New Valley', 'Matrouh',
];

interface Branch {
  id: string; name: string; code: string; branch_type: string;
  address_line1?: string; city?: string; governorate?: string; phone?: string;
  manager_name?: string; warehouse_id?: string; warehouse_name?: string;
  is_active: boolean; register_count: number; open_sessions: number;
  event_start_date?: string; event_end_date?: string; event_venue?: string;
  event_notes?: string; created_at: string;
}

interface Warehouse {
  id: string; name: string; code: string;
}

const typeIcons: Record<string, any> = { permanent: Store, exhibition: Tent, popup: Tent };
const typeColors: Record<string, string> = {
  permanent: 'bg-blue-100 text-blue-700', exhibition: 'bg-purple-100 text-purple-700',
  popup: 'bg-orange-100 text-orange-700',
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [form, setForm] = useState({
    name: '', code: '', branch_type: 'permanent', address_line1: '', city: 'Cairo',
    governorate: 'Cairo', phone: '', manager_name: '', warehouse_id: '',
    event_start_date: '', event_end_date: '', event_venue: '', event_notes: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [branchRes, whRes] = await Promise.all([
        api.get<any>('/branches'),
        api.get<any>('/warehouses'),
      ]);
      setBranches(branchRes?.data || []);
      const wh = whRes?.data || whRes || [];
      setWarehouses(Array.isArray(wh) ? wh : []);
    } catch { setBranches([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    try {
      const payload: any = { ...form };
      if (form.branch_type !== 'exhibition') {
        delete payload.event_start_date;
        delete payload.event_end_date;
        delete payload.event_venue;
        delete payload.event_notes;
      }
      await api.post('/branches', payload);
      setShowCreate(false);
      setForm({ name: '', code: '', branch_type: 'permanent', address_line1: '', city: 'Cairo', governorate: 'Cairo', phone: '', manager_name: '', warehouse_id: '', event_start_date: '', event_end_date: '', event_venue: '', event_notes: '' });
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const filtered = filterType === 'all' ? branches : branches.filter(b => b.branch_type === filterType);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
          <p className="text-sm text-gray-500 mt-1">Manage stores, exhibitions & pop-up locations</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600">
            <Plus className="h-4 w-4" />Add Branch
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1"><Store className="h-4 w-4 text-blue-500" /><p className="text-sm text-gray-500">Total Branches</p></div>
          <p className="text-2xl font-bold">{branches.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1"><Building2 className="h-4 w-4 text-blue-500" /><p className="text-sm text-gray-500">Permanent</p></div>
          <p className="text-2xl font-bold">{branches.filter(b => b.branch_type === 'permanent').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1"><Tent className="h-4 w-4 text-purple-500" /><p className="text-sm text-gray-500">Exhibitions</p></div>
          <p className="text-2xl font-bold">{branches.filter(b => b.branch_type === 'exhibition').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1"><Monitor className="h-4 w-4 text-green-500" /><p className="text-sm text-gray-500">Active Sessions</p></div>
          <p className="text-2xl font-bold text-green-600">{branches.reduce((s, b) => s + (b.open_sessions || 0), 0)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {['all', 'permanent', 'exhibition', 'popup'].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium capitalize',
              filterType === t ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
            {t}
          </button>
        ))}
      </div>

      {/* Branch Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Store className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">No branches yet. Create your first branch!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(branch => {
            const Icon = typeIcons[branch.branch_type] || Store;
            const expanded = expandedId === branch.id;
            return (
              <div key={branch.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setExpandedId(expanded ? null : branch.id)}>
                  <div className="flex items-center gap-4">
                    <div className={cn('p-3 rounded-xl', branch.is_active ? 'bg-blue-50' : 'bg-gray-50')}>
                      <Icon className={cn('h-6 w-6', branch.is_active ? 'text-blue-600' : 'text-gray-400')} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium capitalize', typeColors[branch.branch_type] || 'bg-gray-100')}>
                          {branch.branch_type}
                        </span>
                        {!branch.is_active && <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Inactive</span>}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="font-mono">{branch.code}</span>
                        {branch.city && <><span>•</span><MapPin className="h-3 w-3" /><span>{branch.city}, {branch.governorate}</span></>}
                        {branch.warehouse_name && <><span>•</span><Package className="h-3 w-3" /><span>{branch.warehouse_name}</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{branch.register_count} registers</p>
                      {branch.open_sessions > 0 && <p className="text-xs text-green-600">{branch.open_sessions} active session{branch.open_sessions > 1 ? 's' : ''}</p>}
                    </div>
                    {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>
                {expanded && (
                  <div className="border-t bg-gray-50 p-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Details</p>
                        {branch.address_line1 && <p className="text-sm text-gray-700 mb-1">📍 {branch.address_line1}</p>}
                        {branch.phone && <p className="text-sm text-gray-700 mb-1">📞 {branch.phone}</p>}
                        {branch.manager_name && <p className="text-sm text-gray-700 mb-1">👤 {branch.manager_name}</p>}
                        <p className="text-sm text-gray-500 mt-2">Created: {formatDate(branch.created_at)}</p>
                      </div>
                      {branch.branch_type === 'exhibition' && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Event Info</p>
                          {branch.event_venue && <p className="text-sm text-gray-700 mb-1">🏟️ {branch.event_venue}</p>}
                          {branch.event_start_date && <p className="text-sm text-gray-700 mb-1">📅 {formatDate(branch.event_start_date)} — {branch.event_end_date ? formatDate(branch.event_end_date) : 'Ongoing'}</p>}
                          {branch.event_notes && <p className="text-sm text-gray-700">{branch.event_notes}</p>}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Quick Actions</p>
                        <div className="flex flex-wrap gap-2">
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-white border rounded-lg text-sm hover:bg-blue-50 hover:border-blue-300">
                            <Monitor className="h-3.5 w-3.5" /> Open POS
                          </button>
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-white border rounded-lg text-sm hover:bg-green-50 hover:border-green-300">
                            <Package className="h-3.5 w-3.5" /> Stock
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Branch Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold">Create Branch</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Branch Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Type</label>
                <div className="flex gap-2">
                  {[{v:'permanent',l:'Permanent Store',i:Store},{v:'exhibition',l:'Exhibition',i:Tent},{v:'popup',l:'Pop-up',i:Globe}].map(({v,l,i:I}) => (
                    <button key={v} onClick={() => setForm({...form, branch_type: v})}
                      className={cn('flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                        form.branch_type === v ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-300 hover:bg-gray-50')}>
                      <I className="h-4 w-4" />{l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="Brushia Maadi" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="BR-MAADI" /></div>
              </div>

              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input value={form.address_line1} onChange={e => setForm({...form, address_line1: e.target.value})} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Governorate</label>
                  <select value={form.governorate} onChange={e => setForm({...form, governorate: e.target.value})} className="w-full px-3 py-2 rounded-lg border text-sm">
                    {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="+20..." /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                  <input value={form.manager_name} onChange={e => setForm({...form, manager_name: e.target.value})} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
              </div>

              <div><label className="block text-sm font-medium text-gray-700 mb-1">Linked Warehouse</label>
                <select value={form.warehouse_id} onChange={e => setForm({...form, warehouse_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border text-sm">
                  <option value="">— Select warehouse —</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                </select></div>

              {/* Exhibition-specific fields */}
              {form.branch_type === 'exhibition' && (
                <div className="bg-purple-50 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-purple-800 flex items-center gap-2"><Calendar className="h-4 w-4" /> Event Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-purple-700 mb-1">Start Date</label>
                      <input type="date" value={form.event_start_date} onChange={e => setForm({...form, event_start_date: e.target.value})} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
                    <div><label className="block text-xs font-medium text-purple-700 mb-1">End Date</label>
                      <input type="date" value={form.event_end_date} onChange={e => setForm({...form, event_end_date: e.target.value})} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
                  </div>
                  <div><label className="block text-xs font-medium text-purple-700 mb-1">Venue</label>
                    <input value={form.event_venue} onChange={e => setForm({...form, event_venue: e.target.value})} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="Cairo Exhibition Center" /></div>
                  <div><label className="block text-xs font-medium text-purple-700 mb-1">Notes</label>
                    <textarea value={form.event_notes} onChange={e => setForm({...form, event_notes: e.target.value})} className="w-full px-3 py-2 rounded-lg border text-sm" rows={2} /></div>
                </div>
              )}

              <button onClick={handleCreate} className="w-full py-2.5 rounded-lg bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors">
                Create Branch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
