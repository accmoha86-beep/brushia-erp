'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api-client';
import { formatEGP, cn } from '@/lib/utils';
import { exportToCSV } from '@/lib/export-data';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard, StatCardGrid } from '@/components/ui/stat-card';
import { SearchFilter, FilterTabs } from '@/components/ui/search-filter';
import { BloomModal, BtnPrimary, BtnSecondary } from '@/components/ui/bloom-modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState, TableSkeleton } from '@/components/ui/empty-state';
import { Table, Thead, Th, Td, Tr } from '@/components/ui/table';
import { Users, Plus, RefreshCw, Download, Star, Phone, Crown, Eye, Mail, MapPin, ShoppingBag, X } from 'lucide-react';

interface Customer {
  id: string; customer_number: string; first_name: string; last_name: string;
  full_name?: string; name?: string; email: string; phone: string; whatsapp?: string;
  customer_type: string; company_name?: string; city: string; governorate?: string;
  loyalty_points: number; loyalty_tier: string; total_orders: number;
  total_spent: number; is_active: boolean; created_at: string;
}

const tierConfig: Record<string, { color: 'orange' | 'gray' | 'amber' | 'purple'; icon: string }> = {
  bronze:   { color: 'orange', icon: '🥉' },
  silver:   { color: 'gray',   icon: '🥈' },
  gold:     { color: 'amber',  icon: '🥇' },
  platinum: { color: 'purple', icon: '👑' },
};

const emptyForm = { first_name: '', last_name: '', email: '', phone: '+20', customer_type: 'retail', city: '', company_name: '' };

