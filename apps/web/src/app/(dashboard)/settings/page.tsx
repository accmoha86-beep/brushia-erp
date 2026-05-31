'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Building2, Users, MapPin, Receipt, Plug, Save, Check, Shield, X, Eye, EyeOff, Loader2, Wifi, WifiOff, TestTube, Trash2, ExternalLink, ChevronRight, AlertCircle } from 'lucide-react';

const tabs = [
  { id: 'company', label: 'Company Info', icon: Building2 },
  { id: 'users', label: 'Users & Roles', icon: Users },
  { id: 'branches', label: 'Branches', icon: MapPin },
  { id: 'tax', label: 'Tax Settings', icon: Receipt },
  { id: 'integrations', label: 'Integrations', icon: Plug },
];

// Integration config field definitions
const INTEGRATION_FIELDS: Record<string, { key: string; label: string; type: string; placeholder: string; help?: string; required?: boolean }[]> = {
  bosta_shipping: [
    { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter your Bosta API key', help: 'Get this from app.bosta.co → Settings → API Keys', required: true },
    { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', placeholder: 'Optional — for verifying Bosta webhooks', help: 'Used to verify webhook signatures from Bosta' },
    { key: 'default_pickup_address', label: 'Default Pickup Address', type: 'text', placeholder: 'e.g. 12 Tahrir St, Cairo', help: 'Your warehouse/store address for pickups' },
  ],
  whatsapp_business: [
    { key: 'phone_number_id', label: 'Phone Number ID', type: 'text', placeholder: 'e.g. 123456789012345', help: 'From Meta Developer Dashboard → WhatsApp → Getting Started', required: true },
    { key: 'business_account_id', label: 'Business Account ID', type: 'text', placeholder: 'e.g. 123456789012345', help: 'From Meta Developer Dashboard → WhatsApp → Getting Started', required: true },
    { key: 'api_token', label: 'Permanent API Token', type: 'password', placeholder: 'EAAxxxxxxx...', help: 'System User token with whatsapp_business_messaging permission', required: true },
    { key: 'verify_token', label: 'Webhook Verify Token', type: 'text', placeholder: 'my-verify-token-123', help: 'You set this when configuring the webhook URL in Meta Dashboard' },
  ],
  vodafone_cash: [
    { key: 'merchant_code', label: 'Merchant Code', type: 'text', placeholder: 'Your Vodafone Cash merchant code', help: 'Provided by Vodafone when you register as a merchant', required: true },
    { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter Vodafone Cash API key', help: 'From Vodafone Cash merchant portal' },
    { key: 'pin', label: 'Merchant PIN', type: 'password', placeholder: '••••••', help: 'Your merchant PIN for transaction authorization' },
    { key: 'wallet_number', label: 'Wallet Number', type: 'text', placeholder: '01xxxxxxxxx', help: 'Your Vodafone Cash wallet number' },
  ],
  instapay: [
    { key: 'ipa_address', label: 'IPA Address', type: 'text', placeholder: 'username@instapay', help: 'Your InstaPay address (IPA) for receiving payments', required: true },
    { key: 'bank_name', label: 'Bank Name', type: 'text', placeholder: 'e.g. CIB, NBE, QNB', help: 'The bank linked to your InstaPay account' },
    { key: 'account_holder', label: 'Account Holder Name', type: 'text', placeholder: 'Brushia for Cosmetics', help: 'Name shown to customers when paying' },
    { key: 'notification_phone', label: 'Notification Phone', type: 'text', placeholder: '+201xxxxxxxxx', help: 'Receive SMS notifications for incoming payments' },
  ],
  meta_pixel: [
    { key: 'pixel_id', label: 'Pixel ID', type: 'text', placeholder: 'e.g. 123456789012345', help: 'From Meta Events Manager → Data Sources', required: true },
    { key: 'access_token', label: 'Conversions API Token', type: 'password', placeholder: 'EAAxxxxxxx...', help: 'For server-side event tracking (optional but recommended)' },
  ],
  google_analytics: [
    { key: 'measurement_id', label: 'Measurement ID', type: 'text', placeholder: 'G-XXXXXXXXXX', help: 'From Google Analytics → Admin → Data Streams', required: true },
    { key: 'api_secret', label: 'API Secret', type: 'password', placeholder: 'For Measurement Protocol', help: 'From GA4 → Admin → Data Streams → Measurement Protocol' },
  ],
};

const INTEGRATION_ICONS: Record<string, string> = {
  bosta_shipping: '📦',
  whatsapp_business: '💬',
  vodafone_cash: '📱',
  instapay: '🏦',
  meta_pixel: '📊',
  google_analytics: '📈',
};

const INTEGRATION_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  bosta_shipping: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  whatsapp_business: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  vodafone_cash: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  instapay: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  meta_pixel: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
  google_analytics: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
};

interface Integration {
  id: string;
  integration_key: string;
  display_name: string;
  description: string;
  status: string;
  is_active: boolean;
  has_config: boolean;
  last_tested_at: string | null;
  test_result: string | null;
  configured_at: string | null;
  config?: Record<string, any>;
}

export default function SettingsPage() {
  const { t, locale, isRTL } = useI18n();
  const [activeTab, setActiveTab] = useState('company');
  const [saved, setSaved] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({ name: 'Brushia', legal_name: 'Brushia for Cosmetics', email: 'info@brushia.net', phone: '+201000000000', tax_id: '', commercial_reg: '', city: 'Cairo', governorate: 'Cairo', currency: 'EGP', vat_rate: 14 });
  const [taxSettings, setTaxSettings] = useState({ vat_rate: 14, tax_inclusive: true, fiscal_year_start: 'January' });

  // Integration state
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ result: string; message: string } | null>(null);
  const [error, setError] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Load integrations
  useEffect(() => {
    if (activeTab === 'integrations') {
      loadIntegrations();
    }
  }, [activeTab]);

  const loadIntegrations = async () => {
    try {
      const res = await api('/settings/integrations');
      setIntegrations(res.data || []);
    } catch {
      // If endpoint doesn't exist yet, show defaults
      setIntegrations([]);
    }
  };

  const openConfig = async (key: string) => {
    setSelectedIntegration(key);
    setError('');
    setTestResult(null);
    setConfigForm({});
    setShowPasswords({});
    setLoadingDetail(true);

    try {
      const detail = await api(`/settings/integrations/${key}`);
      if (detail?.config && typeof detail.config === 'object') {
        const formValues: Record<string, string> = {};
        for (const [k, v] of Object.entries(detail.config as Record<string, any>)) {
          formValues[k] = typeof v === 'string' ? v : '';
        }
        setConfigForm(formValues);
      }
    } catch { /* new integration, no config yet */ }
    setLoadingDetail(false);
  };

  const closeConfig = () => {
    setSelectedIntegration(null);
    setConfigForm({});
    setError('');
    setTestResult(null);
  };

  const handleSaveIntegration = async () => {
    if (!selectedIntegration) return;
    setSaving(true);
    setError('');
    setTestResult(null);

    try {
      // Remove empty optional fields, keep all required
      const fields = INTEGRATION_FIELDS[selectedIntegration] || [];
      const cleanConfig: Record<string, string> = {};
      for (const field of fields) {
        const val = configForm[field.key]?.trim() || '';
        if (val && !val.includes('••••')) {
          cleanConfig[field.key] = val;
        } else if (field.required && !val) {
          setError(`${field.label} is required`);
          setSaving(false);
          return;
        }
      }

      await api(`/settings/integrations/${selectedIntegration}`, {
        method: 'PUT',
        body: JSON.stringify({ config: cleanConfig }),
      });

      await loadIntegrations();
      closeConfig();
    } catch (err: any) {
      setError(err?.message || 'Failed to save configuration');
    }
    setSaving(false);
  };

  const handleTestIntegration = async () => {
    if (!selectedIntegration) return;
    setTesting(true);
    setTestResult(null);

    try {
      const result = await api(`/settings/integrations/${selectedIntegration}/test`, { method: 'POST' });
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ result: 'failed', message: err?.message || 'Test failed' });
    }
    setTesting(false);
  };

  const handleDisconnect = async () => {
    if (!selectedIntegration) return;
    if (!confirm('Disconnect this integration? API keys will be removed.')) return;
    setDisconnecting(true);

    try {
      await api(`/settings/integrations/${selectedIntegration}`, { method: 'DELETE' });
      await loadIntegrations();
      closeConfig();
    } catch (err: any) {
      setError(err?.message || 'Failed to disconnect');
    }
    setDisconnecting(false);
  };

  const handleSaveCompany = async () => {
    try {
      await api('/settings/company', { method: 'PUT', body: JSON.stringify(companyInfo) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleSaveTax = async () => {
    try {
      await api('/settings/tax', { method: 'PUT', body: JSON.stringify(taxSettings) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const selectedFields = selectedIntegration ? (INTEGRATION_FIELDS[selectedIntegration] || []) : [];
  const selectedColor = selectedIntegration ? INTEGRATION_COLORS[selectedIntegration] : null;
  const selectedInt = integrations.find(i => i.integration_key === selectedIntegration);

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

          {/* ═══ COMPANY INFO ═══ */}
          {activeTab === 'company' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Company Information</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'name', label: 'Company Name' }, { key: 'legal_name', label: 'Legal Name' },
                  { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' },
                  { key: 'tax_id', label: 'Tax ID' }, { key: 'commercial_reg', label: 'Commercial Registration' },
                  { key: 'city', label: 'City' }, { key: 'governorate', label: 'Governorate' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-gray-500">{f.label}</label>
                    <input value={(companyInfo as any)[f.key]} onChange={e => setCompanyInfo({...companyInfo, [f.key]: e.target.value})} className="w-full mt-1 rounded-lg border px-3 py-2 text-sm" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500">Currency</label><input value={companyInfo.currency} disabled className="w-full mt-1 rounded-lg border px-3 py-2 text-sm bg-gray-50" /></div>
                <div><label className="text-xs text-gray-500">VAT Rate (%)</label><input type="number" value={companyInfo.vat_rate} onChange={e => setCompanyInfo({...companyInfo, vat_rate: +e.target.value})} className="w-full mt-1 rounded-lg border px-3 py-2 text-sm" /></div>
              </div>
              <button onClick={handleSaveCompany} className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600">
                {saved ? <><Check className="h-4 w-4" />Saved!</> : <><Save className="h-4 w-4" />Save Changes</>}
              </button>
            </div>
          )}

          {/* ═══ USERS & ROLES ═══ */}
          {activeTab === 'users' && (
            <div><h2 className="text-lg font-semibold mb-4">Users & Roles</h2>
              <p className="text-sm text-gray-500 mb-4">Manage users from the <a href="/users" className="text-rose-600 font-medium hover:underline">Users & Roles</a> page.</p>
              <div className="space-y-3">
                {[{ name: 'Mohamed Admin', email: 'admin@brushia.net', role: 'Admin', status: 'active' },
                  { name: 'Noha Adel', email: 'noha@brushia.com', role: 'Manager', status: 'active' },
                  { name: 'Ahmed Hassan', email: 'ahmed@brushia.com', role: 'Warehouse', status: 'active' },
                  { name: 'Sara Ali', email: 'sara@brushia.com', role: 'Sales', status: 'active' }].map((u, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">{u.name[0]}</div><div><p className="text-sm font-medium">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div></div>
                    <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">{u.role}</span><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs">{u.status}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ BRANCHES ═══ */}
          {activeTab === 'branches' && (
            <div><h2 className="text-lg font-semibold mb-4">Sales Channels & Branches</h2>
              <p className="text-sm text-gray-500 mb-4">Back Office controls all sales channels — POS branches, exhibitions, WhatsApp, and e-commerce.</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { icon: '🏪', title: 'POS Branches', desc: 'Physical store locations with POS registers', href: '/branches', color: 'rose' },
                  { icon: '🎪', title: 'Exhibitions', desc: 'Temporary branches — pop-up events & fairs', href: '/exhibitions', color: 'purple' },
                  { icon: '💬', title: 'WhatsApp', desc: 'Order intake via WhatsApp conversations', href: '/whatsapp', color: 'emerald' },
                  { icon: '🌐', title: 'E-commerce', desc: 'Online store (coming soon)', href: '#', color: 'blue' },
                ].map((ch, i) => (
                  <div key={i} className={`rounded-xl border-2 border-${ch.color}-200 bg-${ch.color}-50 p-4`}>
                    <div className="flex items-center gap-2 mb-2"><span className="text-2xl">{ch.icon}</span><h3 className="font-semibold">{ch.title}</h3></div>
                    <p className="text-xs text-gray-600 mb-3">{ch.desc}</p>
                    {ch.href !== '#' ? (
                      <a href={ch.href} className={`text-sm font-medium text-${ch.color}-600 hover:text-${ch.color}-700 flex items-center gap-1`}>Manage <ChevronRight className="h-3 w-3" /></a>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">Coming Soon</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="rounded-lg border bg-gray-50 p-4 text-center">
                <Shield className="h-8 w-8 text-rose-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Back Office Central Control</p>
                <p className="text-xs text-gray-500">Promotions, inventory transfers, purchasing, and reports are managed here. POS terminals only handle sales and returns.</p>
              </div>
            </div>
          )}

          {/* ═══ TAX SETTINGS ═══ */}
          {activeTab === 'tax' && (
            <div><h2 className="text-lg font-semibold mb-4">Tax Settings</h2>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <label className="text-xs text-gray-500 mb-1 block">VAT Rate (%)</label>
                  <div className="flex items-center gap-3">
                    <input type="number" value={taxSettings.vat_rate} onChange={e => setTaxSettings({...taxSettings, vat_rate: +e.target.value})} className="w-24 rounded-lg border px-3 py-2 text-lg font-bold text-rose-600" />
                    <span className="text-sm text-gray-500">Egyptian Value Added Tax</span>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div><p className="font-medium">Tax Inclusive Pricing</p><p className="text-xs text-gray-500">All product prices include VAT</p></div>
                    <button onClick={() => setTaxSettings({...taxSettings, tax_inclusive: !taxSettings.tax_inclusive})} className={cn('px-3 py-1 rounded-full text-xs font-medium', taxSettings.tax_inclusive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600')}>
                      {taxSettings.tax_inclusive ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <label className="text-xs text-gray-500 mb-1 block">Fiscal Year Start</label>
                  <select value={taxSettings.fiscal_year_start} onChange={e => setTaxSettings({...taxSettings, fiscal_year_start: e.target.value})} className="rounded-lg border px-3 py-2 text-sm">
                    {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleSaveTax} className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600">
                  {saved ? <><Check className="h-4 w-4" />Saved!</> : <><Save className="h-4 w-4" />Save Changes</>}
                </button>
              </div>
            </div>
          )}

          {/* ═══ INTEGRATIONS ═══ */}
          {activeTab === 'integrations' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Integrations</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Connect external services — shipping, payments, analytics</p>
                </div>
              </div>

              {/* Integration Cards */}
              <div className="space-y-3">
                {integrations.length === 0 ? (
                  // Fallback static cards if API not ready
                  ['bosta_shipping', 'whatsapp_business', 'vodafone_cash', 'instapay'].map(key => (
                    <button key={key} onClick={() => openConfig(key)} className="w-full flex items-center justify-between rounded-lg border p-4 hover:border-rose-200 hover:bg-rose-50/50 transition-all text-left group">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{INTEGRATION_ICONS[key]}</span>
                        <div>
                          <p className="text-sm font-semibold group-hover:text-rose-700 transition-colors">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                          <p className="text-xs text-gray-400">Click to configure</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">pending</span>
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-rose-400" />
                      </div>
                    </button>
                  ))
                ) : (
                  integrations.map(int => {
                    const colors = INTEGRATION_COLORS[int.integration_key] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
                    return (
                      <button key={int.id} onClick={() => openConfig(int.integration_key)} className="w-full flex items-center justify-between rounded-lg border p-4 hover:border-rose-200 hover:bg-rose-50/50 transition-all text-left group">
                        <div className="flex items-center gap-3">
                          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg text-lg', colors.bg)}>
                            {INTEGRATION_ICONS[int.integration_key] || '🔌'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold group-hover:text-rose-700 transition-colors">{int.display_name}</p>
                            <p className="text-xs text-gray-400">{int.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {int.status === 'configured' ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                              <Wifi className="h-3 w-3" />connected
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">pending</span>
                          )}
                          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-rose-400" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ CONFIG MODAL ═══ */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={closeConfig}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={cn('flex items-center justify-between p-5 border-b', selectedColor?.bg || 'bg-gray-50')}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{INTEGRATION_ICONS[selectedIntegration] || '🔌'}</span>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedInt?.display_name || selectedIntegration.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                  <p className="text-xs text-gray-500">{selectedInt?.description || 'Configure integration'}</p>
                </div>
              </div>
              <button onClick={closeConfig} className="rounded-lg p-1 hover:bg-white/50 transition-colors"><X className="h-5 w-5 text-gray-500" /></button>
            </div>

            {/* Status Banner */}
            {selectedInt?.status === 'configured' && (
              <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                <Wifi className="h-4 w-4 text-emerald-600" />
                <span className="text-xs text-emerald-700 font-medium">Connected</span>
                {selectedInt.configured_at && (
                  <span className="text-xs text-emerald-500 ml-auto">since {new Date(selectedInt.configured_at).toLocaleDateString()}</span>
                )}
              </div>
            )}

            {/* Config Fields */}
            <div className="p-5 space-y-4">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-rose-400" /></div>
              ) : (
                selectedFields.map(field => (
                  <div key={field.key}>
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                        value={configForm[field.key] || ''}
                        onChange={e => setConfigForm({...configForm, [field.key]: e.target.value})}
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-none pr-10"
                      />
                      {field.type === 'password' && (
                        <button
                          type="button"
                          onClick={() => setShowPasswords({...showPasswords, [field.key]: !showPasswords[field.key]})}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                    {field.help && <p className="text-xs text-gray-400 mt-1">{field.help}</p>}
                  </div>
                ))
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-red-700">{error}</span>
                </div>
              )}

              {/* Test Result */}
              {testResult && (
                <div className={cn('flex items-center gap-2 rounded-lg border px-3 py-2', testResult.result === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200')}>
                  {testResult.result === 'success' ? <Check className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                  <span className={cn('text-xs font-medium', testResult.result === 'success' ? 'text-emerald-700' : 'text-red-700')}>{testResult.message}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between p-5 border-t bg-gray-50 rounded-b-2xl">
              <div>
                {selectedInt?.status === 'configured' && (
                  <button onClick={handleDisconnect} disabled={disconnecting} className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50">
                    {disconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    Disconnect
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedInt?.status === 'configured' && (
                  <button onClick={handleTestIntegration} disabled={testing} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50">
                    {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <TestTube className="h-3 w-3" />}
                    Test Connection
                  </button>
                )}
                <button onClick={closeConfig} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100">{t('common.cancel')}</button>
                <button onClick={handleSaveIntegration} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-rose-500 px-4 py-2 text-xs font-medium text-white hover:bg-rose-600 disabled:opacity-50">
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  {selectedInt?.status === 'configured' ? 'Update' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
