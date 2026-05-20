'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatEGP, cn } from '@/lib/utils';
import { ArrowLeft, Search, Plus, Minus, CreditCard, Banknote, User, X, ShoppingCart, Receipt, Check } from 'lucide-react';

interface POSProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string;
  stock: number;
}

interface CartItem {
  product: POSProduct;
  quantity: number;
}

const categories = [
  { id: 'all', name: 'All', emoji: '🛍️', color: 'from-gray-600 to-gray-700' },
  { id: 'makeup', name: 'Makeup', emoji: '💄', color: 'from-rose-500 to-pink-500' },
  { id: 'lashes', name: 'Lashes', emoji: '👁️', color: 'from-purple-500 to-violet-500' },
  { id: 'concealer', name: 'Concealer', emoji: '✨', color: 'from-amber-500 to-orange-500' },
  { id: 'brushes', name: 'Brushes', emoji: '🖌️', color: 'from-blue-500 to-cyan-500' },
  { id: 'brush-sets', name: 'Sets', emoji: '🎨', color: 'from-emerald-500 to-teal-500' },
  { id: 'lip', name: 'Lips', emoji: '💋', color: 'from-red-500 to-rose-500' },
];

const products: POSProduct[] = [
  { id: '1', name: 'Matte Foundation - Light', sku: 'BRS-FND-001', price: 35000, category: 'makeup', stock: 145 },
  { id: '2', name: 'Matte Foundation - Medium', sku: 'BRS-FND-002', price: 35000, category: 'makeup', stock: 132 },
  { id: '3', name: 'Matte Foundation - Dark', sku: 'BRS-FND-003', price: 35000, category: 'makeup', stock: 89 },
  { id: '4', name: 'Full Coverage Concealer', sku: 'BRS-CON-001', price: 25000, category: 'concealer', stock: 210 },
  { id: '5', name: 'Under Eye Concealer', sku: 'BRS-CON-002', price: 22000, category: 'concealer', stock: 178 },
  { id: '6', name: 'Setting Powder', sku: 'BRS-PWD-001', price: 28000, category: 'makeup', stock: 5 },
  { id: '7', name: 'Mink Lashes - Natural', sku: 'BRS-LSH-001', price: 15000, category: 'lashes', stock: 320 },
  { id: '8', name: 'Mink Lashes - Dramatic', sku: 'BRS-LSH-002', price: 18000, category: 'lashes', stock: 3 },
  { id: '9', name: 'Faux Mink - Everyday', sku: 'BRS-LSH-003', price: 12000, category: 'lashes', stock: 245 },
  { id: '10', name: 'Magnetic Lashes - Glamour', sku: 'BRS-LSH-004', price: 22000, category: 'lashes', stock: 67 },
  { id: '11', name: 'Foundation Brush', sku: 'BRS-BRU-001', price: 12000, category: 'brushes', stock: 89 },
  { id: '12', name: 'Contour Brush', sku: 'BRS-BRU-002', price: 10000, category: 'brushes', stock: 4 },
  { id: '13', name: 'Powder Brush', sku: 'BRS-BRU-003', price: 11000, category: 'brushes', stock: 52 },
  { id: '14', name: 'Blending Brush', sku: 'BRS-BRU-004', price: 9500, category: 'brushes', stock: 78 },
  { id: '15', name: 'Essential Set (8pc)', sku: 'BRS-SET-001', price: 45000, category: 'brush-sets', stock: 34 },
  { id: '16', name: 'Pro Set (12pc)', sku: 'BRS-SET-002', price: 75000, category: 'brush-sets', stock: 22 },
  { id: '17', name: 'Lipstick - Ruby Red', sku: 'BRS-LIP-001', price: 19000, category: 'lip', stock: 156 },
  { id: '18', name: 'Lipstick - Nude Pink', sku: 'BRS-LIP-002', price: 19000, category: 'lip', stock: 134 },
  { id: '19', name: 'Lip Gloss - Clear Shine', sku: 'BRS-LIP-003', price: 15000, category: 'lip', stock: 8 },
  { id: '20', name: 'Lip Liner - Deep Rose', sku: 'BRS-LIP-004', price: 12000, category: 'lip', stock: 198 },
  { id: '21', name: 'Eyeshadow - Desert Rose', sku: 'BRS-EYE-001', price: 42000, category: 'makeup', stock: 45 },
  { id: '22', name: 'Mascara - Volume Max', sku: 'BRS-EYE-002', price: 18000, category: 'makeup', stock: 167 },
  { id: '23', name: 'Eyeliner - Jet Black', sku: 'BRS-EYE-003', price: 14000, category: 'makeup', stock: 203 },
  { id: '24', name: 'Makeup Remover', sku: 'BRS-SKN-001', price: 16000, category: 'makeup', stock: 92 },
];

