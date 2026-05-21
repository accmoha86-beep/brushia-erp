'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api-client';
import { formatEGP, cn } from '@/lib/utils';
import {
  ArrowLeft, Search, Trash2, Plus, Minus, ShoppingCart, CreditCard, Banknote,
  Smartphone, Receipt, X, UserCircle, Tag, Percent, Package, LogOut,
  ChevronRight, Sparkles, Clock, Pause, RotateCcw, DollarSign, PauseCircle,
  PlayCircle, Hash,
} from 'lucide-react';

/* ─── types ─── */
interface Register { id: string; name: string; location?: string }
interface Session { id: string; register_id: string; register_name?: string; opening_cash: number; opened_at: string }
interface Category { id: string; name: string; slug?: string; parent_id?: string | null }
interface Variant { id: string; name: string; sku?: string; price?: number; color?: string; stock?: number }
interface Product { id: string; name: string; base_price: number; category_id?: string; image_url?: string; variants?: Variant[]; stock?: number; sku?: string }
interface CartItem { product: Product; variant?: Variant; quantity: number; unit_price: number; discount_amount?: number; discount_percentage?: number }
interface Customer { id: string; name: string; phone?: string; email?: string; loyalty_points?: number }
interface HeldOrder { id: string; customer_name?: string; items: any[]; notes?: string; created_at?: string }
interface Payment { method: 'cash' | 'card' | 'vodafone_cash' | 'instapay'; amount: number; reference?: string }
interface Order { id: string; order_number?: string; receipt_number?: string; grand_total?: number; items?: any[]; status?: string; created_at?: string; customer_name?: string }

/* ─── constants ─── */
const categoryEmojis: Record<string, string> = {
  'makeup': '💄', 'lashes': '👁️', 'concealer': '✨', 'brushes': '🖌️',
  'brush-sets': '🎨', 'brush sets': '🎨', 'other-makeup': '💄', 'other makeup': '💄',
};
const categoryGradients: Record<string, string> = {
  'makeup': 'from-pink-400 to-rose-500', 'lashes': 'from-violet-400 to-purple-500',
  'concealer': 'from-amber-300 to-orange-400', 'brushes': 'from-sky-400 to-blue-500',
  'brush-sets': 'from-emerald-400 to-teal-500', 'brush sets': 'from-emerald-400 to-teal-500',
  'other-makeup': 'from-fuchsia-400 to-pink-500', 'other makeup': 'from-fuchsia-400 to-pink-500',
};
const VAT_RATE = 0.14;
const PAY_METHODS = [
  { key: 'cash' as const, label: 'Cash', icon: Banknote },
  { key: 'card' as const, label: 'Card', icon: CreditCard },
  { key: 'vodafone_cash' as const, label: 'Vodafone Cash', icon: Smartphone },
  { key: 'instapay' as const, label: 'InstaPay', icon: Sparkles },
];

function emojiFor(name: string) {
  const k = name.toLowerCase().replace(/\s+/g, '-');
  return categoryEmojis[k] ?? categoryEmojis[name.toLowerCase()] ?? '📦';
}
function gradientFor(name: string) {
  const k = name.toLowerCase().replace(/\s+/g, '-');
  return categoryGradients[k] ?? categoryGradients[name.toLowerCase()] ?? 'from-gray-500 to-gray-600';
}

