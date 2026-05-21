'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  CalendarDays,
  MapPin,
  Plus,
  X,
  DollarSign,
  TrendingUp,
  Eye,
  Pencil,
  ArrowLeft,
  Receipt,
  BarChart3,
  ShoppingBag,
  Wallet,
  Target,
} from 'lucide-react';

const GOVERNORATES = [
  'Cairo', 'Giza', 'Alexandria', 'Dakahlia', 'Beheira', 'Sharqia', 'Qalyubia',
  'Monufia', 'Gharbia', 'Kafr El Sheikh', 'Damietta', 'Port Said', 'Ismailia',
  'Suez', 'North Sinai', 'South Sinai', 'Beni Suef', 'Fayoum', 'Minya', 'Asyut',
  'Sohag', 'Qena', 'Luxor', 'Aswan', 'Red Sea', 'New Valley', 'Matrouh',
];

interface Exhibition {
  id: string;
  name: string;
  event_code: string;
  venue: string;
  city: string;
  governorate: string;
  start_date: string;
  end_date: string;
  status: 'planning' | 'setup' | 'active' | 'completed' | 'cancelled';
  budget_amount: number;
  actual_cost: number;
  total_sales: number;
  total_orders: number;
  warehouse_id: string;
  notes: string;
}

interface Expense {
  id: string;
  category: 'booth' | 'logistics' | 'staff' | 'marketing' | 'other';
  description: string;
  amount: number;
  created_at: string;
}

interface PnL {
  total_sales: number;
  total_expenses: number;
  net_profit: number;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount / 100);

