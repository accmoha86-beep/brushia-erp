'use client';

import { ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchFilterProps {
  search: string;
  onSearchChange: (v: string) => void;
  placeholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
}

export function SearchFilter({ search, onSearchChange, placeholder = 'Search...', filters, actions }: SearchFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text" value={search} onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
        {search && (
          <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {filters && <div className="flex items-center gap-2 flex-wrap">{filters}</div>}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

interface FilterTabProps {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
}

export function FilterTabs({ tabs, active, onChange }: FilterTabProps) {
  return (
    <>
      {tabs.map((tab) => (
        <button key={tab.key} onClick={() => onChange(tab.key)}
          className={cn(
            'px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
            active === tab.key
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}>
          {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ''}
        </button>
      ))}
    </>
  );
}
