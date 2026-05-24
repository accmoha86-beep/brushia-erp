'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  Users,
  DollarSign,
  UserCheck,
  Plus,
  Search,
  X,
  BookOpen,
  BarChart3,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  Banknote,
} from 'lucide-react';

interface Salesperson {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  default_commission_rate: number;
  commission_type: 'percentage' | 'flat' | 'tiered';
  total_sales: number;
  total_commission: number;
  is_active: boolean;
}

interface CommissionRule {
  id: string;
  name: string;
  type: 'percentage' | 'tiered' | 'category';
  rate: number;
  is_active: boolean;
  tiers?: { min: number; max: number; rate: number }[];
}

interface CommissionReport {
  id: string;
  salesperson_name: string;
  order_id: string;
  order_total: number;
  commission_amount: number;
  status: 'pending' | 'approved' | 'paid';
  date: string;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount / 100);

export default function CommissionsPage() {
  const [tab, setTab] = useState<'salespersons' | 'rules' | 'report'>('salespersons');
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [report, setReport] = useState<CommissionReport[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [form, setForm] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    phone: '+20',
    email: '',
    default_commission_rate: '',
    commission_type: 'percentage' as 'percentage' | 'flat' | 'tiered',
  });

  useEffect(() => {
    loadSalespersons();
  }, []);

  const loadSalespersons = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.get('/commissions');
      const data = Array.isArray(res) ? res : res.data || [];
      setSalespersons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.get('/commissions/rules');
      const data = Array.isArray(res) ? res : res.data || [];
      setRules(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!dateFrom || !dateTo) return;
    try {
      setLoading(true);
      const res = await api.get(`/commissions/report?from=${dateFrom}&to=${dateTo}`);
      const data = Array.isArray(res) ? res : res.data || [];
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (t: typeof tab) => {
    setTab(t);
    if (t === 'rules') loadRules();
    if (t === 'report' && dateFrom && dateTo) loadReport();
  };

  const handleCreate = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await api.post('/commissions/salespersons', {
        employee_code: form.employee_code,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        email: form.email,
        default_commission_rate: parseFloat(form.default_commission_rate),
        commission_type: form.commission_type,
      });
      setShowModal(false);
      setForm({ employee_code: '', first_name: '', last_name: '', phone: '+20', email: '', default_commission_rate: '', commission_type: 'percentage' });
      loadSalespersons();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = salespersons.filter(
    (s) =>
      `${s.first_name} ${s.last_name} ${s.employee_code}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalSalespersons = salespersons.length;
  const activeSalespersons = salespersons.filter((s) => s.is_active).length;
  const totalCommission = salespersons.reduce((sum, s) => sum + (s.total_commission || 0), 0);

  const reportSummary = {
    total: report.reduce((s, r) => s + (r.commission_amount || 0), 0),
    pending: report.filter((r) => r.status === 'pending').reduce((s, r) => s + (r.commission_amount || 0), 0),
    approved: report.filter((r) => r.status === 'approved').reduce((s, r) => s + (r.commission_amount || 0), 0),
    paid: report.filter((r) => r.status === 'paid').reduce((s, r) => s + (r.commission_amount || 0), 0),
  };

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = {
      percentage: 'bg-blue-100 text-blue-700',
      flat: 'bg-purple-100 text-purple-700',
      tiered: 'bg-amber-100 text-amber-700',
    };
    return (
      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', colors[type] || 'bg-gray-100 text-gray-700')}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commissions</h1>
          <p className="text-sm text-gray-500">Track salesperson commissions and payouts</p>
        </div>
        {tab === 'salespersons' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
          >
            <Plus className="h-4 w-4" />
            Add Salesperson
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rose-50 p-2">
              <Users className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Salespersons</p>
              <p className="text-2xl font-bold text-gray-900">{totalSalespersons}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Commission Paid</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(totalCommission)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Salespersons</p>
              <p className="text-2xl font-bold text-gray-900">{activeSalespersons}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {[
            { key: 'salespersons' as const, label: 'Salespersons', icon: Users },
            { key: 'rules' as const, label: 'Commission Rules', icon: BookOpen },
            { key: 'report' as const, label: 'Commission Report', icon: BarChart3 },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                tab === key
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Salespersons */}
      {tab === 'salespersons' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search salespersons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border py-2 pl-10 pr-4 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Employee Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Total Sales</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Total Commission</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                      <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                      {search ? 'No salespersons match your search' : 'No salespersons yet. Add your first salesperson to get started.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">{s.employee_code}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.first_name} {s.last_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.phone}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{s.default_commission_rate}%</td>
                      <td className="px-4 py-3">{typeBadge(s.commission_type)}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">{fmt(s.total_sales || 0)}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{fmt(s.total_commission || 0)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Commission Rules */}
      {tab === 'rules' && (
        <div className="space-y-4">
          {rules.length === 0 ? (
            <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
              <BookOpen className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">No commission rules configured yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rules.map((rule) => (
                <div key={rule.id} className="rounded-xl border bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        rule.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Type</span>
                      {typeBadge(rule.type)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Rate</span>
                      <span className="font-medium text-gray-900">{rule.rate}%</span>
                    </div>
                    {rule.type === 'tiered' && rule.tiers && (
                      <div className="mt-3 rounded-lg bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-600 mb-2">Tiers</p>
                        {rule.tiers.map((tier, i) => (
                          <div key={i} className="flex items-center justify-between text-xs text-gray-600 py-0.5">
                            <span>{fmt(tier.min)} – {fmt(tier.max)}</span>
                            <span className="font-medium">{tier.rate}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Commission Report */}
      {tab === 'report' && (
        <div className="space-y-4">
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <button
              onClick={loadReport}
              disabled={!dateFrom || !dateTo}
              className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50"
            >
              Generate Report
            </button>
          </div>

          {report.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                {[
                  { label: 'Total Commissions', value: fmt(reportSummary.total), icon: TrendingUp, color: 'rose' },
                  { label: 'Pending', value: fmt(reportSummary.pending), icon: Clock, color: 'amber' },
                  { label: 'Approved', value: fmt(reportSummary.approved), icon: CheckCircle2, color: 'blue' },
                  { label: 'Paid', value: fmt(reportSummary.paid), icon: Banknote, color: 'emerald' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg bg-${color}-50 p-2`}>
                        <Icon className={`h-5 w-5 text-${color}-600`} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="text-lg font-bold text-gray-900">{value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Salesperson</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Order</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Order Total</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Commission</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {report.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{new Date(r.date).toLocaleDateString('en-EG')}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.salesperson_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{r.order_id}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">{fmt(r.order_total)}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{fmt(r.commission_amount)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              r.status === 'pending' && 'bg-amber-100 text-amber-700',
                              r.status === 'approved' && 'bg-blue-100 text-blue-700',
                              r.status === 'paid' && 'bg-emerald-100 text-emerald-700'
                            )}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {report.length === 0 && dateFrom && dateTo && !loading && (
            <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
              <BarChart3 className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">No commission data found for the selected period.</p>
            </div>
          )}

          {!dateFrom && !dateTo && (
            <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
              <Calendar className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">Select a date range to generate the commission report.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Salesperson Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Add Salesperson</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={form.employee_code}
                    onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
                    placeholder="EMP-001"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Type</label>
                  <select
                    value={form.commission_type}
                    onChange={(e) => setForm({ ...form, commission_type: e.target.value as any })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat</option>
                    <option value="tiered">Tiered</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Commission Rate (%)</label>
                <input
                  type="number"
                  value={form.default_commission_rate}
                  onChange={(e) => setForm({ ...form, default_commission_rate: e.target.value })}
                  placeholder="5"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
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
                  Add Salesperson
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
