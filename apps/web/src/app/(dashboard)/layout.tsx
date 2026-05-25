'use client';

import { LanguageToggle, useI18n } from '@/lib/i18n';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ShoppingCart, Package, Grid3X3, ShoppingBag, Users, Building2, FileText, Warehouse, Truck, BookOpen, Calculator, BarChart3, Tag, Crown, Settings, LogOut, Menu, X, Heart, ClipboardCheck, CalendarDays, MessageCircle, Store, DollarSign, Shield, PackageCheck, Receipt, Target, TrendingUp, ScanBarcode, Bell, AlertTriangle, ShieldAlert, Calendar, ArrowDown, ChevronDown, }  from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'POS', href: '/pos', icon: ShoppingCart },
  { type: 'separator' as const, label: 'Catalog' },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Categories', href: '/categories', icon: Grid3X3 },
  { type: 'separator' as const, label: 'Sales' },
  { name: 'Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'WhatsApp Orders', href: '/whatsapp', icon: MessageCircle },
  { type: 'separator' as const, label: 'Purchasing' },
  { name: 'Vendors', href: '/vendors', icon: Building2 },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: FileText },
  { name: 'Goods Receiving', href: '/goods-receiving', icon: PackageCheck },
  { name: 'Vendor Bills', href: '/vendor-bills', icon: Receipt },
  { type: 'separator' as const, label: 'Operations' },
  { name: 'Branches', href: '/branches', icon: Store },
  { name: 'Inventory', href: '/inventory', icon: Warehouse },
  { name: 'Warehouses', href: '/warehouses', icon: Building2 },
  { name: 'Stock Counts', href: '/stock-counts', icon: ClipboardCheck },
  { name: 'Shipping', href: '/shipping', icon: Truck },
  { type: 'separator' as const, label: 'Finance' },
  { name: 'Accounting', href: '/accounting', icon: BookOpen },
  { name: 'Cost Centers', href: '/accounting/cost-centers', icon: Target },
  { name: 'Sub-Ledgers', href: '/accounting/sub-ledgers', icon: Receipt },
  { name: 'Statements', href: '/accounting/statements', icon: FileText },
  { name: 'Reports', href: '/accounting/advanced-reports', icon: TrendingUp },
  { name: 'Commissions', href: '/commissions', icon: Calculator },
  { name: 'Cost Tracking', href: '/cost-tracking', icon: DollarSign },
  { type: 'separator' as const, label: 'Marketing' },
  { name: 'Promotions', href: '/promotions', icon: Tag },
  { name: 'Wholesale', href: '/wholesale', icon: Crown },
  { name: 'Loyalty Program', href: '/loyalty', icon: Heart },
  { type: 'separator' as const, label: 'Analytics' },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Advanced Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Barcode Labels', href: '/barcode-labels', icon: ScanBarcode },
  { type: 'separator' as const, label: 'System' },
  { name: 'Users & Roles', href: '/users', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
];


