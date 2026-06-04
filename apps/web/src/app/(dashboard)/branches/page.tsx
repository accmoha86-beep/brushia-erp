'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard, StatCardGrid } from '@/components/ui/stat-card';
import { SearchFilter, FilterTabs } from '@/components/ui/search-filter';
import { BloomModal, BtnPrimary, BtnSecondary, BtnDanger } from '@/components/ui/bloom-modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState, TableSkeleton } from '@/components/ui/empty-state';
import { Table, Thead, Th, Td, Tr } from '@/components/ui/table';
import {
  Store, Plus, RefreshCw, MapPin, Monitor, Pencil, Trash2,
  Tent, MessageCircle, Globe, ArrowRight, Shield, Phone,
  Building2, Users, Package, ChevronDown, ChevronRight, X,
} from 'lucide-react';

const GOVERNORATES = [
  'Cairo','Giza','Alexandria','Dakahlia','Beheira','Sharqia','Qalyubia',
  'Monufia','Gharbia','Kafr El Sheikh','Damietta','Port Said','Ismailia',
  'Suez','North Sinai','South Sinai','Beni Suef','Fayoum','Minya','Asyut',
  'Sohag','Qena','Luxor','Aswan','Red Sea','New Valley','Matrouh',
];

interface Branch {
  id: string; name: string; code: string; branch_type: string;
  city?: string; governorate?: string; phone?: string; manager_name?: string;
  address_line1?: string; warehouse_id?: string; warehouse_name?: string;
  is_active: boolean; register_count?: number; open_sessions?: number;
  event_start_date?: string; event_end_date?: string; event_venue?: string;
}

const emptyForm = {
  name: '', code: '', branch_type: 'permanent', city: '', governorate: '',
  address_line1: '', manager_name: '', phone: '+20', warehouse_id: '',
};

