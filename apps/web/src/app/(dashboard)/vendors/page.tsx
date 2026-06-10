'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  Building2, Plus, RefreshCw, Phone, Mail, Globe2, Package,
  Pencil, Trash2, Eye, Clock, MapPin, MessageCircle, X,
} from 'lucide-react';

interface Vendor {
  id: string; vendor_number: string; name: string; name_ar?: string;
  contact_person: string; email: string; phone: string; whatsapp?: string;
  country: string; city: string; address?: string; payment_terms: string;
  lead_time_days: number; is_active: boolean; po_count: number; created_at: string;
}

const countryInfo: Record<string, { flag: string; label: string }> = {
  CN: { flag: '🇨🇳', label: 'China' }, EG: { flag: '🇪🇬', label: 'Egypt' },
  TR: { flag: '🇹🇷', label: 'Turkey' }, US: { flag: '🇺🇸', label: 'USA' },
  KR: { flag: '🇰🇷', label: 'South Korea' }, JP: { flag: '🇯🇵', label: 'Japan' }, IN: { flag: '🇮🇳', label: 'India' },
};

const emptyForm = { name: '', name_ar: '', contact_person: '', email: '', phone: '', whatsapp: '', country: 'CN', city: '', address: '', payment_terms: 'Net 30', lead_time_days: 21 };

