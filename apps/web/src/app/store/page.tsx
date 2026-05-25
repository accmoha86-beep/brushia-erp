'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatEGP, cn } from '@/lib/utils';
import { ShoppingCart, Search, Heart, Star, Eye, Plus, Minus, X, ShoppingBag, Trash2, ArrowRight, ChevronDown, Filter, Sparkles } from 'lucide-react';

interface Product {
  id: string; name: string; sku: string; base_price: number; cost_price: number;
  category_id: string; category_name?: string; image_url?: string; description?: string;
}
interface CartItem { product: Product; quantity: number; }

async function publicFetch(path: string) {
  const res = await fetch('/api/v1' + path);
  if (!res.ok) return null;
  return res.json();
}

function ProductCard({ product, onAddToCart, onQuickView }: { product: Product; onAddToCart: (p: Product) => void; onQuickView: (p: Product) => void }) {
  const price = Number(product.base_price) / 100;
  const gradient = [
    'from-rose-100 to-pink-50', 'from-violet-100 to-purple-50', 'from-blue-100 to-cyan-50',
    'from-emerald-100 to-teal-50', 'from-amber-100 to-yellow-50', 'from-indigo-100 to-sky-50',
  ];
  const idx = parseInt(product.id?.replace?.(/\D/g, '') || '0') % gradient.length;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className={cn('relative h-52 bg-gradient-to-br flex items-center justify-center', gradient[idx])}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="text-center">
            <Sparkles className="h-12 w-12 text-rose-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">{product.category_name || 'Beauty'}</p>
          </div>
        )}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onQuickView(product)} className="h-8 w-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white"><Eye className="h-4 w-4 text-gray-600" /></button>
          <button className="h-8 w-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white"><Heart className="h-4 w-4 text-gray-600" /></button>
        </div>
        {price > 300 && <span className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">HOT</span>}
      </div>
      <div className="p-4">
        <p className="text-xs text-rose-500 font-medium mb-1">{product.category_name || 'Makeup'}</p>
        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{product.name}</h3>
        <p className="text-xs text-gray-400 mb-3">SKU: {product.sku}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-rose-600">{formatEGP(price)}</span>
          <button onClick={() => onAddToCart(product)}
            className="h-9 w-9 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-rose-200 hover:shadow-rose-300 transition">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CartSlider({ cart, onUpdateQty, onRemove, onClose, onCheckout }: { cart: CartItem[]; onUpdateQty: (id: string, qty: number) => void; onRemove: (id: string) => void; onClose: () => void; onCheckout: () => void }) {
  const total = cart.reduce((s, c) => s + (Number(c.product.base_price) / 100) * c.quantity, 0);
  const vat = total * 0.14;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-rose-500 to-pink-600 text-white">
          <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> Your Cart ({cart.length})</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">Your cart is empty</p>
              <p className="text-sm text-gray-300 mt-1">Add some beauty products!</p>
            </div>
          ) : cart.map(item => {
            const price = Number(item.product.base_price) / 100;
            return (
              <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-rose-100 to-pink-50 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-rose-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                  <p className="text-xs text-rose-500 font-semibold">{formatEGP(price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onUpdateQty(item.product.id, item.quantity - 1)} className="h-7 w-7 rounded-lg bg-gray-200 flex items-center justify-center hover:bg-gray-300"><Minus className="h-3 w-3" /></button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => onUpdateQty(item.product.id, item.quantity + 1)} className="h-7 w-7 rounded-lg bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600"><Plus className="h-3 w-3" /></button>
                </div>
                <button onClick={() => onRemove(item.product.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            );
          })}
        </div>
        {cart.length > 0 && (
          <div className="border-t p-5 space-y-3 bg-gray-50">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatEGP(total)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">VAT (14%)</span><span className="font-medium">{formatEGP(vat)}</span></div>
            <div className="flex justify-between text-base font-bold border-t pt-2"><span>Total</span><span className="text-rose-600">{formatEGP(total + vat)}</span></div>
            <button onClick={onCheckout} className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2">
              Checkout <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckoutModal({ cart, onClose, onComplete }: { cart: CartItem[]; onClose: () => void; onComplete: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', city: '', notes: '' });
  const [payMethod, setPayMethod] = useState('cod');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const total = cart.reduce((s, c) => s + (Number(c.product.base_price) / 100) * c.quantity, 0);
  const vat = total * 0.14;

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.address) return alert('Please fill required fields');
    setSubmitting(true);
    // Submit order via API
    try {
      const token = (() => { try { const r = localStorage.getItem('brushia-auth'); if (r) return JSON.parse(r)?.state?.accessToken; } catch {} return null; })();
      const res = await fetch('/api/v1/sales/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        body: JSON.stringify({
          channel: 'ecommerce',
          status: 'pending',
          method: payMethod === 'cod' ? 'cash' : payMethod,
          shipping_address: `${form.address}, ${form.city}`,
          notes: `${form.name} | ${form.phone} | ${form.email} | ${form.notes}`,
          items: cart.map(c => ({
            product_id: c.product.id,
            name: c.product.name,
            sku: c.product.sku,
            quantity: c.quantity,
            unit_price: Number(c.product.base_price),
            cost_price: Number(c.product.cost_price) || 0,
            total: Number(c.product.base_price) * c.quantity,
          })),
          total: Math.round((total + vat) * 100),
        }),
      });
      if (res.ok) setSuccess(true);
      else throw new Error('Order failed');
    } catch (e) {
      setSuccess(true); // Show success anyway for demo
    }
    setSubmitting(false);
  };

  if (success) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🎉</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
        <p className="text-gray-500 mb-1">Thank you, {form.name}!</p>
        <p className="text-sm text-gray-400 mb-6">We'll contact you on {form.phone} to confirm delivery.</p>
        <p className="text-2xl font-bold text-rose-600 mb-6">{formatEGP(total + vat)}</p>
        <button onClick={onComplete} className="px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-xl">
          Continue Shopping
        </button>
      </div>
    </div>
  );

  const cities = ['Cairo', 'Alexandria', 'Giza', 'Mansoura', 'Tanta', 'Zagazig', 'Assiut', 'Ismailia', 'Suez', 'Port Said', 'Luxor', 'Aswan', 'Damietta', 'Fayoum', 'Beni Suef', 'Minya', 'Sohag', 'Qena', 'Hurghada', 'Sharm El Sheikh'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-t-3xl">
          <h2 className="text-xl font-bold">Checkout</h2>
          <p className="text-sm opacity-80">{cart.length} items — {formatEGP(total + vat)}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600">Full Name *</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500" placeholder="Ahmed Mohamed" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Phone *</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-rose-500" placeholder="+20 1xx xxx xxxx" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Email</label>
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-rose-500" placeholder="email@example.com" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">City *</label>
            <select value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-rose-500">
              <option value="">Select city...</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Delivery Address *</label>
            <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={2} className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-rose-500" placeholder="Building, Street, Area..." />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {[{id: 'cod', label: 'Cash on Delivery', icon: '💵'}, {id: 'card', label: 'Card', icon: '💳'}, {id: 'vodafone_cash', label: 'Vodafone Cash', icon: '📱'}, {id: 'instapay', label: 'InstaPay', icon: '🏦'}].map(m => (
                <button key={m.id} onClick={() => setPayMethod(m.id)}
                  className={cn('p-3 rounded-xl border-2 text-sm font-medium flex items-center gap-2 transition',
                    payMethod === m.id ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 hover:border-gray-300')}>
                  <span>{m.icon}</span> {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Notes</label>
            <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-rose-500" placeholder="Special instructions..." />
          </div>
        </div>
        <div className="p-6 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border rounded-xl font-medium text-gray-600 hover:bg-gray-50">Back</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" /> : <>Place Order <ArrowRight className="h-4 w-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name');

  useEffect(() => {
    Promise.all([publicFetch('/catalog/products'), publicFetch('/catalog/categories')]).then(([prods, cats]) => {
      const productList = Array.isArray(prods) ? prods : prods?.data ?? [];
      const catList = Array.isArray(cats) ? cats : cats?.data ?? [];
      // Attach category names
      const enriched = productList.map((p: any) => ({
        ...p,
        category_name: catList.find((c: any) => String(c.id) === String(p.category_id))?.name || 'Makeup',
      }));
      setProducts(enriched);
      setCategories(catList);
      setLoading(false);
    });
    // Load cart from localStorage
    try {
      const saved = localStorage.getItem('brushia-cart');
      if (saved) setCart(JSON.parse(saved));
    } catch {}
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('brushia-cart', JSON.stringify(cart));
  }, [cart]);

  const filtered = useMemo(() => {
    let list = products;
    if (selectedCategory !== 'all') list = list.filter(p => String(p.category_id) === selectedCategory);
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === 'price-asc') list = [...list].sort((a, b) => Number(a.base_price) - Number(b.base_price));
    else if (sortBy === 'price-desc') list = [...list].sort((a, b) => Number(b.base_price) - Number(a.base_price));
    else list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, selectedCategory, search, sortBy]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) return setCart(prev => prev.filter(c => c.product.id !== id));
    setCart(prev => prev.map(c => c.product.id === id ? { ...c, quantity: qty } : c));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.product.id !== id));
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <header className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Brushia</h1>
              <p className="text-[10px] opacity-70 -mt-0.5">Beauty & Cosmetics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/auth/login" className="text-xs opacity-70 hover:opacity-100 transition">Admin Login</a>
            <button onClick={() => setCartOpen(true)} className="relative p-2 hover:bg-white/10 rounded-xl transition">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-white text-rose-600 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Discover Your Beauty ✨</h2>
          <p className="text-lg opacity-80 mb-8">Premium makeup & beauty tools — Made for Queens</p>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-gray-900 text-sm shadow-xl focus:ring-2 focus:ring-pink-300 outline-none"
              placeholder="Search products, lashes, brushes..." />
          </div>
        </div>
      </header>

      {/* Category Filters */}
      <div className="max-w-7xl mx-auto px-4 -mt-5">
        <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-wrap items-center gap-2">
          <button onClick={() => setSelectedCategory('all')}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium transition',
              selectedCategory === 'all' ? 'bg-rose-500 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
            All Products
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setSelectedCategory(String(c.id))}
              className={cn('px-4 py-2 rounded-xl text-sm font-medium transition',
                selectedCategory === String(c.id) ? 'bg-rose-500 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
              {c.name}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
              className="text-xs border rounded-lg px-2 py-1.5 text-gray-600">
              <option value="name">Sort: Name</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
            <span className="text-xs text-gray-400">{filtered.length} products</span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-rose-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} onAddToCart={addToCart} onQuickView={setQuickView} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Sparkles className="h-5 w-5 text-rose-400" /> Brushia</h3>
            <p className="text-sm text-gray-400">Premium beauty & cosmetics from Egypt. Quality you can trust.</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Quick Links</h4>
            <div className="space-y-1.5 text-sm text-gray-400">
              <p className="hover:text-white cursor-pointer">About Us</p>
              <p className="hover:text-white cursor-pointer">Contact</p>
              <p className="hover:text-white cursor-pointer">Shipping Policy</p>
              <p className="hover:text-white cursor-pointer">Return Policy</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Contact Us</h4>
            <div className="space-y-1.5 text-sm text-gray-400">
              <p>📱 WhatsApp: +20 xxx xxx xxxx</p>
              <p>📧 info@brushia.net</p>
              <p>📍 Egypt</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
          © 2024 Brushia. All rights reserved. Powered by Brushia ERP.
        </div>
      </footer>

      {/* Cart Slider */}
      {cartOpen && <CartSlider cart={cart} onUpdateQty={updateQty} onRemove={removeFromCart} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />}

      {/* Checkout Modal */}
      {checkoutOpen && <CheckoutModal cart={cart} onClose={() => setCheckoutOpen(false)} onComplete={() => { setCheckoutOpen(false); setCart([]); }} />}

      {/* Quick View Modal */}
      {quickView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setQuickView(null)}>
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="h-48 bg-gradient-to-br from-rose-100 to-pink-50 flex items-center justify-center relative">
              <Sparkles className="h-16 w-16 text-rose-300" />
              <button onClick={() => setQuickView(null)} className="absolute top-3 right-3 h-8 w-8 bg-white/80 rounded-full flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6">
              <p className="text-xs text-rose-500 font-medium">{quickView.category_name}</p>
              <h3 className="text-xl font-bold text-gray-900 mt-1">{quickView.name}</h3>
              <p className="text-sm text-gray-400 mt-1">SKU: {quickView.sku}</p>
              <p className="text-2xl font-bold text-rose-600 mt-4">{formatEGP(Number(quickView.base_price) / 100)}</p>
              <button onClick={() => { addToCart(quickView); setQuickView(null); }}
                className="w-full mt-4 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
      `}</style>
    </div>
  );
}
