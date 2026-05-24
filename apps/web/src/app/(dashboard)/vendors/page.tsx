'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  Search, Plus, RefreshCw, Phone, Mail, X, Building2, Clock, MapPin,
  Edit3, Trash2, ChevronRight, Globe2, Package, FileText, ArrowLeft,
  MessageCircle, DollarSign, ShoppingCart, User, AlertTriangle, Check
} from 'lucide-react';

interface Vendor {
  id: string;
  vendor_number: string;
  name: string;
  name_ar?: string;
  contact_person: string;
  email: string;
  phone: string;
  whatsapp?: string;
  country: string;
  city: string;
  address?: string;
  payment_terms: string;
  lead_time_days: number;
  is_active: boolean;
  po_count: number;
  created_at: string;
}

const countryInfo: Record<string, { flag: string; label: string }> = {
  CN: { flag: '🇨🇳', label: 'China' },
  EG: { flag: '🇪🇬', label: 'Egypt' },
  TR: { flag: '🇹🇷', label: 'Turkey' },
  US: { flag: '🇺🇸', label: 'USA' },
  KR: { flag: '🇰🇷', label: 'South Korea' },
  JP: { flag: '🇯🇵', label: 'Japan' },
  IN: { flag: '🇮🇳', label: 'India' },
};

const paymentTermsLabels: Record<string, string> = {
  'Net 7': 'Net 7',
  'Net 15': 'Net 15',
  'Net 30': 'Net 30',
  'Net 45': 'Net 45',
  'Net 60': 'Net 60',
  'net_7': 'Net 7',
  'net_15': 'Net 15',
  'net_30': 'Net 30',
  'net_45': 'Net 45',
  'net_60': 'Net 60',
  'tt_advance': 'TT Advance',
  'cod': 'COD',
  'lc': 'Letter of Credit',
};

