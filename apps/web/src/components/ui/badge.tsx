'use client';

import { cn } from '@/lib/utils';

type BadgeColor = 'emerald' | 'blue' | 'amber' | 'rose' | 'red' | 'purple' | 'gray' | 'indigo' | 'teal' | 'orange' | 'yellow' | 'green';

const badgeColors: Record<BadgeColor, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  green: 'bg-green-50 text-green-700 ring-green-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  yellow: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  rose: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  purple: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  gray: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  teal: 'bg-teal-50 text-teal-700 ring-teal-600/20',
  orange: 'bg-orange-50 text-orange-700 ring-orange-600/20',
};

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  dot?: boolean;
  className?: string;
}

export function Badge({ children, color = 'gray', dot, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
      badgeColors[color], className
    )}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', color === 'emerald' ? 'bg-emerald-500' : color === 'red' ? 'bg-red-500' : 'bg-current')} />}
      {children}
    </span>
  );
}