export default function CustomersPage() {
  const { t } = useI18n();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/customers', { limit: 200 });
      setCustomers(Array.isArray(res) ? res : res?.data || []);
    } catch { setCustomers([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.post('/customers', form);
      setShowCreate(false); setForm({ ...emptyForm }); fetchCustomers();
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  const filtered = customers.filter(c => {
    const name = c.full_name || c.name || `${c.first_name} ${c.last_name}`;
    const matchSearch = `${name} ${c.customer_number} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || c.customer_type === filterType;
    return matchSearch && matchType;
  });

  const totalRevenue = customers.reduce((s, c) => s + Number(c.total_spent || 0), 0);
  const wholesaleCount = customers.filter(c => c.customer_type === 'wholesale').length;
  const vipCount = customers.filter(c => c.loyalty_tier === 'gold' || c.loyalty_tier === 'platinum').length;

  const exportData = () => {
    exportToCSV(filtered.map(c => ({
      '#': c.customer_number, Name: c.full_name || `${c.first_name} ${c.last_name}`,
      Email: c.email, Phone: c.phone, Type: c.customer_type, City: c.city,
      Tier: c.loyalty_tier, Points: c.loyalty_points, Orders: c.total_orders,
      'Total Spent': Number(c.total_spent || 0).toFixed(2),
    })), 'customers');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={t('customers.title') || 'Customers'}
        subtitle={t('customers.subtitle') || 'Manage retail and wholesale customer relationships'}
        icon={<Users className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            <button onClick={exportData} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition"><Download className="h-4 w-4" /></button>
            <button onClick={fetchCustomers} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition"><RefreshCw className="h-4 w-4" /></button>
            <BtnPrimary onClick={() => setShowCreate(true)} className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add Customer</BtnPrimary>
          </div>
        }
      />

      <StatCardGrid cols={4}>
        <StatCard label="Total Customers" value={customers.length} icon={<Users className="h-5 w-5" />} color="emerald" />
        <StatCard label="Wholesale" value={wholesaleCount} icon={<ShoppingBag className="h-5 w-5" />} color="blue" />
        <StatCard label="VIP (Gold+)" value={vipCount} icon={<Crown className="h-5 w-5" />} color="amber" />
        <StatCard label="Total Revenue" value={formatEGP(totalRevenue)} icon={<Star className="h-5 w-5" />} color="teal" />
      </StatCardGrid>

      <SearchFilter
        search={search} onSearchChange={setSearch}
        placeholder="Search by name, phone, or email..."
        filters={
          <FilterTabs
            tabs={[
              { key: 'all', label: 'All', count: customers.length },
              { key: 'retail', label: '🛍️ Retail' },
              { key: 'wholesale', label: '📦 Wholesale', count: wholesaleCount },
            ]}
            active={filterType} onChange={setFilterType}
          />
        }
      />

      <Table>
        <Thead>
          <tr>
            <Th>Customer</Th>
            <Th>Contact</Th>
            <Th>Type</Th>
            <Th>Tier</Th>
            <Th align="right">Orders</Th>
            <Th align="right">Total Spent</Th>
            <Th align="right">Points</Th>
            <Th align="right">Actions</Th>
          </tr>
        </Thead>
        <tbody>
          {loading ? <TableSkeleton rows={5} cols={8} /> : filtered.length === 0 ? (
            <tr><td colSpan={8}>
              <EmptyState icon={<Users className="h-7 w-7" />} title="No customers found"
                description={search ? 'Try a different search' : 'Customers will appear after first sale'}
                action={!search ? <BtnPrimary onClick={() => setShowCreate(true)} className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add Customer</BtnPrimary> : undefined}
              />
            </td></tr>
          ) : (
            filtered.map((c) => {
              const name = c.full_name || c.name || `${c.first_name} ${c.last_name}`;
              const tc = tierConfig[c.loyalty_tier] || tierConfig.bronze;
              return (
                <Tr key={c.id} onClick={() => setSelectedCustomer(c)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-sm font-bold text-emerald-700">
                        {(c.first_name || '?')[0]}{(c.last_name || '?')[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{name}</p>
                        <p className="text-xs text-gray-400">{c.customer_number}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="space-y-0.5">
                      <p className="text-sm text-gray-700 flex items-center gap-1"><Phone className="h-3 w-3 text-gray-400" /> {c.phone || '—'}</p>
                      <p className="text-xs text-gray-400">{c.email || '—'}</p>
                    </div>
                  </Td>
                  <Td><Badge color={c.customer_type === 'wholesale' ? 'blue' : 'gray'}>{c.customer_type}</Badge></Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5">
                      <span>{tc.icon}</span>
                      <Badge color={tc.color}>{c.loyalty_tier || 'bronze'}</Badge>
                    </span>
                  </Td>
                  <Td align="right"><span className="font-medium text-gray-900">{c.total_orders || 0}</span></Td>
                  <Td align="right"><span className="font-semibold text-gray-900">{formatEGP(Number(c.total_spent || 0))}</span></Td>
                  <Td align="right"><span className="text-sm text-amber-600 font-medium">{Number(c.loyalty_points || 0).toLocaleString()} ⭐</span></Td>
                  <Td align="right">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedCustomer(c); }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition">
                      <Eye className="h-4 w-4" />
                    </button>
                  </Td>
                </Tr>
              );
            })
          )}
        </tbody>
      </Table>

      {/* Customer Detail */}
      <BloomModal open={!!selectedCustomer} onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer ? (selectedCustomer.full_name || `${selectedCustomer.first_name} ${selectedCustomer.last_name}`) : ''}
        subtitle={selectedCustomer?.customer_number} size="md"
      >
        {selectedCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Type" value={selectedCustomer.customer_type} />
              <InfoCard label="Tier" value={`${(tierConfig[selectedCustomer.loyalty_tier] || tierConfig.bronze).icon} ${selectedCustomer.loyalty_tier || 'bronze'}`} />
              <InfoCard label="Orders" value={String(selectedCustomer.total_orders || 0)} />
              <InfoCard label="Total Spent" value={formatEGP(Number(selectedCustomer.total_spent || 0))} />
              <InfoCard label="Points" value={`${Number(selectedCustomer.loyalty_points || 0).toLocaleString()} ⭐`} />
              <InfoCard label="City" value={selectedCustomer.city || '—'} />
            </div>
            <div className="rounded-xl bg-gray-50 p-4 space-y-2">
              {selectedCustomer.phone && <p className="text-sm flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /> {selectedCustomer.phone}</p>}
              {selectedCustomer.email && <p className="text-sm flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" /> {selectedCustomer.email}</p>}
              {selectedCustomer.city && <p className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" /> {selectedCustomer.city}{selectedCustomer.governorate ? `, ${selectedCustomer.governorate}` : ''}</p>}
            </div>
          </div>
        )}
      </BloomModal>

      {/* Create Modal */}
      <BloomModal open={showCreate} onClose={() => setShowCreate(false)} title="Add New Customer" subtitle="Create a new customer record"
        footer={<><BtnSecondary onClick={() => setShowCreate(false)}>Cancel</BtnSecondary><BtnPrimary onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Create'}</BtnPrimary></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" value={form.first_name} onChange={(v: string) => setForm({...form, first_name: v})} placeholder="Sara" />
            <FormField label="Last Name" value={form.last_name} onChange={(v: string) => setForm({...form, last_name: v})} placeholder="Ahmed" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" value={form.email} onChange={(v: string) => setForm({...form, email: v})} placeholder="sara@email.com" />
            <FormField label="Phone" value={form.phone} onChange={(v: string) => setForm({...form, phone: v})} placeholder="+201012345678" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select value={form.customer_type} onChange={(e) => setForm({...form, customer_type: e.target.value})}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
              </select>
            </div>
            <FormField label="City" value={form.city} onChange={(v: string) => setForm({...form, city: v})} placeholder="Cairo" />
          </div>
          {form.customer_type === 'wholesale' && (
            <FormField label="Company Name" value={form.company_name} onChange={(v: string) => setForm({...form, company_name: v})} placeholder="Beauty Corp" />
          )}
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
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
