'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple' | 'teal' | 'indigo' | 'orange' | 'red' | 'gray' | 'green';
  trend?: { value: string; up?: boolean };
  className?: string;
}

const colorMap = {
  emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-100' },
  blue:    { bg: 'bg-blue-50',    icon: 'bg-blue-100 text-blue-600',       border: 'border-blue-100' },
  amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-100 text-amber-600',     border: 'border-amber-100' },
  rose:    { bg: 'bg-rose-50',    icon: 'bg-rose-100 text-rose-600',       border: 'border-rose-100' },
  purple:  { bg: 'bg-purple-50',  icon: 'bg-purple-100 text-purple-600',   border: 'border-purple-100' },
  teal:    { bg: 'bg-teal-50',    icon: 'bg-teal-100 text-teal-600',       border: 'border-teal-100' },
  indigo:  { bg: 'bg-indigo-50',  icon: 'bg-indigo-100 text-indigo-600',   border: 'border-indigo-100' },
  orange:  { bg: 'bg-orange-50',  icon: 'bg-orange-100 text-orange-600',   border: 'border-orange-100' },
  red:     { bg: 'bg-red-50',     icon: 'bg-red-100 text-red-600',         border: 'border-red-100' },
  gray:    { bg: 'bg-gray-50',    icon: 'bg-gray-100 text-gray-600',       border: 'border-gray-100' },
  green:   { bg: 'bg-green-50',   icon: 'bg-green-100 text-green-600',     border: 'border-green-100' },
};

export function StatCard({ label, value, icon, color = 'emerald', trend, className }: StatCardProps) {
  const c = colorMap[color] || colorMap.emerald;
  return (
    <div className={cn('rounded-2xl border bg-white p-5 transition-all hover:shadow-md', c.border, className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={cn('text-xs font-medium', trend.up ? 'text-emerald-600' : 'text-red-500')}>
              {trend.up ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', c.icon)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function StatCardGrid({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 | 5 }) {
  const gridCls = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
  }[cols];
  return <div className={cn('grid gap-4', gridCls)}>{children}</div>;
}
