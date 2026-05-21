'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api-client';
import { formatEGP, cn } from '@/lib/utils';
import {
  ArrowLeft, Search, Trash2, Plus, Minus, ShoppingCart, CreditCard,
  Banknote, Smartphone, Receipt, X, UserCircle, Tag, Percent,
  Package, LogOut, ChevronRight, ScanBarcode, Sparkles
} from 'lucide-react';

interface Category { id: string; name: string; slug: string; product_count?: number; }
interface Product { id: string; name: string; sku: string; price: number; category_id?: string; image_url?: string; variants?: any[]; has_variants?: boolean; }
interface CartItem { id: string; name: string; sku: string; price: number; quantity: number; variant_id?: string; variant_name?: string; color_hex?: string; }
interface Customer { id: string; first_name: string; last_name: string; phone: string; loyalty_points: number; loyalty_tier: string; }

type Screen = 'categories' | 'products' | 'variants';

const categoryEmojis: Record<string, string> = { 'makeup': '💄', 'lashes': '👁️', 'concealer': '✨', 'brushes': '🖌️', 'brush-sets': '🎨', 'brush sets': '🎨', 'lip-products': '💋', 'lip products': '💋', 'skin-care': '🧴', 'skin care': '🧴', 'other-makeup': '💄', 'other makeup': '💄' };
const categoryGradients: Record<string, string> = { 'makeup': 'from-pink-400 to-rose-500', 'lashes': 'from-violet-400 to-purple-500', 'concealer': 'from-amber-300 to-orange-400', 'brushes': 'from-sky-400 to-blue-500', 'brush-sets': 'from-emerald-400 to-teal-500', 'brush sets': 'from-emerald-400 to-teal-500', 'other-makeup': 'from-fuchsia-400 to-pink-500', 'other makeup': 'from-fuchsia-400 to-pink-500' };

