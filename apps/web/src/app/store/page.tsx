'use client';

import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Search, Sparkles, Plus, Minus, X, ArrowRight } from 'lucide-react';

interface Product {
  id: string; name: string; sku: string; base_price: number; cost_price: number;
  category_id: string; category_name?: string;
}
interface CartItem { product: Product; quantity: number; }
interface Category { id: string; name: string; }

function fmtEGP(piasters: number): string {
  const egp = Number(piasters) / 100;
  return isNaN(egp) ? 'EGP 0.00' : `EGP ${egp.toFixed(2)}`;
}

const GRADIENTS = [
  'from-rose-100 to-pink-50', 'from-violet-100 to-purple-50', 'from-blue-100 to-cyan-50',
  'from-emerald-100 to-teal-50', 'from-amber-100 to-yellow-50', 'from-indigo-100 to-sky-50',
];

const CITIES = [
  'Cairo', 'Alexandria', 'Giza', 'Sharm El-Sheikh', 'Hurghada', 'Luxor', 'Aswan',
  'Port Said', 'Suez', 'Mansoura', 'Tanta', 'Ismailia', 'Faiyum', 'Zagazig',
  'Damietta', 'Assiut', 'Minia', 'Beni Suef', 'Sohag', '6th of October City',
];

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [checkoutData, setCheckoutData] = useState({ name: '', phone: '', city: 'Cairo', address: '', payment: 'cod' });

  // Load data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Try with auth token from localStorage if available
        const token = (() => { try { const s = localStorage.getItem('brushia-auth'); return s ? JSON.parse(s)?.state?.accessToken : null; } catch { return null; } })();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        
        const [prodsRes, catsRes] = await Promise.all([
          fetch('/api/v1/catalog/products', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/v1/catalog/categories', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        if (cancelled) return;
        const prodList: Product[] = Array.isArray(prodsRes) ? prodsRes : prodsRes?.data ?? [];
        const catList: Category[] = Array.isArray(catsRes) ? catsRes : catsRes?.data ?? [];
        
        const enriched = prodList.map((p: any) => ({
          ...p,
          category_name: catList.find((c: any) => String(c.id) === String(p.category_id))?.name || 'Makeup',
        }));
        setProducts(enriched);
        setCategories(catList);
      } catch {
        // Silently fail — store just shows empty
      }
      if (!cancelled) setLoading(false);
    }
    load();
    // Load cart
    try { const s = localStorage.getItem('brushia-cart'); if (s) setCart(JSON.parse(s)); } catch {}
    return () => { cancelled = true; };
  }, []);

  // Save cart
  useEffect(() => { try { localStorage.setItem('brushia-cart', JSON.stringify(cart)); } catch {} }, [cart]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (selectedCategory !== 'all') list = list.filter(p => String(p.category_id) === selectedCategory);
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === 'price-asc') list.sort((a, b) => Number(a.base_price) - Number(b.base_price));
    else if (sortBy === 'price-desc') list.sort((a, b) => Number(b.base_price) - Number(a.base_price));
    else list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
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
    if (qty <= 0) setCart(prev => prev.filter(c => c.product.id !== id));
    else setCart(prev => prev.map(c => c.product.id === id ? { ...c, quantity: qty } : c));
  };

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const cartTotal = cart.reduce((s, c) => s + (Number(c.product.base_price) / 100) * c.quantity, 0);

  const placeOrder = async () => {
    setOrderPlaced(true);
    setCart([]);
    setShowCheckout(false);
    setShowCart(false);
    setTimeout(() => setOrderPlaced(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
            <button onClick={() => setShowCart(true)} className="relative p-2 hover:bg-white/10 rounded-xl transition">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center justify-center">{cartCount}</span>
              )}
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Discover Your Beauty ✨</h2>
          <p className="text-lg opacity-80 mb-8">Premium makeup & beauty tools — Made for Queens</p>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-gray-900 text-sm shadow-xl focus:ring-2 focus:ring-pink-300 outline-none"
              placeholder="Search products, lashes, brushes..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 -mt-5">
        <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-wrap items-center gap-2">
          <button onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${selectedCategory === 'all' ? 'bg-rose-500 text-white shadow' : 'bg-gray-100 hover:bg-gray-200'}`}>
            All Products
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setSelectedCategory(String(c.id))}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${selectedCategory === String(c.id) ? 'bg-rose-500 text-white shadow' : 'bg-gray-100 hover:bg-gray-200'}`}>
              {c.name}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-xs border rounded-lg px-2 py-1.5 text-gray-600">
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
            <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No products found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map(p => {
              const price = Number(p.base_price) / 100;
              const idx = parseInt(String(p.id).replace(/\D/g, '') || '0') % GRADIENTS.length;
              return (
                <div key={p.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`relative h-52 bg-gradient-to-br flex items-center justify-center ${GRADIENTS[idx]}`}>
                    <div className="text-center">
                      <Sparkles className="h-12 w-12 text-rose-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">{p.sku}</p>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button onClick={() => setQuickView(p)} className="bg-white text-gray-800 px-4 py-2 rounded-xl text-xs font-medium shadow-lg hover:bg-gray-50">
                        Quick View
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] text-rose-400 font-medium mb-1">{p.category_name}</p>
                    <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-rose-600">{fmtEGP(Number(p.base_price))}</span>
                      <button onClick={() => addToCart(p)} className="h-9 w-9 bg-rose-500 hover:bg-rose-600 text-white rounded-xl flex items-center justify-center transition shadow-lg shadow-rose-200">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Slider */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="w-[400px] bg-white h-full shadow-2xl flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Cart ({cartCount})</h3>
              <button onClick={() => setShowCart(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Your cart is empty</p>
                </div>
              ) : cart.map(item => {
                const price = Number(item.product.base_price) / 100;
                return (
                  <div key={item.product.id} className="flex items-center gap-3 py-3 border-b">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-rose-600 text-sm font-semibold">{fmtEGP(Number(item.product.base_price))}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="h-7 w-7 rounded-lg border flex items-center justify-center hover:bg-gray-50">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="h-7 w-7 rounded-lg border flex items-center justify-center hover:bg-gray-50">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t p-4">
              <div className="flex justify-between mb-3">
                <span className="font-medium">Total</span>
                <span className="font-bold text-lg text-rose-600">EGP {cartTotal.toFixed(2)}</span>
              </div>
              <button onClick={() => { setShowCheckout(true); setShowCart(false); }} disabled={cart.length === 0}
                className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                Checkout <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Checkout</h3>
            <div className="space-y-3">
              <input placeholder="Full Name" className="w-full px-4 py-2.5 border rounded-xl text-sm" value={checkoutData.name} onChange={e => setCheckoutData(p => ({ ...p, name: e.target.value }))} />
              <input placeholder="Phone (+20)" className="w-full px-4 py-2.5 border rounded-xl text-sm" value={checkoutData.phone} onChange={e => setCheckoutData(p => ({ ...p, phone: e.target.value }))} />
              <select className="w-full px-4 py-2.5 border rounded-xl text-sm" value={checkoutData.city} onChange={e => setCheckoutData(p => ({ ...p, city: e.target.value }))}>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea placeholder="Delivery Address" className="w-full px-4 py-2.5 border rounded-xl text-sm" rows={2} value={checkoutData.address} onChange={e => setCheckoutData(p => ({ ...p, address: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                {[{id: 'cod', label: 'Cash on Delivery', icon: '💵'}, {id: 'card', label: 'Card', icon: '💳'}, {id: 'vodafone_cash', label: 'Vodafone Cash', icon: '📱'}, {id: 'instapay', label: 'InstaPay', icon: '🏦'}].map(m => (
                  <button key={m.id} onClick={() => setCheckoutData(p => ({ ...p, payment: m.id }))}
                    className={`p-3 border rounded-xl text-xs font-medium flex items-center gap-2 transition ${checkoutData.payment === m.id ? 'border-rose-500 bg-rose-50 text-rose-700' : 'hover:bg-gray-50'}`}>
                    <span className="text-lg">{m.icon}</span> {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-xl">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>EGP {cartTotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm mt-1"><span>Shipping</span><span className="text-green-600">Free</span></div>
              <div className="flex justify-between font-bold mt-2 pt-2 border-t"><span>Total</span><span className="text-rose-600">EGP {cartTotal.toFixed(2)}</span></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowCheckout(false); setShowCart(true); }} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50">Back</button>
              <button onClick={placeOrder} className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg">Place Order</button>
            </div>
          </div>
        </div>
      )}

      {/* Quick View */}
      {quickView && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setQuickView(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg">{quickView.name}</h3>
              <button onClick={() => setQuickView(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-2">SKU: {quickView.sku}</p>
            <p className="text-sm text-rose-400 mb-2">{quickView.category_name}</p>
            <p className="text-2xl font-bold text-rose-600 mt-4">{fmtEGP(Number(quickView.base_price))}</p>
            <button onClick={() => { addToCart(quickView); setQuickView(null); }}
              className="w-full mt-4 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </button>
          </div>
        </div>
      )}

      {/* Order Placed */}
      {orderPlaced && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold mb-2">Order Placed!</h3>
            <p className="text-gray-500">Thank you for shopping with Brushia</p>
            <p className="text-sm text-gray-400 mt-2">We&apos;ll confirm your order via WhatsApp</p>
          </div>
        </div>
      )}

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
    </div>
  );
}
