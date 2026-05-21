'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Building2, Users, MapPin, Receipt, Plug, Save, Check, RefreshCw, Shield } from 'lucide-react';

const tabs = [
  { id: 'company', label: 'Company Info', icon: Building2 },
  { id: 'users', label: 'Users & Roles', icon: Users },
  { id: 'branches', label: 'Branches', icon: MapPin },
  { id: 'tax', label: 'Tax Settings', icon: Receipt },
  { id: 'integrations', label: 'Integrations', icon: Plug },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');
  const [saved, setSaved] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({ name: 'Brushia', legal_name: 'Brushia for Cosmetics', email: 'info@brushia.net', phone: '+201000000000', tax_id: '', commercial_reg: '', city: 'Cairo', governorate: 'Cairo', currency: 'EGP', vat_rate: 14 });

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Settings</h1><p className="text-sm text-gray-500 mt-1">System configuration</p></div>

      <div className="flex gap-6">
        <div className="w-48 flex-shrink-0 space-y-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn('w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-left transition-colors', activeTab === t.id ? 'bg-rose-50 text-rose-700' : 'text-gray-600 hover:bg-gray-100')}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-xl border p-6">
          {activeTab === 'company' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Company Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500">Company Name</label><input value={companyInfo.name} onChange={e => setCompanyInfo({...companyInfo, name: e.target.value})} className="w-full mt-1 rounded-lg border px-3 py-2 text-sm" /></div>
                <div><label className="text-xs text-gray-500">Legal Name</label><input value={companyInfo.legal_name} onChange={e => setCompanyInfo({...companyInfo, legal_name: e.target.value})} className="w-full mt-1 rounded-lg border px-3 py-2 text-sm" /></div>
                <div><label className="text-xs text-gray-500">Email</label><input value={companyInfo.email} onChange={e => setCompanyInfo({...companyInfo, email: e.target.value})} className="w-full mt-1 rounded-lg border px-3 py-2 text-sm" /></div>
                <div><label className="text-xs text-gray-500">Phone</label><input value={companyInfo.phone} onChange={e => setCompanyInfo({...companyInfo, phone: e.target.value})} className="w-full mt-1 rounded-lg border px-3 py-2 text-sm" /></div>
                <div><label className="text-xs text-gray-500">Tax ID</label><input value={companyInfo.tax_id} onChange={e => setCompanyInfo({...companyInfo, tax_id: e.target.value})} className="w-full mt-1 rounded-lg border px-3 py-2 text-sm" /></div>
                <div><label className="text-xs text-gray-500">Commercial Registration</label><input value={companyInfo.commercial_reg} onChange={e => setCompanyInfo({...companyInfo, commercial_reg: e.target.value})} className="w-full mt-1 rounded-lg border px-3 py-2 text-sm" /></div>
                <div><label className="text-xs text-gray-500">City</label><input value={companyInfo.city} onChange={e => setCompanyInfo({...companyInfo, city: e.target.value})} className="w-full mt-1 rounded-lg border px-3 py-2 text-sm" /></div>
                <div><label className="text-xs text-gray-500">Governorate</label><input value={companyInfo.governorate} onChange={e => setCompanyInfo({...companyInfo, governorate: e.target.value})} className="w-full mt-1 rounded-lg border px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500">Currency</label><input value={companyInfo.currency} disabled className="w-full mt-1 rounded-lg border px-3 py-2 text-sm bg-gray-50" /></div>
                <div><label className="text-xs text-gray-500">VAT Rate (%)</label><input type="number" value={companyInfo.vat_rate} onChange={e => setCompanyInfo({...companyInfo, vat_rate: +e.target.value})} className="w-full mt-1 rounded-lg border px-3 py-2 text-sm" /></div>
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600">
                {saved ? <><Check className="h-4 w-4" />Saved!</> : <><Save className="h-4 w-4" />Save Changes</>}
              </button>
            </div>
          )}

          {activeTab === 'users' && (
            <div><h2 className="text-lg font-semibold mb-4">Users & Roles</h2>
              <div className="space-y-3">
                {[{ name: 'Mohamed Admin', email: 'admin@brushia.net', role: 'Admin', status: 'active' },
                  { name: 'Noha Adel', email: 'noha@brushia.com', role: 'Manager', status: 'active' },
                  { name: 'Ahmed Hassan', email: 'ahmed@brushia.com', role: 'Warehouse', status: 'active' },
                  { name: 'Sara Ali', email: 'sara@brushia.com', role: 'Sales', status: 'active' }].map((u, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">{u.name[0]}</div><div><p className="text-sm font-medium">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div></div>
                    <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">{u.role}</span><span className={cn('px-2 py-0.5 rounded-full text-xs', u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600')}>{u.status}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'branches' && (
            <div><h2 className="text-lg font-semibold mb-4">Branches</h2>
              <div className="space-y-3">
                {[{ name: 'Main Warehouse', city: 'Cairo', type: 'Warehouse' }, { name: 'Showroom', city: 'Cairo', type: 'Showroom' }, { name: 'Returns Center', city: 'Cairo', type: 'Returns' }].map((b, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-rose-500" /><div><p className="text-sm font-medium">{b.name}</p><p className="text-xs text-gray-400">{b.city}</p></div></div>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">{b.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tax' && (
            <div><h2 className="text-lg font-semibold mb-4">Tax Settings</h2>
              <div className="space-y-4">
                <div className="rounded-lg border p-4"><div className="flex items-center justify-between"><div><p className="font-medium">VAT Rate</p><p className="text-xs text-gray-500">Egyptian Value Added Tax</p></div><p className="text-2xl font-bold text-rose-600">14%</p></div></div>
                <div className="rounded-lg border p-4"><div className="flex items-center justify-between"><div><p className="font-medium">Tax Inclusive Pricing</p><p className="text-xs text-gray-500">All product prices include VAT</p></div><div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">Enabled</div></div></div>
                <div className="rounded-lg border p-4"><div className="flex items-center justify-between"><div><p className="font-medium">Fiscal Year Start</p><p className="text-xs text-gray-500">January 1st</p></div><p className="font-medium">January</p></div></div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div><h2 className="text-lg font-semibold mb-4">Integrations</h2>
              <div className="space-y-3">
                {[{ name: 'Bosta Shipping', desc: 'Egyptian delivery service', status: 'configured', color: 'emerald' },
                  { name: 'WhatsApp Business', desc: 'Order via WhatsApp', status: 'pending', color: 'yellow' },
                  { name: 'Vodafone Cash', desc: 'Mobile payment', status: 'pending', color: 'yellow' },
                  { name: 'InstaPay', desc: 'Instant bank transfers', status: 'pending', color: 'yellow' }].map((int, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                    <div><p className="text-sm font-medium">{int.name}</p><p className="text-xs text-gray-400">{int.desc}</p></div>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', int.status === 'configured' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700')}>{int.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
