'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api-client';
import { formatEGP, cn } from '@/lib/utils';
import {
  Printer, Search, X, Tag, Package, ScanBarcode, Plus, Minus,
  Settings2, RotateCcw, Eye,
} from 'lucide-react';

interface Product {
  id: string; name: string; name_ar?: string; sku?: string; barcode?: string;
  base_price: number; category_name?: string;
  variants?: { id: string; name: string; sku?: string; price?: number }[];
}

interface LabelItem {
  sku: string; name: string; price: number; quantity: number;
}

type LabelSize = 'small' | 'medium' | 'large';

const LABEL_SIZES: Record<LabelSize, { label: string; desc: string }> = {
  small: { label: '38x25mm', desc: 'Thermal small' },
  medium: { label: '58x40mm', desc: 'Standard thermal' },
  large: { label: '100x50mm', desc: 'Large label' },
};

function drawBarcode(canvas: HTMLCanvasElement, value: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  const chars = value.split('');
  const barW = Math.max(1, Math.floor(w / (chars.length * 9 + 20)));
  let x = barW * 5;
  chars.forEach(ch => {
    const bits = ch.charCodeAt(0).toString(2).padStart(8, '0');
    bits.split('').forEach(b => {
      ctx.fillStyle = b === '1' ? '#000' : '#fff';
      ctx.fillRect(x, 0, barW, h - 16);
      x += barW;
    });
    x += barW;
  });
  ctx.fillStyle = '#000';
  ctx.font = `${Math.max(9, h / 5)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(value, w / 2, h - 3);
}

export default function BarcodeLabelsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [labelItems, setLabelItems] = useState<LabelItem[]>([]);
  const [labelSize, setLabelSize] = useState<LabelSize>('medium');
  const [showPrice, setShowPrice] = useState(true);
  const [showName, setShowName] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [columns, setColumns] = useState(3);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await api.get<any>('/catalog/products?limit=200');
        setProducts(Array.isArray(p) ? p : p?.data ?? []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const filtered = products.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  const addItem = (p: Product, variant?: any) => {
    const sku = variant?.sku || p.sku || 'P-' + p.id.slice(0, 6);
    const name = variant?.name ? p.name + ' - ' + variant.name : p.name;
    const price = variant?.price ?? p.base_price;
    setLabelItems(prev => {
      const idx = prev.findIndex(i => i.sku === sku);
      if (idx >= 0) { const n = [...prev]; n[idx] = { ...n[idx], quantity: n[idx].quantity + 1 }; return n; }
      return [...prev, { sku, name, price, quantity: 1 }];
    });
  };

  const updateQty = (idx: number, delta: number) => {
    setLabelItems(prev => {
      const n = [...prev];
      const newQ = n[idx].quantity + delta;
      if (newQ <= 0) return n.filter((_, i) => i !== idx);
      n[idx] = { ...n[idx], quantity: newQ };
      return n;
    });
  };

  const totalLabels = labelItems.reduce((s, i) => s + i.quantity, 0);

  const handlePrint = () => {
    setShowPreview(true);
    setTimeout(() => {
      const el = printRef.current;
      if (!el) return;
      el.querySelectorAll('canvas[data-barcode]').forEach(c => {
        drawBarcode(c as HTMLCanvasElement, (c as HTMLCanvasElement).dataset.barcode || '');
      });
      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write('<html><head><title>Brushia Labels</title><style>@page{margin:5mm}body{margin:0;font-family:Arial,sans-serif}.grid{display:grid;grid-template-columns:repeat(' + columns + ',1fr);gap:2mm}.label{border:1px dashed #ccc;padding:3mm;text-align:center;page-break-inside:avoid}.label .name{font-size:9px;font-weight:bold;margin-bottom:2px}.label .price{font-size:11px;font-weight:bold;margin-top:2px}canvas{max-width:100%}</style></head><body><div class="grid">' + el.innerHTML + '</div></body></html>');
      win.document.close();
      setTimeout(() => { win.print(); win.close(); }, 500);
    }, 300);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="animate-spin w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <ScanBarcode className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Barcode Label Printer</h1>
              <p className="text-white/70 text-sm mt-1">Generate & print barcode labels for your products</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{totalLabels}</p>
              <p className="text-white/60 text-xs">Labels</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{labelItems.length}</p>
              <p className="text-white/60 text-xs">Products</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-violet-400" /> Select Products ({filtered.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-1">
              {filtered.map(p => {
                const inQueue = labelItems.some(i => i.sku === p.sku);
                return (
                  <div key={p.id} className="bg-gray-800 rounded-xl p-3 border border-gray-700 hover:border-violet-500/50 transition">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{p.name}</p>
                        <p className="text-gray-500 text-xs">{p.sku || 'No SKU'} &middot; {formatEGP(p.base_price / 100)}</p>
                      </div>
                      <button onClick={() => addItem(p)}
                        className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1',
                          inQueue ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-violet-500 hover:bg-violet-600 text-white')}>
                        <Plus className="w-3 h-3" /> {inQueue ? 'More' : 'Add'}
                      </button>
                    </div>
                    {p.variants && p.variants.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.variants.map((v: any) => (
                          <button key={v.id} onClick={() => addItem(p, v)}
                            className="text-[10px] bg-gray-700 hover:bg-violet-500/30 text-gray-300 hover:text-violet-300 px-2 py-0.5 rounded-md transition">
                            {v.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Settings + Queue */}
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-violet-400" /> Label Settings
            </h3>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Label Size</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(LABEL_SIZES) as LabelSize[]).map(s => (
                  <button key={s} onClick={() => setLabelSize(s)}
                    className={cn('py-2 rounded-lg text-xs font-medium border transition',
                      labelSize === s ? 'bg-violet-500/20 border-violet-500 text-violet-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600')}>
                    {LABEL_SIZES[s].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Columns per row</label>
              <div className="flex gap-2">
                {[2, 3, 4, 5].map(c => (
                  <button key={c} onClick={() => setColumns(c)}
                    className={cn('flex-1 py-2 rounded-lg text-xs font-medium border transition',
                      columns === c ? 'bg-violet-500/20 border-violet-500 text-violet-300' : 'bg-gray-800 border-gray-700 text-gray-400')}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Show product name</span>
              <button onClick={() => setShowName(!showName)}
                className={cn('w-10 h-6 rounded-full transition relative', showName ? 'bg-violet-500' : 'bg-gray-700')}>
                <div className={cn('w-4 h-4 bg-white rounded-full absolute top-1 transition-all', showName ? 'left-5' : 'left-1')} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Show price</span>
              <button onClick={() => setShowPrice(!showPrice)}
                className={cn('w-10 h-6 rounded-full transition relative', showPrice ? 'bg-violet-500' : 'bg-gray-700')}>
                <div className={cn('w-4 h-4 bg-white rounded-full absolute top-1 transition-all', showPrice ? 'left-5' : 'left-1')} />
              </button>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-violet-400" /> Print Queue ({totalLabels} labels)
            </h3>
            {labelItems.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">Add products to generate labels</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {labelItems.map((item, i) => (
                  <div key={item.sku + i} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white text-sm font-medium truncate flex-1 mr-2">{item.name}</p>
                      <button onClick={() => setLabelItems(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-gray-500 hover:text-red-400 transition"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs font-mono">{item.sku}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(i, -1)} className="w-6 h-6 bg-gray-700 rounded-md flex items-center justify-center text-gray-300 hover:bg-gray-600"><Minus className="w-3 h-3" /></button>
                        <span className="text-white text-sm font-bold min-w-[20px] text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(i, 1)} className="w-6 h-6 bg-violet-500/30 rounded-md flex items-center justify-center text-violet-300 hover:bg-violet-500/50"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowPreview(true)} disabled={labelItems.length === 0}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 transition border border-gray-700">
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button onClick={handlePrint} disabled={labelItems.length === 0}
              className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 transition shadow-lg hover:shadow-violet-500/25">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
          <button onClick={() => setLabelItems([])} disabled={labelItems.length === 0}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-400 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-40 transition">
            <RotateCcw className="w-3 h-3" /> Clear All
          </button>
        </div>
      </div>

      {/* Print Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-gray-900 font-bold text-lg">Print Preview - {totalLabels} Labels</h3>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="bg-violet-500 hover:bg-violet-600 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => setShowPreview(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="p-6" ref={printRef}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + columns + ', 1fr)', gap: '8px' }}>
                {labelItems.flatMap(item =>
                  Array.from({ length: item.quantity }, (_, qi) => (
                    <div key={item.sku + '-' + qi} style={{ border: '1px dashed #ccc', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                      {showName && <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>{item.name}</p>}
                      <canvas data-barcode={item.sku} width="200" height="50" style={{ maxWidth: '100%' }} />
                      {showPrice && <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#111', marginTop: '2px' }}>{formatEGP(item.price / 100)}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