/* ─── main ─── */
export default function POSPage() {
  /* phase: 'start-shift' | 'selling' | 'end-shift' */
  const [phase, setPhase] = useState<'start-shift' | 'selling' | 'end-shift'>('start-shift');
  const [loading, setLoading] = useState(true);

  /* session / register */
  const [registers, setRegisters] = useState<Register[]>([]);
  const [selectedRegister, setSelectedRegister] = useState('');
  const [openingCash, setOpeningCash] = useState('');
  const [session, setSession] = useState<Session | null>(null);

  /* catalog */
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  /* cart */
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [discountPct, setDiscountPct] = useState(0);
  const [couponCode, setCouponCode] = useState('');

  /* customers */
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');

  /* payment */
  const [showPayment, setShowPayment] = useState(false);
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'vodafone_cash' | 'instapay'>('cash');
  const [cashTendered, setCashTendered] = useState('');
  const [payReference, setPayReference] = useState('');
  const [splitMode, setSplitMode] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [processing, setProcessing] = useState(false);

  /* receipt */
  const [receiptData, setReceiptData] = useState<any>(null);

  /* tabs */
  const [activeTab, setActiveTab] = useState<'sale' | 'held' | 'returns' | 'cash'>('sale');

  /* held orders */
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [holdNote, setHoldNote] = useState('');

  /* returns */
  const [returnQuery, setReturnQuery] = useState('');
  const [returnOrders, setReturnOrders] = useState<Order[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnSuccess, setReturnSuccess] = useState(false);

  /* cash drawer */
  const [cashMovType, setCashMovType] = useState<'cash_in' | 'cash_out'>('cash_in');
  const [cashMovAmount, setCashMovAmount] = useState('');
  const [cashMovReason, setCashMovReason] = useState('');

  /* end shift */
  const [closingCash, setClosingCash] = useState('');
  const [sessionSummary, setSessionSummary] = useState<any>(null);

  /* clock */
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  /* search */
  const [productSearch, setProductSearch] = useState('');

  /* ── bootstrap ── */
  useEffect(() => {
    (async () => {
      try {
        const active = await api.get<any>('/pos/sessions/active');
        if (active?.id) { setSession(active); setPhase('selling'); }
      } catch {}
      try { const r = await api.get<any>('/pos/registers'); setRegisters(Array.isArray(r) ? r : r?.data ?? []); } catch {}
      try {
        const c = await api.get<any>('/catalog/categories');
        setCategories(Array.isArray(c) ? c : c?.data ?? []);
      } catch {}
      try {
        const p = await api.get<any>('/catalog/products?limit=200');
        setProducts(Array.isArray(p) ? p : p?.data ?? []);
      } catch {}
      try { const cu = await api.get<any>('/customers'); setCustomers(Array.isArray(cu) ? cu : cu?.data ?? []); } catch {}
      setLoading(false);
    })();
  }, []);

  const loadHeld = useCallback(async () => {
    if (!session) return;
    try { const h = await api.get<any>(`/pos/held-orders/${session.id}`); setHeldOrders(Array.isArray(h) ? h : h?.data ?? []); } catch {}
  }, [session]);

  useEffect(() => { if (session && activeTab === 'held') loadHeld(); }, [activeTab, session, loadHeld]);

  /* ── cart helpers ── */
  const addToCart = (product: Product, variant?: Variant) => {
    const price = variant?.price ?? product.base_price;
    setCart(prev => {
      const idx = prev.findIndex(i => i.product.id === product.id && i.variant?.id === variant?.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = { ...n[idx], quantity: n[idx].quantity + 1 }; return n; }
      return [...prev, { product, variant, quantity: 1, unit_price: price }];
    });
    setSelectedProduct(null);
  };

  const updateQty = (idx: number, delta: number) => {
    setCart(prev => {
      const n = [...prev];
      n[idx] = { ...n[idx], quantity: Math.max(1, n[idx].quantity + delta) };
      return n;
    });
  };

  const removeItem = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx));

  const subtotal = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const discountAmt = Math.round(subtotal * discountPct / 100);
  const afterDiscount = subtotal - discountAmt;
  const vatAmt = Math.round(afterDiscount * VAT_RATE);
  const grandTotal = afterDiscount + vatAmt;

  /* ── start shift ── */
  const startShift = async () => {
    if (!selectedRegister) return;
    setProcessing(true);
    try {
      const s = await api.post<any>('/pos/sessions/open', { register_id: selectedRegister, opening_cash: Math.round(parseFloat(openingCash || '0') * 100), notes: '' });
      setSession(s);
      setPhase('selling');
    } catch (e: any) { alert(e?.message ?? 'Failed to start shift'); }
    setProcessing(false);
  };

  /* ── payment flow ── */
  const openPayment = () => { if (cart.length === 0) return; setShowPayment(true); setCashTendered(''); setPayReference(''); setPayments([]); setSplitMode(false); setPayMethod('cash'); };

  const totalPaid = splitMode ? payments.reduce((s, p) => s + p.amount, 0) : 0;
  const remaining = splitMode ? grandTotal - totalPaid : grandTotal;

  const addSplitPayment = () => {
    const amt = payMethod === 'cash' ? Math.round(parseFloat(cashTendered || '0') * 100) : remaining;
    if (amt <= 0) return;
    setPayments(prev => [...prev, { method: payMethod, amount: Math.min(amt, remaining), reference: payReference || undefined }]);
    setCashTendered(''); setPayReference('');
  };

  const completeSale = async () => {
    setProcessing(true);
    try {
      let paymentsList: Payment[];
      if (splitMode) {
        paymentsList = payments;
      } else {
        const amt = payMethod === 'cash' ? Math.round(parseFloat(cashTendered || '0') * 100) : grandTotal;
        paymentsList = [{ method: payMethod, amount: Math.max(amt, grandTotal), reference: payReference || undefined }];
      }
      const body = {
        session_id: session!.id,
        customer_id: customer?.id,
        items: cart.map(i => ({
          product_id: i.product.id,
          variant_id: i.variant?.id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount_amount: i.discount_amount,
          discount_percentage: i.discount_percentage,
        })),
        payments: paymentsList,
        order_discount_amount: discountAmt || undefined,
        coupon_code: couponCode || undefined,
        notes: undefined,
      };
      const result = await api.post<any>('/pos/transactions', body);
      setReceiptData(result);
      setShowPayment(false);
    } catch (e: any) { alert(e?.message ?? 'Transaction failed'); }
    setProcessing(false);
  };

  const newSale = () => {
    setCart([]); setCustomer(null); setDiscountPct(0); setCouponCode('');
    setReceiptData(null); setSelectedCategory(null); setSelectedProduct(null);
  };

  /* ── hold ── */
  const holdOrder = async () => {
    if (!session || cart.length === 0) return;
    try {
      await api.post<any>('/pos/held-orders', {
        session_id: session.id, customer_name: customer?.name, items: cart.map(i => ({ product_id: i.product.id, variant_id: i.variant?.id, quantity: i.quantity, unit_price: i.unit_price })), notes: holdNote,
      });
      newSale(); setHoldNote('');
    } catch {}
  };

  const retrieveHeld = async (id: string) => {
    try {
      const o = await api.post<any>(`/pos/held-orders/${id}/retrieve`);
      if (o?.items) {
        setCart(o.items.map((i: any) => {
          const p = products.find(p => p.id === i.product_id);
          return { product: p ?? { id: i.product_id, name: 'Item', base_price: i.unit_price }, variant: undefined, quantity: i.quantity, unit_price: i.unit_price };
        }));
      }
      setActiveTab('sale');
      loadHeld();
    } catch {}
  };

  const voidHeld = async (id: string) => { try { await api.post<any>(`/pos/held-orders/${id}/void`); loadHeld(); } catch {} };

  /* ── returns ── */
  const searchReturns = async () => {
    try {
      const o = await api.get<any>(`/sales/orders?search=${encodeURIComponent(returnQuery)}`);
      setReturnOrders(Array.isArray(o) ? o : o?.data ?? []);
    } catch {}
  };

  const processReturn = async () => {
    if (!selectedReturn) return;
    setProcessing(true);
    try {
      await api.post<any>(`/sales/orders/${selectedReturn.id}/cancel`, { reason: returnReason, restock: true });
      setReturnSuccess(true);
    } catch (e: any) { alert(e?.message ?? 'Return failed'); }
    setProcessing(false);
  };

  /* ── cash movements ── */
  const submitCashMov = async () => {
    if (!session) return;
    try {
      await api.post<any>('/pos/cash-movements', { session_id: session.id, type: cashMovType, amount: Math.round(parseFloat(cashMovAmount || '0') * 100), reason: cashMovReason });
      setCashMovAmount(''); setCashMovReason('');
      alert('Cash movement recorded');
    } catch {}
  };

  /* ── end shift ── */
  const endShift = async () => {
    if (!session) return;
    setProcessing(true);
    try {
      const summary = await api.post<any>(`/pos/sessions/${session.id}/close`, { closing_cash: Math.round(parseFloat(closingCash || '0') * 100), notes: '' });
      setSessionSummary(summary);
      setPhase('end-shift');
    } catch (e: any) { alert(e?.message ?? 'Failed to close shift'); }
    setProcessing(false);
  };

  /* ── filtered products ── */
  const filteredProducts = products.filter(p => {
    if (selectedCategory && p.category_id !== selectedCategory.id) return false;
    if (productSearch) {
      const q = productSearch.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredCustomers = customers.filter(c => {
    if (!customerQuery) return true;
    const q = customerQuery.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.phone?.includes(q);
  });

  const changeAmount = () => {
    const tendered = Math.round(parseFloat(cashTendered || '0') * 100);
    return Math.max(0, tendered - (splitMode ? remaining : grandTotal));
  };

  /* ── loading ── */
  if (loading) return (
    <div className="h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-lg">Loading POS…</p>
      </div>
    </div>
  );

  /* ══════════════════════ PHASE: START SHIFT ══════════════════════ */
  if (phase === 'start-shift') return (
    <div className="h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Brushia POS</h1>
          <p className="text-gray-400 mt-1">Start your shift to begin selling</p>
        </div>

        <label className="block text-sm font-medium text-gray-300 mb-2">Register</label>
        <select value={selectedRegister} onChange={e => setSelectedRegister(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white mb-5 focus:outline-none focus:ring-2 focus:ring-rose-500">
          <option value="">Select register…</option>
          {registers.map(r => <option key={r.id} value={r.id}>{r.name}{r.location ? ` — ${r.location}` : ''}</option>)}
        </select>

        <label className="block text-sm font-medium text-gray-300 mb-2">Opening Cash (EGP)</label>
        <input type="number" min="0" step="0.01" value={openingCash} onChange={e => setOpeningCash(e.target.value)}
          placeholder="0.00"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:ring-2 focus:ring-rose-500" />

        <button onClick={startShift} disabled={!selectedRegister || processing}
          className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50">
          {processing ? 'Starting…' : 'Start Shift'}
        </button>
      </div>
    </div>
  );

  /* ══════════════════════ PHASE: END SHIFT SUMMARY ══════════════════════ */
  if (phase === 'end-shift') return (
    <div className="h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <div className="text-center mb-6">
          <LogOut className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-white">Shift Closed</h2>
        </div>
        {sessionSummary && (
          <div className="space-y-3 mb-6">
            {[
              ['Total Sales', sessionSummary.total_sales],
              ['Cash Sales', sessionSummary.cash_sales],
              ['Card Sales', sessionSummary.card_sales],
              ['Opening Cash', sessionSummary.opening_cash],
              ['Closing Cash', sessionSummary.closing_cash],
              ['Difference', sessionSummary.difference],
            ].map(([label, val]) => (
              <div key={label as string} className="flex justify-between text-sm">
                <span className="text-gray-400">{label as string}</span>
                <span className="text-white font-medium">{val != null ? formatEGP((val as number) / 100) : '—'}</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => { setSession(null); setPhase('start-shift'); setSessionSummary(null); setClosingCash(''); newSale(); }}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-xl transition">
          Start New Shift
        </button>
      </div>
    </div>
  );

  /* ══════════════════════ PHASE: SELLING ══════════════════════ */

  /* ── Receipt overlay ── */
  if (receiptData) return (
    <div className="h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Sale Complete!</h2>
          <p className="text-gray-400 text-sm mt-1">Receipt #{receiptData.receipt_number}</p>
          {receiptData.order_number && <p className="text-gray-500 text-xs">Order {receiptData.order_number}</p>}
        </div>
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {receiptData.items?.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-300">{item.name ?? item.product_name ?? 'Item'} ×{item.quantity}</span>
              <span className="text-white">{formatEGP((item.unit_price * item.quantity) / 100)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-700 pt-3 space-y-1">
          <div className="flex justify-between text-lg font-bold">
            <span className="text-white">Total</span>
            <span className="text-rose-400">{formatEGP((receiptData.grand_total ?? grandTotal) / 100)}</span>
          </div>
          {receiptData.change > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Change</span>
              <span className="text-emerald-400">{formatEGP(receiptData.change / 100)}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => window.print()} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-medium transition">
            Print Receipt
          </button>
          <button onClick={newSale} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-medium transition">
            New Sale
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Main selling interface ── */
  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">

      {/* ── Top bar ── */}
      <header className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg hidden sm:block">Brushia</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          {session && (
            <>
              <span className="hidden md:inline">Register: <span className="text-white">{session.register_name ?? 'POS'}</span></span>
              <span className="hidden md:inline">Session: <span className="text-rose-400 font-mono">{session.id.slice(0, 8)}</span></span>
            </>
          )}
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          <button onClick={() => {
            if (confirm('End your shift?')) {
              const cash = prompt('Enter closing cash (EGP):');
              if (cash !== null) { setClosingCash(cash); setTimeout(() => endShift(), 50); }
            }
          }} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
            <LogOut className="w-3.5 h-3.5" /> End Shift
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ═══════ LEFT: product area ═══════ */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* bottom tab nav */}
          <div className="flex-shrink-0 bg-gray-900 border-b border-gray-800 flex">
            {([
              { key: 'sale', label: 'Sale', emoji: '🛒' },
              { key: 'held', label: 'Held Orders', emoji: '📋' },
              { key: 'returns', label: 'Returns', emoji: '🔄' },
              { key: 'cash', label: 'Cash Drawer', emoji: '💰' },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={cn('flex-1 py-2.5 text-sm font-medium transition border-b-2',
                  activeTab === t.key ? 'text-rose-400 border-rose-500 bg-gray-800/50' : 'text-gray-400 border-transparent hover:text-gray-200')}>
                <span className="mr-1.5">{t.emoji}</span>{t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">

            {/* ── TAB: SALE ── */}
            {activeTab === 'sale' && (
              <>
                {/* search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input value={productSearch} onChange={e => { setProductSearch(e.target.value); if (e.target.value) { setSelectedCategory(null); setSelectedProduct(null); } }}
                    placeholder="Search products…"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>

                {productSearch ? (
                  /* search results grid */
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredProducts.map(p => (
                      <button key={p.id} onClick={() => p.variants && p.variants.length > 0 ? setSelectedProduct(p) : addToCart(p)}
                        className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-left hover:border-rose-500/50 transition group">
                        {p.image_url && <img src={p.image_url} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />}
                        <p className="text-white text-sm font-medium truncate">{p.name}</p>
                        <p className="text-rose-400 text-sm font-semibold mt-1">{formatEGP(p.base_price / 100)}</p>
                      </button>
                    ))}
                    {filteredProducts.length === 0 && <p className="text-gray-500 col-span-full text-center py-8">No products found</p>}
                  </div>
                ) : !selectedCategory ? (
                  /* Level 1: categories */
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {categories.map(cat => (
                      <button key={cat.id} onClick={() => setSelectedCategory(cat)}
                        className={cn('bg-gradient-to-br rounded-2xl p-6 text-left transition hover:scale-[1.02] shadow-lg', gradientFor(cat.slug ?? cat.name))}>
                        <span className="text-3xl">{emojiFor(cat.slug ?? cat.name)}</span>
                        <p className="text-white font-bold mt-3 text-lg">{cat.name}</p>
                        <p className="text-white/70 text-xs mt-1">
                          {products.filter(p => p.category_id === cat.id).length} products
                        </p>
                      </button>
                    ))}
                  </div>
                ) : selectedProduct ? (
                  /* Level 3: variant selection */
                  <div>
                    <button onClick={() => setSelectedProduct(null)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4 transition">
                      <ArrowLeft className="w-4 h-4" /> Back to {selectedCategory.name}
                    </button>
                    <h3 className="text-white font-bold text-lg mb-4">{selectedProduct.name} — Choose variant</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {(selectedProduct.variants ?? []).map(v => (
                        <button key={v.id} onClick={() => addToCart(selectedProduct, v)}
                          className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-rose-500/50 transition">
                          {v.color && <div className="w-8 h-8 rounded-full mb-2 border-2 border-gray-700" style={{ backgroundColor: v.color }} />}
                          <p className="text-white text-sm font-medium">{v.name}</p>
                          <p className="text-rose-400 text-sm font-semibold mt-1">{formatEGP((v.price ?? selectedProduct.base_price) / 100)}</p>
                          {v.stock != null && <p className="text-gray-500 text-xs mt-0.5">{v.stock} in stock</p>}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Level 2: products in category */
                  <div>
                    <button onClick={() => { setSelectedCategory(null); setProductSearch(''); }} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4 transition">
                      <ArrowLeft className="w-4 h-4" /> All Categories
                    </button>
                    <h3 className="text-white font-bold text-lg mb-4">{emojiFor(selectedCategory.slug ?? selectedCategory.name)} {selectedCategory.name}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {filteredProducts.map(p => (
                        <button key={p.id} onClick={() => p.variants && p.variants.length > 0 ? setSelectedProduct(p) : addToCart(p)}
                          className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-left hover:border-rose-500/50 transition group">
                          {p.image_url && <img src={p.image_url} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />}
                          <p className="text-white text-sm font-medium truncate">{p.name}</p>
                          <p className="text-rose-400 text-sm font-semibold mt-1">{formatEGP(p.base_price / 100)}</p>
                          {p.variants && p.variants.length > 0 && (
                            <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">{p.variants.length} variants <ChevronRight className="w-3 h-3" /></p>
                          )}
                        </button>
                      ))}
                      {filteredProducts.length === 0 && <p className="text-gray-500 col-span-full text-center py-8">No products in this category</p>}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── TAB: HELD ORDERS ── */}
            {activeTab === 'held' && (
              <div className="space-y-3">
                <h3 className="text-white font-bold text-lg mb-2">Held Orders</h3>
                {heldOrders.length === 0 && <p className="text-gray-500 text-sm">No held orders</p>}
                {heldOrders.map(o => (
                  <div key={o.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{o.customer_name || 'Walk-in'}</p>
                      <p className="text-gray-500 text-xs">{o.items?.length ?? 0} items · {o.notes || 'No notes'}</p>
                      {o.created_at && <p className="text-gray-600 text-xs mt-0.5">{new Date(o.created_at).toLocaleTimeString()}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => retrieveHeld(o.id)} className="bg-rose-500 hover:bg-rose-600 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                        <PlayCircle className="w-3.5 h-3.5" /> Retrieve
                      </button>
                      <button onClick={() => voidHeld(o.id)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                        <Trash2 className="w-3.5 h-3.5" /> Void
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── TAB: RETURNS ── */}
            {activeTab === 'returns' && (
              <div>
                <h3 className="text-white font-bold text-lg mb-4">Returns / Cancellations</h3>
                {returnSuccess ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
                    <RotateCcw className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <p className="text-emerald-400 font-semibold text-lg">Return Processed Successfully</p>
                    <button onClick={() => { setReturnSuccess(false); setSelectedReturn(null); setReturnReason(''); setReturnQuery(''); setReturnOrders([]); }}
                      className="mt-4 bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm transition">Done</button>
                  </div>
                ) : selectedReturn ? (
                  <div>
                    <button onClick={() => setSelectedReturn(null)} className="flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-3 transition">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                      <p className="text-white font-bold">Order {selectedReturn.order_number ?? selectedReturn.id.slice(0, 8)}</p>
                      <p className="text-gray-400 text-sm mb-3">{selectedReturn.customer_name || 'Walk-in'} · {selectedReturn.status}</p>
                      <div className="space-y-1 mb-4">
                        {selectedReturn.items?.map((it: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-300">{it.name ?? it.product_name} ×{it.quantity}</span>
                            <span className="text-white">{formatEGP((it.unit_price * it.quantity) / 100)}</span>
                          </div>
                        ))}
                      </div>
                      {selectedReturn.grand_total != null && (
                        <div className="flex justify-between font-bold text-white border-t border-gray-700 pt-2 mb-4">
                          <span>Total</span><span>{formatEGP(selectedReturn.grand_total / 100)}</span>
                        </div>
                      )}
                      <label className="block text-sm text-gray-300 mb-1">Return Reason</label>
                      <input value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder="Reason for return…"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-rose-500" />
                      <button onClick={processReturn} disabled={!returnReason || processing}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-medium transition disabled:opacity-50">
                        {processing ? 'Processing…' : 'Process Return & Restock'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mb-4">
                      <div className="relative flex-1">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input value={returnQuery} onChange={e => setReturnQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchReturns()}
                          placeholder="Search by order / receipt number…"
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                      </div>
                      <button onClick={searchReturns} className="bg-rose-500 hover:bg-rose-600 text-white px-5 rounded-xl text-sm font-medium transition">Search</button>
                    </div>
                    <div className="space-y-2">
                      {returnOrders.map(o => (
                        <button key={o.id} onClick={() => setSelectedReturn(o)}
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-rose-500/50 transition">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-white font-medium">{o.order_number ?? o.receipt_number ?? o.id.slice(0, 8)}</p>
                              <p className="text-gray-500 text-xs">{o.customer_name || 'Walk-in'} · {o.status}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-semibold">{o.grand_total != null ? formatEGP(o.grand_total / 100) : '—'}</p>
                              {o.created_at && <p className="text-gray-600 text-xs">{new Date(o.created_at).toLocaleDateString()}</p>}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── TAB: CASH DRAWER ── */}
            {activeTab === 'cash' && (
              <div className="max-w-md">
                <h3 className="text-white font-bold text-lg mb-4">Cash Drawer</h3>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
                  <div className="flex gap-2">
                    <button onClick={() => setCashMovType('cash_in')}
                      className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition', cashMovType === 'cash_in' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400')}>
                      Cash In
                    </button>
                    <button onClick={() => setCashMovType('cash_out')}
                      className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition', cashMovType === 'cash_out' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gray-800 text-gray-400')}>
                      Cash Out
                    </button>
                  </div>
                  <input type="number" min="0" step="0.01" value={cashMovAmount} onChange={e => setCashMovAmount(e.target.value)} placeholder="Amount (EGP)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  <input value={cashMovReason} onChange={e => setCashMovReason(e.target.value)} placeholder="Reason"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  <button onClick={submitCashMov} disabled={!cashMovAmount || !cashMovReason}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl font-medium transition disabled:opacity-50">
                    Record Movement
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════ RIGHT: cart panel ═══════ */}
        <aside className="w-[380px] flex-shrink-0 bg-gray-900 border-l border-gray-800 flex flex-col overflow-hidden">
          {/* cart header */}
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-white font-bold flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Cart <span className="text-xs text-gray-500">({cart.length})</span></h2>
            {customer ? (
              <button onClick={() => setCustomer(null)} className="text-xs bg-rose-500/20 text-rose-400 px-2 py-1 rounded-lg flex items-center gap-1">
                <UserCircle className="w-3 h-3" />{customer.name} <X className="w-3 h-3" />
              </button>
            ) : (
              <button onClick={() => setShowCustomerSearch(true)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded-lg flex items-center gap-1 transition">
                <UserCircle className="w-3 h-3" /> Customer
              </button>
            )}
          </div>

          {/* cart items */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
            {cart.length === 0 && (
              <div className="text-center py-12 text-gray-600">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Cart is empty</p>
              </div>
            )}
            {cart.map((item, idx) => (
              <div key={idx} className="bg-gray-800/60 rounded-xl p-3 flex gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.product.name}</p>
                  {item.variant && <p className="text-gray-500 text-xs">{item.variant.name}</p>}
                  <p className="text-rose-400 text-sm font-semibold mt-1">{formatEGP((item.unit_price * item.quantity) / 100)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateQty(idx, -1)} className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-300 transition">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-white text-sm font-medium w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(idx, 1)} className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-300 transition">
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={() => removeItem(idx)} className="w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center text-red-400 transition ml-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* discount / coupon */}
          <div className="px-4 py-2 border-t border-gray-800 space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input type="number" min="0" max="100" value={discountPct || ''} onChange={e => setDiscountPct(Number(e.target.value))} placeholder="Discount %"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500" />
              </div>
              <div className="relative flex-1">
                <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Coupon code"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500" />
              </div>
            </div>
          </div>

          {/* totals */}
          <div className="px-4 py-3 border-t border-gray-800 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-400"><span>Subtotal</span><span className="text-white">{formatEGP(subtotal / 100)}</span></div>
            {discountAmt > 0 && <div className="flex justify-between text-emerald-400"><span>Discount ({discountPct}%)</span><span>-{formatEGP(discountAmt / 100)}</span></div>}
            <div className="flex justify-between text-gray-400"><span>VAT (14%)</span><span className="text-white">{formatEGP(vatAmt / 100)}</span></div>
            <div className="flex justify-between text-lg font-bold pt-1 border-t border-gray-700">
              <span className="text-white">Total</span>
              <span className="text-rose-400">{formatEGP(grandTotal / 100)}</span>
            </div>
          </div>

          {/* action buttons */}
          <div className="px-4 py-3 border-t border-gray-800 flex gap-2">
            <button onClick={holdOrder} disabled={cart.length === 0}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 transition disabled:opacity-30">
              <PauseCircle className="w-4 h-4" /> Hold
            </button>
            <button onClick={openPayment} disabled={cart.length === 0}
              className="flex-[2] bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition disabled:opacity-30">
              <Banknote className="w-4 h-4" /> Charge {cart.length > 0 ? formatEGP(grandTotal / 100) : ''}
            </button>
          </div>
        </aside>
      </div>

      {/* ═══════ PAYMENT MODAL ═══════ */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-white font-bold text-lg">Payment</h3>
              <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* total */}
              <div className="text-center">
                <p className="text-gray-400 text-sm">Total Due</p>
                <p className="text-3xl font-bold text-white">{formatEGP((splitMode ? remaining : grandTotal) / 100)}</p>
              </div>

              {/* split toggle */}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={splitMode} onChange={e => { setSplitMode(e.target.checked); setPayments([]); }}
                  className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-rose-500 focus:ring-rose-500" />
                <span className="text-gray-300">Split Payment</span>
              </label>

              {/* method tabs */}
              <div className="flex gap-2">
                {PAY_METHODS.map(m => (
                  <button key={m.key} onClick={() => setPayMethod(m.key)}
                    className={cn('flex-1 py-2.5 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition border',
                      payMethod === m.key ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600')}>
                    <m.icon className="w-4 h-4" />{m.label}
                  </button>
                ))}
              </div>

              {/* cash input */}
              {payMethod === 'cash' && (
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Cash Tendered (EGP)</label>
                  <input type="number" min="0" step="0.01" value={cashTendered} onChange={e => setCashTendered(e.target.value)}
                    placeholder="0.00" autoFocus
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg font-mono focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  {cashTendered && (
                    <p className="text-sm mt-2">
                      Change: <span className="text-emerald-400 font-bold">{formatEGP(changeAmount() / 100)}</span>
                    </p>
                  )}
                  {/* quick amounts */}
                  <div className="flex gap-2 mt-2">
                    {[50, 100, 200, 500].map(v => (
                      <button key={v} onClick={() => setCashTendered(String(v))}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded-lg text-xs font-medium transition">{v}</button>
                    ))}
                    <button onClick={() => setCashTendered(String((splitMode ? remaining : grandTotal) / 100))}
                      className="flex-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 py-1.5 rounded-lg text-xs font-medium transition">Exact</button>
                  </div>
                </div>
              )}

              {/* reference for card/mobile */}
              {payMethod !== 'cash' && (
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Reference # (optional)</label>
                  <input value={payReference} onChange={e => setPayReference(e.target.value)} placeholder="Transaction reference"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
              )}

              {/* split payments list */}
              {splitMode && payments.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Added Payments</p>
                  {payments.map((p, i) => (
                    <div key={i} className="flex justify-between text-sm bg-gray-800 rounded-lg px-3 py-2">
                      <span className="text-gray-300 capitalize">{p.method.replace('_', ' ')}</span>
                      <span className="text-white font-medium">{formatEGP(p.amount / 100)}</span>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400">Remaining: <span className="text-rose-400 font-bold">{formatEGP(remaining / 100)}</span></p>
                </div>
              )}

              {splitMode && remaining > 0 ? (
                <button onClick={addSplitPayment} className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-medium transition">
                  Add Payment
                </button>
              ) : null}

              {/* complete */}
              <button onClick={completeSale} disabled={processing || (splitMode && remaining > 0) || (!splitMode && payMethod === 'cash' && parseFloat(cashTendered || '0') * 100 < grandTotal)}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white py-3.5 rounded-xl font-bold text-lg transition disabled:opacity-40">
                {processing ? 'Processing…' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ CUSTOMER SEARCH MODAL ═══════ */}
      {showCustomerSearch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
              <h3 className="text-white font-bold">Find Customer</h3>
              <button onClick={() => { setShowCustomerSearch(false); setCustomerQuery(''); }} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input value={customerQuery} onChange={e => setCustomerQuery(e.target.value)} placeholder="Search by name or phone…" autoFocus
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredCustomers.slice(0, 20).map(c => (
                  <button key={c.id} onClick={() => { setCustomer(c); setShowCustomerSearch(false); setCustomerQuery(''); }}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-800 transition">
                    <p className="text-white text-sm font-medium">{c.name}</p>
                    <p className="text-gray-500 text-xs">{c.phone || c.email || '—'}</p>
                  </button>
                ))}
                {filteredCustomers.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No customers found</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
