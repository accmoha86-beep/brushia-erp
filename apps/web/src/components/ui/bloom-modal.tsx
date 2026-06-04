'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  footer?: ReactNode;
}

const sizes = {
  sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl',
};

export function BloomModal({ open, onClose, title, subtitle, size = 'md', children, footer }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col', sizes[size])}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto px-6 py-4 flex-1">
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Consistent button styles
export function BtnPrimary({ children, onClick, disabled, className }: { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn('rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm', className)}>
      {children}
    </button>
  );
}

export function BtnSecondary({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick}
      className={cn('rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all', className)}>
      {children}
    </button>
  );
}

export function BtnDanger({ children, onClick, disabled, className }: { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn('rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-all disabled:opacity-50', className)}>
      {children}
    </button>
  );
}
