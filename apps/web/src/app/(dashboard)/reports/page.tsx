'use client';

import { formatEGP } from '@/lib/utils';
import { BarChart3, TrendingUp, Package, FileText, ArrowRight, Calendar, Activity, Wallet } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  metric: string;
  metricLabel: string;
  color: string;
  bgColor: string;
}

const reports: Report[] = [
  {
    id: 'sales',
    title: 'Sales Summary',
    description: 'Revenue, orders, average order value, payment methods breakdown for selected period',
    icon: BarChart3,
    metric: formatEGP(3842000),
    metricLabel: 'This Month Revenue',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    id: 'inventory',
    title: 'Inventory Valuation',
    description: 'Current stock levels, total value at cost & retail, slow-moving items analysis',
    icon: Package,
    metric: formatEGP(33340000),
    metricLabel: 'Total Inventory Value',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'pnl',
    title: 'P&L Statement',
    description: 'Revenue, COGS, gross profit, operating expenses, net profit margin',
    icon: Wallet,
    metric: '42.3%',
    metricLabel: 'Gross Margin',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 'top-products',
    title: 'Top Products',
    description: 'Best selling products by revenue and units, category performance analysis',
    icon: TrendingUp,
    metric: '142 units',
    metricLabel: 'Top Product (Foundation)',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
  {
    id: 'customers',
    title: 'Customer Analytics',
    description: 'New vs returning customers, lifetime value, acquisition cost, retention rate',
    icon: Activity,
    metric: '78%',
    metricLabel: 'Returning Rate',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    id: 'purchasing',
    title: 'Purchasing Report',
    description: 'Purchase orders, vendor performance, landed cost analysis, lead times',
    icon: FileText,
    metric: formatEGP(30370000),
    metricLabel: 'YTD Purchases',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
];

const kpis = [
  { label: 'Revenue Today', value: formatEGP(1247500), change: '+12.5%', up: true },
  { label: 'MTD Revenue', value: formatEGP(3842000), change: '+8.3%', up: true },
  { label: 'Avg Order Value', value: formatEGP(86400), change: '+5.1%', up: true },
  { label: 'Gross Margin', value: '42.3%', change: '-1.2%', up: false },
  { label: 'Orders Today', value: '23', change: '+15%', up: true },
  { label: 'Return Rate', value: '2.1%', change: '-0.5%', up: true },
];

const monthlyRevenue = [
  { month: 'Jan', revenue: 2890000 },
  { month: 'Feb', revenue: 3120000 },
  { month: 'Mar', revenue: 3450000 },
  { month: 'Apr', revenue: 3280000 },
  { month: 'May', revenue: 3842000 },
];

export default function ReportsPage() {
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Business analytics and insights</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          May 2026
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{kpi.label}</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{kpi.value}</p>
            <span className={`text-xs font-medium ${kpi.up ? 'text-emerald-600' : 'text-red-500'}`}>{kpi.change}</span>
          </div>
        ))}
      </div>

      {/* Monthly Revenue */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-1">Monthly Revenue Trend</h3>
        <p className="text-sm text-gray-500 mb-6">Last 5 months</p>
        <div className="flex items-end gap-4 h-48">
          {monthlyRevenue.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-gray-600">{formatEGP(m.revenue)}</span>
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-rose-500 to-purple-500 hover:from-rose-400 hover:to-purple-400 transition-all"
                style={{ height: `${(m.revenue / maxRevenue) * 160}px` }}
              />
              <span className="text-sm font-medium text-gray-500">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Report cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <div key={report.id} className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-rose-200 transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${report.bgColor}`}>
                    <Icon className={`h-5 w-5 ${report.color}`} />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-rose-500 transition-colors" />
                </div>
                <h3 className="font-semibold text-gray-900">{report.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{report.description}</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className={`text-lg font-bold ${report.color}`}>{report.metric}</p>
                  <p className="text-xs text-gray-400">{report.metricLabel}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