/* ── Notification Center ── */
function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const notifs: any[] = [];
    const getToken = () => {
      try {
        const raw = localStorage.getItem('brushia-auth');
        if (raw) return JSON.parse(raw)?.state?.accessToken;
      } catch {}
      return localStorage.getItem('token');
    };
    const token = getToken();
    const headers: any = token ? { Authorization: 'Bearer ' + token } : {};

    try {
      // Low stock alerts
      const stockRes = await fetch('/api/v1/inventory/stock-levels', { headers });
      if (stockRes.ok) {
        const stockData = await stockRes.json();
        const levels = Array.isArray(stockData) ? stockData : stockData?.data ?? stockData?.rows ?? [];
        const lowStock = levels.filter((s: any) => Number(s.qty_on_hand ?? s.quantity ?? 0) < 10);
        lowStock.slice(0, 5).forEach((s: any) => {
          notifs.push({
            id: 'stock-' + s.product_id,
            type: 'warning',
            icon: '📦',
            title: 'Low Stock Alert',
            message: (s.product_name || 'Product') + ' — only ' + Number(s.qty_on_hand ?? s.quantity ?? 0) + ' left',
            time: 'Now',
          });
        });
        if (lowStock.length > 5) {
          notifs.push({ id: 'stock-more', type: 'info', icon: '⚠️', title: 'More Low Stock', message: '+' + (lowStock.length - 5) + ' more products below threshold', time: 'Now' });
        }
      }
    } catch {}

    try {
      // Pending orders
      const ordersRes = await fetch('/api/v1/sales/orders', { headers });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        const orders = Array.isArray(ordersData) ? ordersData : ordersData?.data ?? [];
        const pending = orders.filter((o: any) => o.status === 'pending');
        if (pending.length > 0) {
          notifs.push({
            id: 'orders-pending',
            type: 'info',
            icon: '🛒',
            title: 'Pending Orders',
            message: pending.length + ' order(s) awaiting confirmation',
            time: 'Now',
          });
        }
      }
    } catch {}

    try {
      // Active promotions ending soon
      const promoRes = await fetch('/api/v1/promotions', { headers });
      if (promoRes.ok) {
        const promos = await promoRes.json();
        const promoList = Array.isArray(promos) ? promos : promos?.data ?? [];
        const endingSoon = promoList.filter((p: any) => {
          const end = new Date(p.ends_at || p.end_date);
          const diff = end.getTime() - Date.now();
          return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000; // within 7 days
        });
        if (endingSoon.length > 0) {
          notifs.push({
            id: 'promo-ending',
            type: 'info',
            icon: '🏷️',
            title: 'Promotions Ending Soon',
            message: endingSoon.length + ' promotion(s) ending within 7 days',
            time: 'Soon',
          });
        }
      }
    } catch {}

    if (notifs.length === 0) {
      notifs.push({ id: 'none', type: 'success', icon: '✅', title: 'All Clear!', message: 'No urgent notifications', time: 'Now' });
    }

    setNotifications(notifs);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const urgentCount = notifications.filter(n => n.type === 'warning' || n.type === 'error').length;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition">
        <Bell className="h-5 w-5" />
        {urgentCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {urgentCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-3 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Notifications</h3>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{notifications.length}</span>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-5 w-5 border-2 border-rose-500 border-t-transparent rounded-full" />
              </div>
            ) : notifications.map(n => (
              <div key={n.id} className={cn('px-4 py-3 hover:bg-gray-50 transition', n.type === 'warning' && 'bg-amber-50/50')}>
                <div className="flex gap-3">
                  <span className="text-lg flex-shrink-0">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{n.time}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t px-4 py-2 bg-gray-50">
            <button onClick={() => fetchNotifications()} className="text-xs text-rose-500 hover:text-rose-600 font-medium w-full text-center">
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Wait for zustand persist to finish rehydrating from localStorage
    // before checking auth — prevents redirect race condition
    const checkHydration = () => {
      if (useAuthStore.persist?.hasHydrated?.()) {
        setHydrated(true);
      } else {
        // Fallback: check localStorage directly
        try {
          const raw = localStorage.getItem('brushia-auth');
          if (raw && JSON.parse(raw)?.state?.accessToken) {
            setHydrated(true);
            return;
          }
        } catch {}
        // If not hydrated yet, check again in 100ms (max 2s)
        setTimeout(checkHydration, 100);
      }
    };
    checkHydration();
  }, []);

  useEffect(() => {
    if (mounted && hydrated && !isAuthenticated) {
      // Double-check localStorage before redirecting
      try {
        const raw = localStorage.getItem('brushia-auth');
        if (raw && JSON.parse(raw)?.state?.accessToken) {
          // Token exists in localStorage but zustand hasn't synced — wait
          return;
        }
      } catch {}
      router.push('/auth/login');
    }
  }, [mounted, hydrated, isAuthenticated, router]);

  // Hide sidebar on POS page
  const isPOS = pathname === '/pos';

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading Brushia ERP...</p>
        </div>
      </div>
    );
  }

  if (isPOS) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    clearAuth();
    router.push('/auth/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gray-900 transition-transform duration-200 lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-purple-600">
              <span className="text-sm font-bold text-white">B</span>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent">
              Brushia
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item, idx) => {
            if ('type' in item && item.type === 'separator') {
              return (
                <div key={idx} className="pt-4 pb-1 px-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    {item.label}
                  </p>
                </div>
              );
            }
            if (!('href' in item)) return null;
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-rose-400')} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-purple-600 text-xs font-bold text-white">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">
                {user?.displayName || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-rose-400 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden lg:block">
            <h2 className="text-sm font-medium text-gray-500">
              {navigation.find((n) => 'href' in n && pathname === n.href)?.name || 'Brushia ERP'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <NotificationCenter />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              System Online
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-EG', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
