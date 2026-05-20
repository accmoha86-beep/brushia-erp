'use client';

import { useState } from 'react';

import { formatEGP, formatDate, cn } from '@/lib/utils';
import { Plus, X, Calendar, Percent, CircleDollarSign, Copy } from 'lucide-react';

interface Promotion {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  code: string;
  status: 'active' | 'inactive' | 'expired' | 'scheduled';
  startDate: string;
  endDate: string;
  usageCount: number;
  usageLimit: number | null;
  minOrderAmount: number;
}

const promotions: Promotion[] = [
  { id: '1', name: 'Summer Sale 2026', type: 'percentage', value: 20, code: 'SUMMER20', status: 'active', startDate: '2026-05-01', endDate: '2026-06-30', usageCount: 145, usageLimit: null, minOrderAmount: 20000 },
  { id: '2', name: 'New Customer Welcome', type: 'percentage', value: 15, code: 'WELCOME15', status: 'active', startDate: '2026-01-01', endDate: '2026-12-31', usageCount: 312, usageLimit: null, minOrderAmount: 15000 },
  { id: '3', name: 'Lash Bundle Deal', type: 'fixed', value: 5000, code: 'LASH50', status: 'active', startDate: '2026-05-15', endDate: '2026-05-31', usageCount: 28, usageLimit: 100, minOrderAmount: 30000 },
  { id: '4', name: 'VIP Exclusive', type: 'percentage', value: 25, code: 'VIP25', status: 'active', startDate: '2026-05-01', endDate: '2026-05-31', usageCount: 67, usageLimit: 200, minOrderAmount: 50000 },
  { id: '5', name: 'Ramadan Special', type: 'percentage', value: 30, code: 'RAMADAN30', status: 'expired', startDate: '2026-03-01', endDate: '2026-04-01', usageCount: 890, usageLimit: null, minOrderAmount: 30000 },
  { id: '6', name: 'Brush Set Discount', type: 'fixed', value: 10000, code: 'BRUSHSET', status: 'inactive', startDate: '2026-04-01', endDate: '2026-04-30', usageCount: 45, usageLimit: 50, minOrderAmount: 40000 },
  { id: '7', name: 'Eid Collection Launch', type: 'percentage', value: 10, code: 'EID10', status: 'scheduled', startDate: '2026-06-15', endDate: '2026-06-30', usageCount: 0, usageLimit: 500, minOrderAmount: 25000 },
];

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-600',
  expired: 'bg-red-100 text-red-700',
  scheduled: 'bg-blue-100 text-blue-700',
};

export default function PromotionsPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-sm text-gray-500 mt-1">{promotions.length} promotions · {promotions.filter(p => p.status === 'active').length} active</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:from-rose-600 hover:to-purple-700"
        >
          <Plus className="h-4 w-4" />
          Create Promotion
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{promotions.filter(p => p.status === 'active').length}</p>
          <p className="text-sm text-gray-500">Active</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{promotions.reduce((s, p) => s + p.usageCount, 0).toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Uses</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{promotions.filter(p => p.status === 'scheduled').length}</p>
          <p className="text-sm text-gray-500">Scheduled</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-400">{promotions.filter(p => p.status === 'expired').length}</p>
          <p className="text-sm text-gray-500">Expired</p>
        </div>
      </div>

      {/* Promotions list */}
      <div className="space-y-3">
        {promotions.map((promo) => (
          <div key={promo.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Icon */}
              <div className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl shrink-0',
                promo.type === 'percentage' ? 'bg-purple-100' : 'bg-emerald-100'
              )}>
                {promo.type === 'percentage' ? (
                  <Percent className="h-6 w-6 text-purple-600" />
                ) : (
                  <CircleDollarSign className="h-6 w-6 text-emerald-600" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{promo.name}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[promo.status]}`}>{promo.status}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {promo.code}
                    <Copy className="h-3 w-3 text-gray-400 cursor-pointer hover:text-gray-600" />
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(promo.startDate)} — {formatDate(promo.endDate)}
                  </span>
                </div>
              </div>

              {/* Value & Usage */}
              <div className="flex items-center gap-6 sm:text-right">
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {promo.type === 'percentage' ? `${promo.value}%` : formatEGP(promo.value)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {promo.type === 'percentage' ? 'Discount' : 'Fixed Amount'}
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{promo.usageCount}</p>
                  <p className="text-xs text-gray-400">
                    {promo.usageLimit ? `of ${promo.usageLimit}` : 'uses'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Min order: {formatEGP(promo.minOrderAmount)}</p>
                  {promo.usageLimit && (
                    <div className="h-1.5 w-20 rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full bg-rose-500"
                        style={{ width: `${Math.min((promo.usageCount / promo.usageLimit) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Promotion Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Create Promotion</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Name</label>
                <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="e.g. Summer Sale 2026" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (EGP)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="20" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
                <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono uppercase focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="SUMMER20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                  <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="Unlimited" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (EGP)</label>
                  <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="200" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => setShowCreate(false)} className="rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2 text-sm font-medium text-white">Create Promotion</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
