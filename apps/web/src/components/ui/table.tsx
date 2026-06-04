'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-gray-50/80 border-b border-gray-200">
      {children}
    </thead>
  );
}

export function Th({ children, align = 'left', className }: { children?: ReactNode; align?: 'left' | 'right' | 'center'; className?: string }) {
  return (
    <th className={cn(
      'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500',
      align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
      className
    )}>
      {children}
    </th>
  );
}

export function Td({ children, align = 'left', className }: { children?: ReactNode; align?: 'left' | 'right' | 'center'; className?: string }) {
  return (
    <td className={cn(
      'px-4 py-3.5',
      align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
      className
    )}>
      {children}
    </td>
  );
}

export function Tr({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr onClick={onClick} className={cn(
      'border-b border-gray-50 last:border-0 transition-colors',
      onClick ? 'cursor-pointer hover:bg-emerald-50/40' : 'hover:bg-gray-50/50',
      className
    )}>
      {children}
    </tr>
  );
}