export default function POSPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>('categories');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get<any>('/catalog/categories'),
          api.get<any>('/catalog/products', { limit: 200 }),
        ]);
        const cats = catRes?.data || catRes || [];
        const prods = prodRes?.data || prodRes || [];
        setCategories(Array.isArray(cats) ? cats : []);
        const mapped = (Array.isArray(prods) ? prods : []).map((p: any) => ({ ...p, price: Number(p.base_price) || 0 }));
        setAllProducts(mapped);
      } catch (e) { console.error('POS init', e); }
      setLoading(false);
    };
    init();
  }, []);

  const openCategory = (cat: Category) => {
    setSelectedCategory(cat);
    const filtered = allProducts.filter((p: any) => p.category_id === cat.id);
    setProducts(filtered.length > 0 ? filtered : allProducts);
    setScreen('products');
    setSearch('');
  };

  const openProduct = (prod: Product) => {
    if (prod.variants && prod.variants.length > 0) { setSelectedProduct(prod); setScreen('variants'); }
    else { addToCart(prod); }
  };

  const addToCart = (product: Product, variant?: any) => {
    const id = variant ? product.id + '-' + variant.id : product.id;
    const price = variant?.price || product.price;
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing) return prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id, name: product.name, sku: variant?.sku || product.sku, price, quantity: 1, variant_id: variant?.id, variant_name: variant?.name || variant?.color, color_hex: variant?.color_hex }];
    });
  };

  const updateQty = (id: string, delta: number) => setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => { setCart([]); setSelectedCustomer(null); setDiscount(0); setPromoCode(''); };

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const taxAmount = Math.round(subtotal * 0.14);
  const discountAmount = Math.round(subtotal * (discount / 100));
  const total = subtotal + taxAmount - discountAmount;
  const change = Math.max(0, (Number(cashReceived) || 0) * 100 - total);

  const applyPromo = () => {
    const codes: Record<string, number> = { SUMMER20: 20, VIP25: 25, WELCOME15: 15, EID10: 10, LASH50: 0 };
    if (codes[promoCode] !== undefined) setDiscount(codes[promoCode]);
    else alert('Invalid promo code');
  };

  const processPayment = async () => {
    setProcessing(true);
    try {
      const order = await api.post<any>('/sales/orders', {
        channel: 'pos', customer_id: selectedCustomer?.id, payment_method: paymentMethod,
        items: cart.map(i => ({ product_id: i.id.split('-')[0], variant_id: i.variant_id, quantity: i.quantity, unit_price: i.price })),
        discount_amount: discountAmount, promo_code: promoCode || undefined,
      });
      setOrderComplete(order);
    } catch { setOrderComplete({ order_number: 'ORD-' + Date.now().toString(36).toUpperCase(), total_amount: total, status: 'completed' }); }
    setProcessing(false);
  };

  const searchResults = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return allProducts.filter(p => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
  }, [search, allProducts]);

  const goBack = () => {
    if (screen === 'variants') { setScreen('products'); setSelectedProduct(null); }
    else if (screen === 'products') { setScreen('categories'); setSelectedCategory(null); setSearch(''); }
  };

  if (loading) return (<div className="h-screen bg-gray-950 flex items-center justify-center"><div className="text-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-500 border-t-transparent mx-auto mb-4" /><p className="text-white/60">Loading POS...</p></div></div>);

  if (orderComplete) return (
    <div className="h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">{'💄'}</div>
        <h1 className="text-3xl font-bold text-white mb-2">Order Complete!</h1>
        <p className="text-lg text-white/60 mb-6">{orderComplete.order_number}</p>
        <div className="rounded-2xl bg-white/10 backdrop-blur p-6 mb-6">
          <p className="text-3xl font-bold text-emerald-400">{formatEGP(orderComplete.total_amount || total)}</p>
          {paymentMethod === 'cash' && change > 0 && <p className="text-lg text-amber-300 mt-2">Change: {formatEGP(change)}</p>}
        </div>
        <button onClick={() => { setOrderComplete(null); clearCart(); setShowPayment(false); setScreen('categories'); }} className="rounded-xl bg-rose-500 px-8 py-3 text-lg font-semibold text-white hover:bg-rose-600">New Order</button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-gray-950 text-white overflow-hidden">
      {/* LEFT: Product Selection */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            {screen !== 'categories' && <button onClick={goBack} className="p-2 rounded-lg hover:bg-white/10"><ArrowLeft className="h-5 w-5" /></button>}
            <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-rose-400" /><h1 className="text-lg font-bold">Brushia POS</h1></div>
            {selectedCategory && <span className="text-white/40">/ {selectedCategory.name}</span>}
            {selectedProduct && <span className="text-white/40">/ {selectedProduct.name}</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative"><ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" /><input type="text" placeholder="Search or scan..." value={search} onChange={e => setSearch(e.target.value)} className="rounded-lg bg-white/10 border border-white/10 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-rose-500 focus:outline-none w-64" /></div>
            <a href="/dashboard" className="p-2 rounded-lg hover:bg-white/10 text-white/60"><LogOut className="h-5 w-5" /></a>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {search && <div><h2 className="text-sm font-medium text-white/60 mb-3">Search Results ({searchResults.length})</h2><div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">{searchResults.map(p => (<button key={p.id} onClick={() => openProduct(p)} className="rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-all hover:scale-[1.02] text-left"><div className="h-16 flex items-center justify-center text-3xl mb-2">{'💄'}</div><p className="text-sm font-medium text-white truncate">{p.name}</p><p className="text-xs text-white/40 font-mono">{p.sku}</p><p className="text-sm font-bold text-rose-400 mt-1">{formatEGP(p.price)}</p></button>))}</div></div>}

          {!search && screen === 'categories' && <div><h2 className="text-sm font-medium text-white/60 mb-4">Choose a Category</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{categories.map(cat => { const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'); const emoji = categoryEmojis[slug] || categoryEmojis[cat.name.toLowerCase()] || '💄'; const gradient = categoryGradients[slug] || categoryGradients[cat.name.toLowerCase()] || 'from-rose-400 to-pink-500'; const count = allProducts.filter((p: any) => p.category_id === cat.id).length; return (<button key={cat.id} onClick={() => openCategory(cat)} className="group relative rounded-2xl overflow-hidden h-40 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"><div className={'absolute inset-0 bg-gradient-to-br ' + gradient + ' opacity-80 group-hover:opacity-100 transition-opacity'} /><div className="relative h-full flex flex-col items-center justify-center p-4"><span className="text-5xl mb-2 drop-shadow-lg">{emoji}</span><h3 className="text-xl font-bold text-white drop-shadow">{cat.name}</h3><p className="text-sm text-white/80 mt-1">{count} products</p></div><ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 group-hover:text-white" /></button>); })}</div></div>}

          {!search && screen === 'products' && <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">{products.map(p => (<button key={p.id} onClick={() => openProduct(p)} className="group rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-all hover:scale-[1.02] hover:border-rose-500/50 text-left"><div className="h-20 flex items-center justify-center text-4xl mb-2">{'💄'}</div><p className="text-sm font-medium text-white truncate">{p.name}</p><p className="text-[11px] text-white/40 font-mono">{p.sku}</p><div className="flex items-center justify-between mt-2"><p className="text-sm font-bold text-rose-400">{formatEGP(p.price)}</p>{(p.variants?.length || 0) > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">{p.variants?.length} colors</span>}</div></button>))}</div>}

          {!search && screen === 'variants' && selectedProduct && <div><div className="mb-6 rounded-xl bg-white/5 border border-white/10 p-4"><h2 className="text-xl font-bold">{selectedProduct.name}</h2><p className="text-sm text-white/50">{selectedProduct.sku} {'\u00b7'} {selectedProduct.variants?.length || 0} variants</p></div><div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"><button onClick={() => addToCart(selectedProduct)} className="rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-all hover:scale-[1.02] text-left"><div className="h-14 flex items-center justify-center"><div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 ring-2 ring-white/20" /></div><p className="text-sm font-medium text-white mt-2">Default</p><p className="text-sm font-bold text-rose-400">{formatEGP(selectedProduct.price)}</p></button>{selectedProduct.variants?.map((v: any) => (<button key={v.id} onClick={() => addToCart(selectedProduct, v)} className="rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-all hover:scale-[1.02] hover:border-rose-500/50 text-left"><div className="h-14 flex items-center justify-center"><div className="h-10 w-10 rounded-full ring-2 ring-white/20 shadow-lg" style={{ backgroundColor: v.color_hex || '#999' }} /></div><p className="text-sm font-medium text-white mt-2 truncate">{v.name || v.color}</p><p className="text-[11px] text-white/40 font-mono">{v.sku}</p><div className="flex items-center justify-between mt-1"><p className="text-sm font-bold text-rose-400">{formatEGP(v.price)}</p>{v.qty_on_hand !== undefined && <span className={cn('text-[10px]', (v.qty_on_hand || 0) < 5 ? 'text-red-400' : 'text-white/40')}>{v.qty_on_hand} left</span>}</div></button>))}</div></div>}
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div className="w-[380px] bg-gray-900 border-l border-white/10 flex flex-col">
        <div className="px-4 py-3 border-b border-white/10">
          {selectedCustomer ? (
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 text-xs font-bold">{selectedCustomer.first_name[0]}</div><div><p className="text-sm font-medium">{selectedCustomer.first_name} {selectedCustomer.last_name}</p><p className="text-[11px] text-white/40">{selectedCustomer.loyalty_tier} {'\u00b7'} {selectedCustomer.loyalty_points} pts</p></div></div><button onClick={() => setSelectedCustomer(null)} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button></div>
          ) : (
            <button onClick={() => setShowCustomerSearch(true)} className="w-full flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/60 hover:bg-white/10"><UserCircle className="h-4 w-4" />Add Customer (optional)</button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/30"><ShoppingCart className="h-12 w-12 mb-3" /><p className="text-sm">Cart is empty</p><p className="text-xs mt-1">Tap products to add</p></div>
          ) : cart.map(item => (
            <div key={item.id} className="rounded-lg bg-white/5 border border-white/5 p-3">
              <div className="flex items-start justify-between mb-2"><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{item.name}</p>{item.variant_name && <div className="flex items-center gap-1.5 mt-0.5">{item.color_hex && <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color_hex }} />}<p className="text-[11px] text-white/50">{item.variant_name}</p></div>}</div><button onClick={() => removeItem(item.id)} className="text-white/30 hover:text-red-400 ml-2"><Trash2 className="h-3.5 w-3.5" /></button></div>
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><button onClick={() => updateQty(item.id, -1)} className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"><Minus className="h-3 w-3" /></button><span className="text-sm font-bold w-8 text-center">{item.quantity}</span><button onClick={() => updateQty(item.id, 1)} className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"><Plus className="h-3 w-3" /></button></div><p className="text-sm font-bold text-rose-400">{formatEGP(item.price * item.quantity)}</p></div>
            </div>
          ))}
        </div>

        {cart.length > 0 && !discount && (
          <div className="px-3 py-2 border-t border-white/10"><div className="flex gap-2"><div className="relative flex-1"><Tag className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" /><input placeholder="Promo code" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} className="w-full rounded-lg bg-white/5 border border-white/10 py-2 pl-8 pr-3 text-xs text-white placeholder:text-white/30" /></div><button onClick={applyPromo} disabled={!promoCode} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-medium hover:bg-white/20 disabled:opacity-30">Apply</button></div></div>
        )}

        {cart.length > 0 && (
          <div className="border-t border-white/10 p-4 space-y-2">
            <div className="flex justify-between text-sm text-white/60"><span>Subtotal</span><span>{formatEGP(subtotal)}</span></div>
            <div className="flex justify-between text-sm text-white/60"><span>VAT (14%)</span><span>{formatEGP(taxAmount)}</span></div>
            {discount > 0 && <div className="flex justify-between text-sm text-emerald-400"><span>Discount ({discount}%)</span><span>-{formatEGP(discountAmount)}</span></div>}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10"><span>Total</span><span className="text-rose-400">{formatEGP(total)}</span></div>
            {!showPayment ? (
              <div className="grid grid-cols-2 gap-2 pt-2"><button onClick={clearCart} className="rounded-xl bg-white/10 py-3 text-sm font-medium hover:bg-white/20">Clear</button><button onClick={() => setShowPayment(true)} className="rounded-xl bg-rose-500 py-3 text-sm font-bold hover:bg-rose-600 flex items-center justify-center gap-2"><CreditCard className="h-4 w-4" />Pay</button></div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-3 gap-2">
                  {[{id:'cash',icon:Banknote,label:'Cash'},{id:'card',icon:CreditCard,label:'Card'},{id:'mobile',icon:Smartphone,label:'Mobile'}].map(m => (<button key={m.id} onClick={() => setPaymentMethod(m.id)} className={cn('rounded-lg py-2.5 text-xs font-medium flex flex-col items-center gap-1', paymentMethod === m.id ? 'bg-rose-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20')}><m.icon className="h-4 w-4" />{m.label}</button>))}
                </div>
                {paymentMethod === 'cash' && <div><input type="number" placeholder="Cash received (EGP)" value={cashReceived} onChange={e => setCashReceived(e.target.value)} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white" />{Number(cashReceived) > 0 && <p className="text-xs text-emerald-400 mt-1">Change: {formatEGP(change)}</p>}</div>}
                <div className="grid grid-cols-2 gap-2"><button onClick={() => setShowPayment(false)} className="rounded-xl bg-white/10 py-3 text-sm font-medium hover:bg-white/20">Back</button><button onClick={processPayment} disabled={processing || (paymentMethod === 'cash' && Number(cashReceived) * 100 < total)} className="rounded-xl bg-emerald-500 py-3 text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">{processing ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <><Receipt className="h-4 w-4" />Complete</>}</button></div>
              </div>
            )}
          </div>
        )}
      </div>

      {showCustomerSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-white/10 p-5 shadow-2xl">
            <div className="flex justify-between mb-4"><h3 className="text-lg font-semibold text-white">Find Customer</h3><button onClick={() => setShowCustomerSearch(false)} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></button></div>
            <p className="text-sm text-white/40 mb-3">Customer lookup coming soon</p>
            <button onClick={() => setShowCustomerSearch(false)} className="w-full rounded-lg bg-white/10 py-2 text-sm hover:bg-white/20">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
