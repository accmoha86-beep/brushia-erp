'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  Heart,
  Star,
  Gift,
  TrendingUp,
  Users,
  Plus,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  BarChart3,
} from 'lucide-react';

interface LoyaltyTier {
  id: string;
  name: string;
  min_points: number;
  multiplier: number;
  color: string;
  benefits: string[] | string;
  member_count: number;
}

interface LoyaltyTransaction {
  id: string;
  date: string;
  customer_name: string;
  type: 'earn' | 'redeem';
  points: number;
  balance_after: number;
  reason: string;
  order_id: string;
}

interface LoyaltyStats {
  total_members: number;
  total_points_earned: number;
  total_points_redeemed: number;
  active_rate: number;
  tier_breakdown: { tier: string; count: number; color: string }[];
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount / 100);

export default function LoyaltyPage() {
  const [tab, setTab] = useState<'tiers' | 'transactions' | 'stats'>('tiers');
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [txFilter, setTxFilter] = useState<'all' | 'earn' | 'redeem'>('all');
  const [form, setForm] = useState({
    name: '',
    min_points: '',
    multiplier: '',
    color: 'amber',
    benefits: '',
  });

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/loyalty/tiers');
      const data = Array.isArray(res) ? res : res.data || [];
      setTiers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/loyalty/transactions');
      const data = Array.isArray(res) ? res : res.data || [];
      setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/loyalty/stats');
      setStats(res.data || res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (t: typeof tab) => {
    setTab(t);
    if (t === 'transactions') loadTransactions();
    if (t === 'stats') loadStats();
  };

  const handleCreate = async () => {
    try {
      await api.post('/loyalty/tiers', {
        name: form.name,
        min_points: parseInt(form.min_points),
        multiplier: parseFloat(form.multiplier),
        color: form.color,
        benefits: form.benefits.split('\n').filter(Boolean),
      });
      setShowModal(false);
      setForm({ name: '', min_points: '', multiplier: '', color: 'amber', benefits: '' });
      loadTiers();
    } catch (err) {
      console.error(err);
    }
  };

  const tierColorMap: Record<string, { border: string; bg: string; icon: string }> = {
    amber: { border: 'border-l-amber-500', bg: 'bg-amber-50', icon: 'text-amber-600' },
    gray: { border: 'border-l-gray-400', bg: 'bg-gray-50', icon: 'text-gray-500' },
    yellow: { border: 'border-l-yellow-500', bg: 'bg-yellow-50', icon: 'text-yellow-600' },
    purple: { border: 'border-l-purple-500', bg: 'bg-purple-50', icon: 'text-purple-600' },
  };

  const parseBenefits = (b: any): string[] => {
    if (Array.isArray(b)) return b;
    if (typeof b === 'string' && b) return b.split(','). map(s => s.trim()).filter(Boolean);
    return [];
  };
  const totalCustomers = tiers.reduce((s, t) => s + (t.member_count || 0), 0);
  const filteredTx = txFilter === 'all' ? transactions : transactions.filter((t) => t.type === txFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-rose-50 p-2">
            <Heart className="h-6 w-6 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loyalty Program</h1>
            <p className="text-sm text-gray-500">
              {totalCustomers} customers enrolled · Reward your best customers
            </p>
          </div>
        </div>
        {tab === 'tiers' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
          >
            <Plus className="h-4 w-4" />
            Create Tier
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {[
            { key: 'tiers' as const, label: 'Tiers', icon: Award },
            { key: 'transactions' as const, label: 'Transactions', icon: TrendingUp },
            { key: 'stats' as const, label: 'Program Stats', icon: BarChart3 },
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

      {/* Tab: Tiers */}
      {tab === 'tiers' && (
        <div className="space-y-4">
          {tiers.length === 0 ? (
            <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
              <Star className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">No loyalty tiers configured yet. Create your first tier to start the program.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {tiers.map((tier) => {
                const colors = tierColorMap[tier.color] || tierColorMap.amber;
                return (
                  <div
                    key={tier.id}
                    className={cn(
                      'rounded-xl border border-l-4 bg-white p-6 shadow-sm',
                      colors.border
                    )}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn('rounded-lg p-2', colors.bg)}>
                        <Star className={cn('h-5 w-5', colors.icon)} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{tier.name}</h3>
                        <p className="text-xs text-gray-500">{tier.min_points.toLocaleString()} min points</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Multiplier</span>
                        <span className="font-bold text-gray-900">{tier.multiplier}x</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Members</span>
                        <span className="font-medium text-gray-900">{tier.member_count || 0}</span>
                      </div>
                      {parseBenefits(tier.benefits).length > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-xs font-medium text-gray-600 mb-1">Benefits</p>
                          <ul className="space-y-1">
                            {parseBenefits(tier.benefits).map((b, i) => (
                              <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Gift className="h-3 w-3 text-rose-400" />
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Transactions */}
      {tab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {(['all', 'earn', 'redeem'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTxFilter(f)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  txFilter === f
                    ? 'bg-rose-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {f === 'all' ? 'All' : f === 'earn' ? 'Earned' : 'Redeemed'}
              </button>
            ))}
          </div>
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Points</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Balance After</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Order</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTx.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                      <TrendingUp className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredTx.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(tx.date).toLocaleDateString('en-EG')}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{tx.customer_name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            tx.type === 'earn' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          )}
                        >
                          {tx.type === 'earn' ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {tx.type === 'earn' ? '+' : '-'}{tx.points.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">{tx.balance_after.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{tx.reason}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{tx.order_id || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Stats */}
      {tab === 'stats' && (
        <div className="space-y-6">
          {stats ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-rose-50 p-2">
                      <Users className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Members</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total_members?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-50 p-2">
                      <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Points Earned</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total_points_earned?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-50 p-2">
                      <ArrowDownRight className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Points Redeemed</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total_points_redeemed?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Active Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.active_rate}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tier Breakdown */}
              {stats.tier_breakdown && stats.tier_breakdown.length > 0 && (
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">Tier Breakdown</h3>
                  <div className="space-y-3">
                    {stats.tier_breakdown.map((tb) => {
                      const pct = stats.total_members > 0 ? (tb.count / stats.total_members) * 100 : 0;
                      return (
                        <div key={tb.tier}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">{tb.tier}</span>
                            <span className="text-gray-500">{tb.count} members ({pct.toFixed(1)}%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-100">
                            <div
                              className={cn('h-2 rounded-full', `bg-${tb.color || 'rose'}-500`)}
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
              <BarChart3 className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">Loading program statistics...</p>
            </div>
          )}
        </div>
      )}

      {/* Create Tier Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Create Loyalty Tier</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Gold"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Points</label>
                  <input
                    type="number"
                    value={form.min_points}
                    onChange={(e) => setForm({ ...form, min_points: e.target.value })}
                    placeholder="0"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.multiplier}
                    onChange={(e) => setForm({ ...form, multiplier: e.target.value })}
                    placeholder="1.0"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <select
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="amber">Bronze / Amber</option>
                    <option value="gray">Silver / Gray</option>
                    <option value="yellow">Gold / Yellow</option>
                    <option value="purple">Platinum / Purple</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Benefits (one per line)</label>
                <textarea
                  value={form.benefits}
                  onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                  rows={4}
                  placeholder={"Free shipping\n10% birthday discount\nEarly access to sales"}
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
                  Create Tier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