export default function BranchesPage() {
  const { t } = useI18n();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Branch | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [registers, setRegisters] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const loadBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/branches');
      const raw = res?.data?.rows || res?.data || res?.rows || (Array.isArray(res) ? res : []);
      setBranches(Array.isArray(raw) ? raw : []);
    } catch { setBranches([]); }
    finally { setLoading(false); }
  }, []);

  const loadWarehouses = useCallback(async () => {
    try {
      const res = await api.get<any>('/warehouses');
      setWarehouses(Array.isArray(res) ? res : res?.data || []);
    } catch {}
  }, []);

  useEffect(() => { loadBranches(); loadWarehouses(); }, [loadBranches, loadWarehouses]);

  const loadRegisters = async (branchId: string) => {
    try {
      const res = await api.get<any>('/pos/registers');
      const all = Array.isArray(res) ? res : res?.data || [];
      setRegisters(all.filter((r: any) => r.location_id === branchId));
    } catch { setRegisters([]); }
  };

  const handleExpand = (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    loadRegisters(id);
  };

  const openCreate = () => {
    setEditBranch(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (b: Branch) => {
    setEditBranch(b);
    setForm({
      name: b.name, code: b.code, branch_type: b.branch_type || 'permanent',
      city: b.city || '', governorate: b.governorate || '',
      address_line1: b.address_line1 || '', manager_name: b.manager_name || '',
      phone: b.phone || '+20', warehouse_id: b.warehouse_id || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editBranch) {
        await api.put(`/branches/${editBranch.id}`, form);
      } else {
        await api.post('/branches', form);
      }
      setShowModal(false);
      loadBranches();
    } catch (e: any) { alert(e.message || 'Failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.delete(`/branches/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      loadBranches();
    } catch (e: any) { alert(e.message || 'Failed'); }
    setDeleting(false);
  };

  const typeConfig: Record<string, { label: string; color: 'emerald' | 'blue' | 'amber' | 'purple' | 'orange'; icon: string }> = {
    permanent: { label: 'POS Branch', color: 'emerald', icon: '🏪' },
    retail: { label: 'POS Branch', color: 'emerald', icon: '🏪' },
    warehouse: { label: 'Warehouse', color: 'blue', icon: '📦' },
    exhibition: { label: 'Exhibition', color: 'amber', icon: '🎪' },
    showroom: { label: 'Showroom', color: 'purple', icon: '🏬' },
    popup: { label: 'Pop-up', color: 'orange', icon: '⛺' },
  };

  const filtered = branches.filter((b) => {
    const matchSearch = `${b.name} ${b.code} ${b.city || ''} ${b.branch_type}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || b.branch_type === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: branches.length,
    permanent: branches.filter(b => b.branch_type === 'permanent' || b.branch_type === 'retail').length,
    exhibitions: branches.filter(b => b.branch_type === 'exhibition').length,
    active: branches.filter(b => b.is_active).length,
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={t('branches.title') || 'Sales Channels & Branches'}
        subtitle={t('branches.subtitle') || 'Manage all physical locations, exhibitions, and sales channels'}
        icon={<Building2 className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            <button onClick={loadBranches} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition">
              <RefreshCw className="h-4 w-4" />
            </button>
            <BtnPrimary onClick={openCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> {t('branches.add') || 'Add Branch'}
            </BtnPrimary>
          </div>
        }
      />

      {/* Channel Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ChannelCard icon={<Store className="h-6 w-6" />} title="POS Branches" desc="Physical stores with POS" count={stats.permanent} color="emerald" onClick={() => setFilter('permanent')} />
        <ChannelCard icon={<Tent className="h-6 w-6" />} title="Exhibitions" desc="Events & pop-up fairs" count={stats.exhibitions} color="amber" onClick={() => setFilter('exhibition')} />
        <ChannelCard icon={<MessageCircle className="h-6 w-6" />} title="WhatsApp" desc="Order intake via chat" color="green" href="/whatsapp" />
        <ChannelCard icon={<Globe className="h-6 w-6" />} title="E-commerce" desc="Online store" color="blue" comingSoon />
      </div>

      {/* Central Control */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 flex-shrink-0">
          <Shield className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">Back Office Central Control</p>
          <p className="text-xs text-gray-600">Promotions, inventory, purchasing, and reports managed here. POS terminals only handle sales & returns.</p>
        </div>
      </div>

      {/* Stats */}
      <StatCardGrid cols={4}>
        <StatCard label="Total Branches" value={stats.total} icon={<Building2 className="h-5 w-5" />} color="emerald" />
        <StatCard label="POS Branches" value={stats.permanent} icon={<Store className="h-5 w-5" />} color="blue" />
        <StatCard label="Exhibitions" value={stats.exhibitions} icon={<Tent className="h-5 w-5" />} color="amber" />
        <StatCard label="Active" value={stats.active} icon={<Users className="h-5 w-5" />} color="teal" />
      </StatCardGrid>

      {/* Search + Filters */}
      <SearchFilter
        search={search} onSearchChange={setSearch}
        placeholder={t('branches.search') || 'Search branches...'}
        filters={
          <FilterTabs
            tabs={[
              { key: 'all', label: 'All', count: branches.length },
              { key: 'permanent', label: '🏪 POS', count: stats.permanent },
              { key: 'exhibition', label: '🎪 Exhibition', count: stats.exhibitions },
            ]}
            active={filter} onChange={setFilter}
          />
        }
      />

      {/* Table */}
      <Table>
        <Thead>
          <tr>
            <Th className="w-10" />
            <Th>Branch</Th>
            <Th>Code</Th>
            <Th>Location</Th>
            <Th>Type</Th>
            <Th>Manager</Th>
            <Th align="center">Registers</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </tr>
        </Thead>
        <tbody>
          {loading ? <TableSkeleton rows={4} cols={9} /> : filtered.length === 0 ? (
            <tr>
              <td colSpan={9}>
                <EmptyState icon={<Store className="h-7 w-7" />} title="No branches found"
                  description={search ? 'Try adjusting your search' : 'Create your first branch to get started'}
                  action={!search ? <BtnPrimary onClick={openCreate} className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add Branch</BtnPrimary> : undefined}
                />
              </td>
            </tr>
          ) : (
            filtered.map((b) => {
              const tc = typeConfig[b.branch_type] || typeConfig.permanent;
              return (
                <tbody key={b.id}>
                  <Tr onClick={() => handleExpand(b.id)}>
                    <Td>
                      <div className="text-gray-400">
                        {expanded === b.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl text-lg',
                          tc.color === 'emerald' ? 'bg-emerald-100' : tc.color === 'amber' ? 'bg-amber-100' : tc.color === 'blue' ? 'bg-blue-100' : 'bg-purple-100'
                        )}>
                          {tc.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{b.name}</p>
                          {b.warehouse_name && <p className="text-xs text-gray-400">📦 {b.warehouse_name}</p>}
                        </div>
                      </div>
                    </Td>
                    <Td><span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{b.code}</span></Td>
                    <Td>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm">{b.city || b.governorate || '—'}</span>
                      </div>
                    </Td>
                    <Td><Badge color={tc.color}>{tc.label}</Badge></Td>
                    <Td>
                      {b.manager_name ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                            {b.manager_name.charAt(0)}
                          </div>
                          <span className="text-sm text-gray-700">{b.manager_name}</span>
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </Td>
                    <Td align="center">
                      <div className="flex items-center justify-center gap-1">
                        <Monitor className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm font-medium">{b.register_count || 0}</span>
                        {Number(b.open_sessions) > 0 && (
                          <span className="ml-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Active session" />
                        )}
                      </div>
                    </Td>
                    <Td>
                      <Badge color={b.is_active ? 'emerald' : 'gray'} dot>
                        {b.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={(e) => { e.stopPropagation(); openEdit(b); }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(b); }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                  {expanded === b.id && (
                    <tr>
                      <td colSpan={9} className="bg-gray-50/50 px-6 py-4 border-b">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                              <Monitor className="h-4 w-4 text-emerald-600" /> POS Registers
                            </h4>
                          </div>
                          {b.phone && (
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {b.phone}</span>
                              {b.address_line1 && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {b.address_line1}</span>}
                            </div>
                          )}
                          {registers.length === 0 ? (
                            <p className="text-sm text-gray-400 py-3 text-center">No registers assigned to this branch</p>
                          ) : (
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                              {registers.map((reg) => (
                                <div key={reg.id} className="rounded-xl border bg-white p-3 shadow-sm">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-semibold text-gray-900">{reg.name}</p>
                                    <Badge color={reg.status === 'open' ? 'emerald' : 'gray'} dot>{reg.status}</Badge>
                                  </div>
                                  <p className="text-xs text-gray-400 font-mono">{reg.code}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })
          )}
        </tbody>
      </Table>

      {/* Create/Edit Modal */}
      <BloomModal open={showModal} onClose={() => setShowModal(false)}
        title={editBranch ? 'Edit Branch' : 'Create New Branch'}
        subtitle={editBranch ? `Editing ${editBranch.name}` : 'Add a new sales location'}
        footer={<><BtnSecondary onClick={() => setShowModal(false)}>Cancel</BtnSecondary><BtnPrimary onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editBranch ? 'Save Changes' : 'Create Branch'}</BtnPrimary></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Branch Name" value={form.name} onChange={(v) => setForm({...form, name: v})} placeholder="Heliopolis Showroom" />
            <FormField label="Code" value={form.code} onChange={(v) => setForm({...form, code: v})} placeholder="BR-001" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select value={form.branch_type} onChange={(e) => setForm({...form, branch_type: e.target.value})}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                <option value="permanent">🏪 POS Branch</option>
                <option value="warehouse">📦 Warehouse</option>
                <option value="showroom">🏬 Showroom</option>
                <option value="exhibition">🎪 Exhibition</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Warehouse</label>
              <select value={form.warehouse_id} onChange={(e) => setForm({...form, warehouse_id: e.target.value})}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                <option value="">Select warehouse...</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          {form.branch_type === 'exhibition' && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              🎪 Exhibition branches are temporary pop-up locations for events and fairs.
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="City" value={form.city} onChange={(v) => setForm({...form, city: v})} placeholder="Cairo" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Governorate</label>
              <select value={form.governorate} onChange={(e) => setForm({...form, governorate: e.target.value})}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                <option value="">Select...</option>
                {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <FormField label="Address" value={form.address_line1} onChange={(v) => setForm({...form, address_line1: v})} placeholder="Full address..." />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Manager Name" value={form.manager_name} onChange={(v) => setForm({...form, manager_name: v})} placeholder="Ahmed" />
            <FormField label="Phone" value={form.phone} onChange={(v) => setForm({...form, phone: v})} placeholder="+20 1XX XXX XXXX" />
          </div>
        </div>
      </BloomModal>

      {/* Delete Confirm */}
      <BloomModal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Branch" size="sm"
        footer={<><BtnSecondary onClick={() => setDeleteConfirm(null)}>Cancel</BtnSecondary><BtnDanger onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</BtnDanger></>}
      >
        <div className="text-center py-4">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
            <Trash2 className="h-7 w-7 text-red-600" />
          </div>
          <p className="text-gray-600">
            Delete <strong>{deleteConfirm?.name}</strong>? This will remove the branch and all associated data.
          </p>
        </div>
      </BloomModal>
    </div>
  );
}

function ChannelCard({ icon, title, desc, count, color, onClick, href, comingSoon }: any) {
  const colorMap: Record<string, string> = {
    emerald: 'border-emerald-100 from-emerald-50 hover:border-emerald-200',
    amber: 'border-amber-100 from-amber-50 hover:border-amber-200',
    green: 'border-green-100 from-green-50 hover:border-green-200',
    blue: 'border-blue-100 from-blue-50 hover:border-blue-200',
  };
  const iconBg: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
  };
  const Wrapper = href ? 'a' : 'div';
  const wrapperProps = href ? { href } : {};
  return (
    <Wrapper {...wrapperProps} onClick={onClick}
      className={cn('rounded-2xl border-2 bg-gradient-to-br to-white p-5 transition-all cursor-pointer hover:shadow-md',
        colorMap[color], comingSoon && 'opacity-60 cursor-default'
      )}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('rounded-xl p-2.5', iconBg[color])}>{icon}</div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          <p className="text-xs text-gray-500">{desc}</p>
        </div>
      </div>
      {comingSoon ? (
        <Badge color="blue">Coming Soon</Badge>
      ) : count !== undefined ? (
        <p className="text-2xl font-bold text-gray-900">{count}</p>
      ) : (
        <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
          Manage <ArrowRight className="h-3.5 w-3.5" />
        </span>
      )}
    </Wrapper>
  );
}

function FormField({ label, value, onChange, placeholder, type = 'text' }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
    </div>
  );
}