const VAT_RATE = 0.14;

export default function POSPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, search]);

  const addToCart = (product: POSProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock) return item;
          return { ...item, quantity: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePayment = (method: string) => {
    setPaymentComplete(true);
    setTimeout(() => {
      setPaymentComplete(false);
      setShowPayment(false);
      setCart([]);
      setCustomerName('');
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Side — Products */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between bg-gray-900 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </button>
            <div className="h-5 w-px bg-gray-700" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-purple-600">
                <span className="text-xs font-bold text-white">B</span>
              </div>
              <span className="text-sm font-semibold text-white">Brushia POS</span>
            </div>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto bg-white border-b border-gray-200 px-4 py-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all',
                selectedCategory === cat.id
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-md`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <span className="text-lg">{cat.emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredProducts.map((product) => {
              const inCart = cart.find((c) => c.product.id === product.id);
              const isLowStock = product.stock <= 5;
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  className={cn(
                    'relative flex flex-col rounded-xl border bg-white p-3 text-left shadow-sm transition-all hover:shadow-md hover:border-rose-300 active:scale-[0.98]',
                    inCart ? 'border-rose-500 ring-1 ring-rose-500/30' : 'border-gray-200',
                    product.stock === 0 && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {/* Product icon placeholder */}
                  <div className="flex h-16 w-full items-center justify-center rounded-lg bg-gradient-to-br from-rose-50 to-purple-50 mb-2">
                    <span className="text-2xl">
                      {product.category === 'lashes' ? '👁️' : product.category === 'lip' ? '💋' : product.category === 'brushes' || product.category === 'brush-sets' ? '🖌️' : product.category === 'concealer' ? '✨' : '💄'}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-900 leading-tight line-clamp-2">{product.name}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{product.sku}</p>
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">{formatEGP(product.price)}</span>
                    {isLowStock && (
                      <span className="text-[10px] font-medium text-red-500">{product.stock} left</span>
                    )}
                  </div>
                  {inCart && (
                    <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white shadow-md">
                      {inCart.quantity}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Side — Cart */}
      <div className="w-96 flex flex-col bg-white border-l border-gray-200 shadow-xl">
        {/* Cart header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-gray-700" />
            <h2 className="font-semibold text-gray-900">Cart</h2>
            {itemCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-red-500 hover:text-red-600 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Customer */}
        <div className="border-b border-gray-200 px-5 py-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Walk-in Customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Receipt className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">Cart is empty</p>
              <p className="text-xs mt-1">Tap products to add them</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-500">{formatEGP(item.product.price)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-right w-20">
                    <p className="text-sm font-semibold text-gray-900">{formatEGP(item.product.price * item.quantity)}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Payment */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-4 space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({itemCount} items)</span>
                <span>{formatEGP(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>VAT (14%)</span>
                <span>{formatEGP(vat)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-rose-600">{formatEGP(total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowPayment(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                <Banknote className="h-4 w-4" />
                Cash
              </button>
              <button
                onClick={() => setShowPayment(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 py-3 text-sm font-semibold text-white hover:from-rose-600 hover:to-purple-700 transition-colors"
              >
                <CreditCard className="h-4 w-4" />
                Card
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            {paymentComplete ? (
              <div className="text-center py-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                  <Check className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Payment Complete!</h3>
                <p className="text-sm text-gray-500 mt-2">Transaction processed successfully</p>
                <p className="text-2xl font-bold text-emerald-600 mt-3">{formatEGP(total)}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Complete Payment</h3>
                  <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                </div>
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500">Amount Due</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{formatEGP(total)}</p>
                  <p className="text-xs text-gray-400 mt-1">{customerName || 'Walk-in Customer'} · {itemCount} items</p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => handlePayment('cash')}
                    className="w-full flex items-center justify-center gap-3 rounded-xl bg-emerald-600 py-4 text-base font-semibold text-white hover:bg-emerald-700"
                  >
                    <Banknote className="h-5 w-5" />
                    Pay with Cash
                  </button>
                  <button
                    onClick={() => handlePayment('card')}
                    className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 py-4 text-base font-semibold text-white hover:from-rose-600 hover:to-purple-700"
                  >
                    <CreditCard className="h-5 w-5" />
                    Pay with Card
                  </button>
                  <button
                    onClick={() => handlePayment('split')}
                    className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-gray-300 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Split Payment
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