const emptyForm = {
  name: '', name_ar: '', contact_person: '', email: '', phone: '', whatsapp: '',
  country: 'CN', city: '', address: '', payment_terms: 'Net 30', lead_time_days: 21
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/purchasing/vendors');
      setVendors(Array.isArray(res) ? res : (res?.data || []));
    } catch { setVendors([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  useEffect(() => {
    if (successMsg) { const t = setTimeout(() => setSuccessMsg(''), 3000); return () => clearTimeout(t); }
  }, [successMsg]);

  const filtered = vendors.filter(v => {
    if (!search) return true;
    const s = search.toLowerCase();
    return v.name.toLowerCase().includes(s) || v.vendor_number.toLowerCase().includes(s) ||
      (v.contact_person || '').toLowerCase().includes(s) || (v.city || '').toLowerCase().includes(s);
  });

  const openCreate = () => {
    setEditingVendor(null);
    setForm({ ...emptyForm });
    setError('');
    setShowModal(true);
  };

  const openEdit = (v: Vendor) => {
    setEditingVendor(v);
    setForm({
      name: v.name || '', name_ar: v.name_ar || '', contact_person: v.contact_person || '',
      email: v.email || '', phone: v.phone || '', whatsapp: v.whatsapp || '',
      country: v.country || 'CN', city: v.city || '', address: v.address || '',
      payment_terms: v.payment_terms || 'Net 30', lead_time_days: v.lead_time_days || 21
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Vendor name is required'); return; }
    setSaving(true);
    setError('');
    try {
      if (editingVendor) {
        await api.put(`/purchasing/vendors/${editingVendor.id}`, form);
        setSuccessMsg('Vendor updated successfully');
      } else {
        await api.post('/purchasing/vendors', form);
        setSuccessMsg('Vendor created successfully');
      }
      setShowModal(false);
      fetchVendors();
    } catch (e: any) {
      setError(e.message || 'Failed to save vendor');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await api.delete(`/purchasing/vendors/${id}`);
      setDeleteConfirm(null);
      setSuccessMsg('Vendor deleted');
      if (selectedVendor?.id === id) setSelectedVendor(null);
      fetchVendors();
    } catch (e: any) {
      alert(e.message || 'Cannot delete vendor');
    } finally { setDeleting(false); }
  };

  const stats = {
    total: vendors.length,
    active: vendors.filter(v => v.is_active).length,
    china: vendors.filter(v => v.country === 'CN').length,
    egypt: vendors.filter(v => v.country === 'EG').length,
  };

  // ══════════════════════════════════════════
  // VENDOR DETAIL VIEW
  // ══════════════════════════════════════════
  if (selectedVendor) {
    const v = selectedVendor;
    const ci = countryInfo[v.country] || { flag: '🌍', label: v.country };
    return (
      <div className="p-6 max-w-5xl mx-auto">
        {/* Back + Actions */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setSelectedVendor(null)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-5 w-5" /> Back to Vendors
          </button>
          <div className="flex gap-2">
            <button onClick={() => openEdit(v)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Edit3 className="h-4 w-4" /> Edit
            </button>
            <button onClick={() => setDeleteConfirm(v.id)}
              className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>

        {/* Header Card */}
        <div className="rounded-2xl bg-white border p-6 mb-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-3xl shadow-lg">
              {ci.flag}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{v.name}</h1>
                {v.name_ar && <span className="text-lg text-gray-400">{v.name_ar}</span>}
                <span className={cn('px-3 py-1 rounded-full text-xs font-semibold',
                  v.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                  {v.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-gray-500 mt-1">{v.vendor_number} · {v.contact_person || 'No contact person'}</p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Contact Information */}
          <div className="rounded-2xl bg-white border p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-rose-500" /> Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-gray-700">{v.email || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-gray-700">{v.phone || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">WhatsApp</p>
                  <p className="text-gray-700">{v.whatsapp || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Location</p>
                  <p className="text-gray-700">{v.city ? `${v.city}, ` : ''}{ci.label}</p>
                </div>
              </div>
              {v.address && (
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Address</p>
                    <p className="text-gray-700">{v.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Business Details */}
          <div className="rounded-2xl bg-white border p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-rose-500" /> Business Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Lead Time</p>
                  <p className="text-gray-700 font-medium">{v.lead_time_days} days</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-indigo-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Payment Terms</p>
                  <p className="text-gray-700 font-medium">{paymentTermsLabels[v.payment_terms] || v.payment_terms || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-rose-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Purchase Orders</p>
                  <p className="text-gray-700 font-medium">{v.po_count || 0} orders</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                  <Globe2 className="h-4 w-4 text-teal-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Country</p>
                  <p className="text-gray-700 font-medium">{ci.flag} {ci.label}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-2xl bg-white border p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Activity</h3>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            Vendor created {new Date(v.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Delete Vendor?</h3>
                  <p className="text-sm text-gray-500">This cannot be undone</p>
                </div>
              </div>
              {v.po_count > 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3 mb-4">
                  ⚠️ This vendor has {v.po_count} purchase order(s). It cannot be deleted while orders exist.
                </p>
              )}
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting}
                  className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════
  // VENDOR LIST VIEW
  // ══════════════════════════════════════════
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Success Toast */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-white text-sm font-medium shadow-lg animate-in slide-in-from-top">
          <Check className="h-4 w-4" /> {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">Manage suppliers from China, Egypt & more</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchVendors} className="p-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-600 shadow-sm transition-colors">
            <Plus className="h-4 w-4" /> Add Vendor
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Vendors', value: stats.total, icon: Building2, color: 'rose' },
          { label: 'Active', value: stats.active, icon: Check, color: 'emerald' },
          { label: 'China Suppliers', value: stats.china, icon: Globe2, color: 'red' },
          { label: 'Egypt Suppliers', value: stats.egypt, icon: Globe2, color: 'blue' },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-white border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center',
                s.color === 'rose' && 'bg-rose-50', s.color === 'emerald' && 'bg-emerald-50',
                s.color === 'red' && 'bg-red-50', s.color === 'blue' && 'bg-blue-50')}>
                <s.icon className={cn('h-5 w-5',
                  s.color === 'rose' && 'text-rose-500', s.color === 'emerald' && 'text-emerald-500',
                  s.color === 'red' && 'text-red-500', s.color === 'blue' && 'text-blue-500')} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text" placeholder="Search vendors by name, code, contact, or city..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
        />
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-56 rounded-2xl bg-gray-100 animate-pulse" />
        )) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 font-medium">{search ? 'No vendors match your search' : 'No vendors yet'}</p>
            <button onClick={openCreate} className="mt-3 text-sm text-rose-500 hover:text-rose-600 font-medium">
              + Add your first vendor
            </button>
          </div>
        ) : filtered.map(v => {
          const ci = countryInfo[v.country] || { flag: '🌍', label: v.country };
          return (
            <div key={v.id}
              onClick={() => setSelectedVendor(v)}
              className="group relative rounded-2xl border bg-white p-5 hover:shadow-lg hover:border-rose-200 transition-all cursor-pointer">
              {/* Edit/Delete actions */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); openEdit(v); }}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(v.id); }}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-xl shadow-md flex-shrink-0">
                  {ci.flag}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{v.name}</h3>
                  <p className="text-xs text-gray-400">{v.contact_person || 'No contact person'}</p>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                  <span className="truncate">{v.city ? `${v.city}, ` : ''}{ci.label}</span>
                </div>
                {v.email && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{v.email}</span>
                  </div>
                )}
                {v.phone && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                    <span>{v.phone}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {v.lead_time_days} days lead time
                  </span>
                  <span>{paymentTermsLabels[v.payment_terms] || v.payment_terms}</span>
                </div>
                <div className="flex items-center gap-2">
                  {v.po_count > 0 && (
                    <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-medium">
                      {v.po_count} PO{v.po_count > 1 ? 's' : ''}
                    </span>
                  )}
                  <span className={cn('w-2 h-2 rounded-full', v.is_active ? 'bg-emerald-400' : 'bg-gray-300')} />
                </div>
              </div>

              {/* Arrow indicator */}
              <ChevronRight className="absolute right-3 bottom-5 h-4 w-4 text-gray-300 group-hover:text-rose-400 transition-colors" />
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Vendor?</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting}
                className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-900">
                {editingVendor ? 'Edit Vendor' : 'New Vendor'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
            )}

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Vendor Name *</label>
                <input
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Guangzhou Beauty Co."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>

              {/* Arabic Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Arabic Name</label>
                <input
                  value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })}
                  placeholder="الاسم بالعربي" dir="rtl"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>

              {/* Contact Person */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Contact Person</label>
                <input
                  value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })}
                  placeholder="e.g. Wang Li"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                  <input
                    type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
                  <input
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+8613800138000"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">WhatsApp</label>
                <input
                  value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="+8613800138000"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>

              {/* Country + City */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Country</label>
                  <select value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400">
                    <option value="CN">🇨🇳 China</option>
                    <option value="EG">🇪🇬 Egypt</option>
                    <option value="TR">🇹🇷 Turkey</option>
                    <option value="US">🇺🇸 USA</option>
                    <option value="KR">🇰🇷 South Korea</option>
                    <option value="JP">🇯🇵 Japan</option>
                    <option value="IN">🇮🇳 India</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">City</label>
                  <input
                    value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Guangzhou"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Address</label>
                <textarea
                  value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Full address (optional)" rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>

              {/* Payment Terms + Lead Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Payment Terms</label>
                  <select value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400">
                    <option value="Net 7">Net 7</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="TT Advance">TT Advance</option>
                    <option value="COD">Cash on Delivery</option>
                    <option value="LC">Letter of Credit</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Lead Time (days)</label>
                  <input
                    type="number" value={form.lead_time_days}
                    onChange={e => setForm({ ...form, lead_time_days: +e.target.value })}
                    min={1} max={365}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 rounded-lg bg-rose-500 py-2.5 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50 shadow-sm">
                {saving ? 'Saving...' : (editingVendor ? 'Update Vendor' : 'Create Vendor')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