export default function VendorsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [viewVendor, setViewVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Vendor | null>(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/purchasing/vendors');
      setVendors(Array.isArray(res) ? res : res?.data || []);
    } catch { setVendors([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const openCreate = () => { setEditVendor(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit = (v: Vendor) => {
    setEditVendor(v);
    setForm({ name: v.name, name_ar: v.name_ar || '', contact_person: v.contact_person, email: v.email, phone: v.phone, whatsapp: v.whatsapp || '', country: v.country, city: v.city, address: v.address || '', payment_terms: v.payment_terms, lead_time_days: v.lead_time_days });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editVendor) await api.put(`/purchasing/vendors/${editVendor.id}`, form);
      else await api.post('/purchasing/vendors', form);
      setShowModal(false); fetchVendors();
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try { await api.delete(`/purchasing/vendors/${deleteConfirm.id}`); setDeleteConfirm(null); fetchVendors(); }
    catch (e: any) { alert(e.message); }
  };

  const countries = [...new Set(vendors.map(v => v.country))];
  const filtered = vendors.filter(v => {
    const matchSearch = `${v.name} ${v.vendor_number} ${v.contact_person} ${v.city}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || v.country === filter;
    return matchSearch && matchFilter;
  });

  const totalPOs = vendors.reduce((s, v) => s + (v.po_count || 0), 0);
  const avgLead = vendors.length > 0 ? Math.round(vendors.reduce((s, v) => s + v.lead_time_days, 0) / vendors.length) : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={t('vendors.title') || 'Vendors'}
        subtitle={t('vendors.subtitle') || 'Manage suppliers and purchasing relationships'}
        icon={<Building2 className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            <button onClick={fetchVendors} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition"><RefreshCw className="h-4 w-4" /></button>
            <BtnPrimary onClick={openCreate} className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add Vendor</BtnPrimary>
          </div>
        }
      />

      <StatCardGrid cols={4}>
        <StatCard label="Total Vendors" value={vendors.length} icon={<Building2 className="h-5 w-5" />} color="emerald" />
        <StatCard label="Active" value={vendors.filter(v => v.is_active).length} icon={<Globe2 className="h-5 w-5" />} color="blue" />
        <StatCard label="Total POs" value={totalPOs} icon={<Package className="h-5 w-5" />} color="amber" />
        <StatCard label="Avg Lead Time" value={`${avgLead} days`} icon={<Clock className="h-5 w-5" />} color="purple" />
      </StatCardGrid>

      <SearchFilter
        search={search} onSearchChange={setSearch}
        placeholder="Search vendors..."
        filters={
          <FilterTabs
            tabs={[
              { key: 'all', label: 'All', count: vendors.length },
              ...countries.map(c => ({ key: c, label: `${(countryInfo[c] || {}).flag || '🌍'} ${(countryInfo[c] || {}).label || c}` })),
            ]}
            active={filter} onChange={setFilter}
          />
        }
      />

      <Table>
        <Thead>
          <tr>
            <Th>Vendor</Th>
            <Th>Contact</Th>
            <Th>Country</Th>
            <Th>Payment Terms</Th>
            <Th align="center">Lead Time</Th>
            <Th align="center">POs</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </tr>
        </Thead>
        <tbody>
          {loading ? <TableSkeleton rows={4} cols={8} /> : filtered.length === 0 ? (
            <tr><td colSpan={8}>
              <EmptyState icon={<Building2 className="h-7 w-7" />} title="No vendors found"
                action={<BtnPrimary onClick={openCreate} className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add Vendor</BtnPrimary>}
              />
            </td></tr>
          ) : (
            filtered.map((v) => {
              const ci = countryInfo[v.country] || { flag: '🌍', label: v.country };
              return (
                <Tr key={v.id} onClick={() => router.push(`/vendors/${v.id}`)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-lg">
                        {ci.flag}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{v.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{v.vendor_number}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div>
                      <p className="text-sm text-gray-700">{v.contact_person || '—'}</p>
                      <p className="text-xs text-gray-400">{v.email || '—'}</p>
                    </div>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span>{ci.flag}</span> {ci.label}
                    </span>
                  </Td>
                  <Td><Badge color="blue">{v.payment_terms}</Badge></Td>
                  <Td align="center"><span className="text-sm font-medium">{v.lead_time_days}d</span></Td>
                  <Td align="center"><span className="font-semibold text-gray-900">{v.po_count || 0}</span></Td>
                  <Td><Badge color={v.is_active ? 'emerald' : 'gray'} dot>{v.is_active ? 'Active' : 'Inactive'}</Badge></Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={(e) => { e.stopPropagation(); router.push(`/vendors/${v.id}`); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition"><Eye className="h-3.5 w-3.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); openEdit(v); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(v); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </Td>
                </Tr>
              );
            })
          )}
        </tbody>
      </Table>

      {/* View Detail */}
      <BloomModal open={!!viewVendor} onClose={() => setViewVendor(null)} title={viewVendor?.name || ''} subtitle={viewVendor?.vendor_number} size="md">
        {viewVendor && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Country" value={`${(countryInfo[viewVendor.country] || {}).flag || '🌍'} ${(countryInfo[viewVendor.country] || {}).label || viewVendor.country}`} />
              <InfoCard label="City" value={viewVendor.city || '—'} />
              <InfoCard label="Payment Terms" value={viewVendor.payment_terms} />
              <InfoCard label="Lead Time" value={`${viewVendor.lead_time_days} days`} />
              <InfoCard label="Purchase Orders" value={String(viewVendor.po_count || 0)} />
              <InfoCard label="Status" value={viewVendor.is_active ? '✅ Active' : '⏸️ Inactive'} />
            </div>
            <div className="rounded-xl bg-gray-50 p-4 space-y-2">
              <p className="text-sm font-medium text-gray-900">Contact: {viewVendor.contact_person || '—'}</p>
              {viewVendor.phone && <p className="text-sm text-gray-600 flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /> {viewVendor.phone}</p>}
              {viewVendor.email && <p className="text-sm text-gray-600 flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" /> {viewVendor.email}</p>}
              {viewVendor.whatsapp && <p className="text-sm text-gray-600 flex items-center gap-2"><MessageCircle className="h-4 w-4 text-green-500" /> {viewVendor.whatsapp}</p>}
            </div>
          </div>
        )}
      </BloomModal>

      {/* Create/Edit Modal */}
      <BloomModal open={showModal} onClose={() => setShowModal(false)} title={editVendor ? 'Edit Vendor' : 'Add New Vendor'}
        footer={<><BtnSecondary onClick={() => setShowModal(false)}>Cancel</BtnSecondary><BtnPrimary onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</BtnPrimary></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Name (English)" value={form.name} onChange={(v: string) => setForm({...form, name: v})} placeholder="Vendor name" />
            <FormField label="Name (Arabic)" value={form.name_ar} onChange={(v: string) => setForm({...form, name_ar: v})} placeholder="اسم المورد" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Contact Person" value={form.contact_person} onChange={(v: string) => setForm({...form, contact_person: v})} placeholder="John" />
            <FormField label="Email" value={form.email} onChange={(v: string) => setForm({...form, email: v})} placeholder="john@vendor.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Phone" value={form.phone} onChange={(v: string) => setForm({...form, phone: v})} placeholder="+86..." />
            <FormField label="WhatsApp" value={form.whatsapp} onChange={(v: string) => setForm({...form, whatsapp: v})} placeholder="+86..." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
              <select value={form.country} onChange={(e) => setForm({...form, country: e.target.value})} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                {Object.entries(countryInfo).map(([code, info]) => <option key={code} value={code}>{info.flag} {info.label}</option>)}
              </select>
            </div>
            <FormField label="City" value={form.city} onChange={(v: string) => setForm({...form, city: v})} placeholder="Guangzhou" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Terms</label>
              <select value={form.payment_terms} onChange={(e) => setForm({...form, payment_terms: e.target.value})} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                {['Net 7','Net 15','Net 30','Net 45','Net 60'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <FormField label="Lead Time (days)" value={form.lead_time_days} onChange={(v: string) => setForm({...form, lead_time_days: Number(v) || 0})} placeholder="21" type="number" />
        </div>
      </BloomModal>

      {/* Delete */}
      <BloomModal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Vendor" size="sm"
        footer={<><BtnSecondary onClick={() => setDeleteConfirm(null)}>Cancel</BtnSecondary><BtnDanger onClick={handleDelete}>Delete</BtnDanger></>}
      >
        <div className="text-center py-4">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100"><Trash2 className="h-7 w-7 text-red-600" /></div>
          <p className="text-gray-600">Delete <strong>{deleteConfirm?.name}</strong>?</p>
        </div>
      </BloomModal>
    </div>
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500 mb-0.5">{label}</p><p className="text-sm font-semibold text-gray-900">{value}</p></div>;
}