export default function ExhibitionsPage() {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedExhibition, setSelectedExhibition] = useState<Exhibition | null>(null);
  const [detailTab, setDetailTab] = useState<'expenses' | 'pnl'>('expenses');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pnl, setPnl] = useState<PnL | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'booth' as Expense['category'],
    description: '',
    amount: '',
  });
  const [form, setForm] = useState({
    name: '',
    event_code: '',
    venue: '',
    city: '',
    governorate: '',
    start_date: '',
    end_date: '',
    budget_amount: '',
    warehouse_id: '',
    notes: '',
  });

  useEffect(() => {
    loadExhibitions();
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (!form.event_code && exhibitions.length >= 0) {
      const next = exhibitions.length + 1;
      setForm((f) => ({ ...f, event_code: `EXH-${String(next).padStart(3, '0')}` }));
    }
  }, [exhibitions.length]);

  const loadExhibitions = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.get('/exhibitions', token);
      const data = Array.isArray(res) ? res : res.data || [];
      setExhibitions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouses = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await api.get('/warehouses', token);
      const data = Array.isArray(res) ? res : res.data || [];
      setWarehouses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadExpenses = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await api.get(`/exhibitions/${id}/expenses`, token);
      const data = Array.isArray(res) ? res : res.data || [];
      setExpenses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPnL = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await api.get(`/exhibitions/${id}/pnl`, token);
      setPnl(res.data || res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await api.post('/exhibitions', {
        name: form.name,
        event_code: form.event_code,
        venue: form.venue,
        city: form.city,
        governorate: form.governorate,
        start_date: form.start_date,
        end_date: form.end_date,
        budget_amount: Math.round(parseFloat(form.budget_amount) * 100),
        warehouse_id: form.warehouse_id,
        notes: form.notes,
      }, token);
      setShowModal(false);
      setForm({ name: '', event_code: '', venue: '', city: '', governorate: '', start_date: '', end_date: '', budget_amount: '', warehouse_id: '', notes: '' });
      loadExhibitions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExpense = async () => {
    if (!selectedExhibition) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await api.post(`/exhibitions/${selectedExhibition.id}/expenses`, {
        category: expenseForm.category,
        description: expenseForm.description,
        amount: Math.round(parseFloat(expenseForm.amount) * 100),
      }, token);
      setShowExpenseModal(false);
      setExpenseForm({ category: 'booth', description: '', amount: '' });
      loadExpenses(selectedExhibition.id);
    } catch (err) {
      console.error(err);
    }
  };

  const openDetail = (ex: Exhibition) => {
    setSelectedExhibition(ex);
    setDetailTab('expenses');
    loadExpenses(ex.id);
  };

  const statusColors: Record<string, string> = {
    planning: 'bg-blue-100 text-blue-700',
    setup: 'bg-amber-100 text-amber-700',
    active: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const categoryColors: Record<string, string> = {
    booth: 'bg-blue-100 text-blue-700',
    logistics: 'bg-amber-100 text-amber-700',
    staff: 'bg-purple-100 text-purple-700',
    marketing: 'bg-rose-100 text-rose-700',
    other: 'bg-gray-100 text-gray-700',
  };

  const totalEvents = exhibitions.length;
  const activeNow = exhibitions.filter((e) => e.status === 'active').length;
  const totalRevenue = exhibitions.reduce((s, e) => s + (e.total_sales || 0), 0);
  const totalBudget = exhibitions.reduce((s, e) => s + (e.budget_amount || 0), 0);
  const totalActual = exhibitions.reduce((s, e) => s + (e.actual_cost || 0), 0);
  const budgetUtil = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;

  // Detail view
  if (selectedExhibition) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedExhibition(null)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </button>

        {/* Event Header */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{selectedExhibition.name}</h1>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[selectedExhibition.status])}>
                  {selectedExhibition.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-mono">{selectedExhibition.event_code}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-sm">
              <span className="text-gray-500">Venue</span>
              <p className="font-medium text-gray-900">{selectedExhibition.venue}</p>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Location</span>
              <p className="font-medium text-gray-900">{selectedExhibition.city}, {selectedExhibition.governorate}</p>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Dates</span>
              <p className="font-medium text-gray-900">
                {new Date(selectedExhibition.start_date).toLocaleDateString('en-EG')} → {new Date(selectedExhibition.end_date).toLocaleDateString('en-EG')}
              </p>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Budget</span>
              <p className="font-medium text-gray-900">{fmt(selectedExhibition.budget_amount)}</p>
            </div>
          </div>
        </div>

        {/* Detail Tabs */}
        <div className="border-b">
          <nav className="flex gap-4">
            <button
              onClick={() => { setDetailTab('expenses'); loadExpenses(selectedExhibition.id); }}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium',
                detailTab === 'expenses' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Receipt className="h-4 w-4" />
              Expenses
            </button>
            <button
              onClick={() => { setDetailTab('pnl'); loadPnL(selectedExhibition.id); }}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium',
                detailTab === 'pnl' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <BarChart3 className="h-4 w-4" />
              P&L
            </button>
          </nav>
        </div>

        {detailTab === 'expenses' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowExpenseModal(true)}
                className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
              >
                <Plus className="h-4 w-4" />
                Add Expense
              </button>
            </div>
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-500">
                        <Receipt className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                        No expenses recorded yet.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{new Date(exp.created_at).toLocaleDateString('en-EG')}</td>
                        <td className="px-4 py-3">
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', categoryColors[exp.category])}>
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{exp.description}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{fmt(exp.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {detailTab === 'pnl' && pnl && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-50 p-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Sales</p>
                  <p className="text-2xl font-bold text-emerald-600">{fmt(pnl.total_sales)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-50 p-2">
                  <Wallet className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">{fmt(pnl.total_expenses)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={cn('rounded-lg p-2', pnl.net_profit >= 0 ? 'bg-emerald-50' : 'bg-red-50')}>
                  <BarChart3 className={cn('h-5 w-5', pnl.net_profit >= 0 ? 'text-emerald-600' : 'text-red-600')} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{pnl.net_profit >= 0 ? 'Net Profit' : 'Net Loss'}</p>
                  <p className={cn('text-2xl font-bold', pnl.net_profit >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                    {fmt(Math.abs(pnl.net_profit))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Modal */}
        {showExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Add Expense</h2>
                <button onClick={() => setShowExpenseModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="booth">Booth</option>
                    <option value="logistics">Logistics</option>
                    <option value="staff">Staff</option>
                    <option value="marketing">Marketing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (EGP)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowExpenseModal(false)}
                    className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddExpense}
                    className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
                  >
                    Add Expense
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exhibitions & Events</h1>
          <p className="text-sm text-gray-500">Manage exhibition events, expenses, and sales</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
        >
          <Plus className="h-4 w-4" />
          New Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rose-50 p-2">
              <CalendarDays className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{totalEvents}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2">
              <Target className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Now</p>
              <p className="text-2xl font-bold text-gray-900">{activeNow}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2">
              <Wallet className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Budget Utilization</p>
              <p className="text-2xl font-bold text-gray-900">{budgetUtil}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Event Cards */}
      {exhibitions.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
          <CalendarDays className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">No exhibitions yet. Create your first event to start tracking.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exhibitions.map((ex) => {
            const budgetPct = ex.budget_amount > 0 ? Math.min(Math.round((ex.actual_cost / ex.budget_amount) * 100), 100) : 0;
            return (
              <div key={ex.id} className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{ex.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">{ex.event_code}</p>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[ex.status])}>
                    {ex.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-3.5 w-3.5" />
                    {ex.venue}, {ex.city}, {ex.governorate}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(ex.start_date).toLocaleDateString('en-EG')} → {new Date(ex.end_date).toLocaleDateString('en-EG')}
                  </div>
                </div>

                {/* Budget bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Budget: {fmt(ex.budget_amount)}</span>
                    <span className="text-gray-500">Actual: {fmt(ex.actual_cost || 0)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className={cn(
                        'h-2 rounded-full',
                        budgetPct > 90 ? 'bg-red-500' : budgetPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      )}
                      style={{ width: `${budgetPct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-500">Sales: </span>
                    <span className="font-medium text-gray-900">{fmt(ex.total_sales || 0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Orders: </span>
                    <span className="font-medium text-gray-900">{ex.total_orders || 0}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => openDetail(ex)}
                    className="flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100"
                  >
                    <Eye className="h-3 w-3" />
                    View Details
                  </button>
                  <button className="flex items-center gap-1 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100">
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">New Exhibition Event</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Cairo Beauty Expo 2026"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Code</label>
                  <input
                    type="text"
                    value={form.event_code}
                    onChange={(e) => setForm({ ...form, event_code: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                <input
                  type="text"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  placeholder="Cairo International Convention Center"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Nasr City"
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget Amount (EGP)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.budget_amount}
                    onChange={(e) => setForm({ ...form, budget_amount: e.target.value })}
                    placeholder="50000"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                  <select
                    value={form.warehouse_id}
                    onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="">Select warehouse...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
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
                  Create Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
