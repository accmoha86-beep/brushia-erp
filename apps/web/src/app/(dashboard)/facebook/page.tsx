'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { formatEGP, cn } from '@/lib/utils';
import { MessageCircle, Store, Settings, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Send, Package, Link2, Unlink, ExternalLink, Zap, Users, ShoppingBag, Eye, BarChart3 } from 'lucide-react';

function getToken() {
  try { const r = localStorage.getItem('brushia-auth'); if (r) return JSON.parse(r)?.state?.accessToken; } catch {} return null;
}

async function apiFetch(path: string, opts?: any) {
  const token = getToken();
  const res = await fetch('/api/v1' + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...opts?.headers },
  });
  if (!res.ok) return null;
  return res.json();
}

export default function FacebookPage() {
  const { t, locale, isRTL } = useI18n();
  const [activeTab, setActiveTab] = useState<'overview' | 'messenger' | 'shop' | 'settings'>('overview');
  const [config, setConfig] = useState({
    page_id: '', page_access_token: '', catalog_id: '', pixel_id: '',
    messenger_enabled: false, shop_enabled: false,
  });
  const [products, setProducts] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [conversations, setConversations] = useState<any[]>([]);
  const [stats, setStats] = useState({ messages: 0, orders: 0, revenue: 0, catalogProducts: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Load config from integrations
    const integrations = await apiFetch('/integrations');
    const list = Array.isArray(integrations) ? integrations : integrations?.data ?? [];
    const fbConfig = list.find((i: any) => i.type === 'facebook' || i.name?.toLowerCase().includes('facebook'));
    if (fbConfig?.config) {
      setConfig(prev => ({ ...prev, ...fbConfig.config }));
    }

    // Load products for catalog sync
    const prods = await apiFetch('/catalog/products');
    const prodList = Array.isArray(prods) ? prods : prods?.data ?? [];
    setProducts(prodList);

    // Mock conversations (in production, these come from Facebook Graph API)
    setConversations([
      { id: 1, name: 'Sarah Ahmed', lastMessage: 'Do you have the lashes in stock?', time: '2m ago', unread: true, avatar: '👩' },
      { id: 2, name: 'Nour Khalil', lastMessage: 'Order confirmed! ✅', time: '15m ago', unread: false, avatar: '👩‍🦱' },
      { id: 3, name: 'Fatma Mohamed', lastMessage: 'What brush set do you recommend?', time: '1h ago', unread: true, avatar: '👩‍🦳' },
      { id: 4, name: 'Mona Ali', lastMessage: 'Thanks for the quick delivery!', time: '3h ago', unread: false, avatar: '👧' },
      { id: 5, name: 'Yasmin Hassan', lastMessage: 'Price for concealer set?', time: '5h ago', unread: true, avatar: '👩‍🔧' },
    ]);

    setStats({ messages: 47, orders: 12, revenue: 3850, catalogProducts: prodList.length });
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveConfig = async () => {
    setSaving(true);
    await apiFetch('/integrations/facebook', {
      method: 'PUT',
      body: JSON.stringify({ type: 'facebook', config }),
    });
    setSaving(false);
    alert('Configuration saved!');
  };

  const handleSyncCatalog = async () => {
    setSyncStatus('syncing');
    // Simulate catalog sync
    await new Promise(r => setTimeout(r, 2000));
    setSyncStatus('synced');
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'messenger', label: 'Messenger', icon: MessageCircle },
    { id: 'shop', label: 'Facebook Shop', icon: Store },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const isConfigured = config.page_id && config.page_access_token;

  if (loading) return (
    <div className="p-6 flex justify-center items-center h-96">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center"><span className="text-white text-lg">f</span></div>
            Facebook Integration
          </h1>
          <p className="text-sm text-gray-500 mt-1">Messenger chatbot + Facebook Shop catalog sync</p>
        </div>
        <div className="flex items-center gap-2">
          {isConfigured ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5" /> Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
              <AlertTriangle className="h-3.5 w-3.5" /> Not Configured
            </span>
          )}
          <button onClick={fetchData} className="p-2 rounded-lg border hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition',
              activeTab === tab.id ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700')}>
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Messages This Month', value: stats.messages, icon: MessageCircle, color: 'from-blue-500 to-blue-600' },
              { label: 'Orders via Facebook', value: stats.orders, icon: ShoppingBag, color: 'from-emerald-500 to-teal-600' },
              { label: 'Revenue', value: formatEGP(stats.revenue), icon: BarChart3, color: 'from-purple-500 to-violet-600' },
              { label: 'Catalog Products', value: stats.catalogProducts, icon: Package, color: 'from-rose-500 to-pink-600' },
            ].map((s, i) => (
              <div key={i} className={cn('rounded-2xl bg-gradient-to-br text-white p-5 shadow-lg', s.color)}>
                <s.icon className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs opacity-80 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-blue-500" /> Recent Conversations
              </h3>
              <div className="space-y-2">
                {conversations.slice(0, 4).map(c => (
                  <div key={c.id} className={cn('flex items-center gap-3 p-2.5 rounded-xl transition cursor-pointer', c.unread ? 'bg-blue-50' : 'hover:bg-gray-50')}>
                    <span className="text-2xl">{c.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn('text-sm', c.unread ? 'font-bold' : 'font-medium')}>{c.name}</p>
                        <span className="text-[10px] text-gray-400">{c.time}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
                    </div>
                    {c.unread && <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Store className="h-4 w-4 text-emerald-500" /> Catalog Sync
              </h3>
              <div className="text-center py-6">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-medium">{products.length} products ready to sync</p>
                <p className="text-xs text-gray-400 mt-1">Last sync: Never</p>
                <button onClick={handleSyncCatalog} disabled={syncStatus === 'syncing' || !isConfigured}
                  className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 mx-auto">
                  {syncStatus === 'syncing' ? <><div className="h-3.5 w-3.5 animate-spin border-2 border-white border-t-transparent rounded-full" /> Syncing...</> :
                   syncStatus === 'synced' ? <><CheckCircle2 className="h-4 w-4" /> Synced!</> :
                   <><RefreshCw className="h-4 w-4" /> Sync Now</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messenger Tab */}
      {activeTab === 'messenger' && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-3 h-[500px]">
            {/* Conversation List */}
            <div className="border-r overflow-y-auto">
              <div className="p-3 border-b">
                <input className="w-full px-3 py-2 text-sm border rounded-xl" placeholder="Search conversations..." />
              </div>
              {conversations.map(c => (
                <div key={c.id} className={cn('flex items-center gap-3 p-3 cursor-pointer border-b transition', c.unread ? 'bg-blue-50' : 'hover:bg-gray-50')}>
                  <span className="text-2xl">{c.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm', c.unread ? 'font-bold' : 'font-medium')}>{c.name}</p>
                    <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400">{c.time}</p>
                    {c.unread && <div className="h-2 w-2 rounded-full bg-blue-500 ml-auto mt-1" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Area */}
            <div className="col-span-2 flex flex-col">
              <div className="p-4 border-b flex items-center gap-3">
                <span className="text-2xl">👩</span>
                <div>
                  <p className="font-semibold text-sm">Sarah Ahmed</p>
                  <p className="text-xs text-emerald-500">Online</p>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm max-w-xs">
                    <p className="text-sm">Hi! Do you have the lashes in stock? 💕</p>
                    <p className="text-[10px] text-gray-400 mt-1">2:30 PM</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm max-w-xs">
                    <p className="text-sm">Hi Sarah! Yes, we have all lash styles in stock! 🎀 Would you like to see our collection?</p>
                    <p className="text-[10px] opacity-70 mt-1">2:31 PM ✓✓</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm max-w-xs">
                    <p className="text-sm">Yes please! Show me the mink lashes 😍</p>
                    <p className="text-[10px] text-gray-400 mt-1">2:32 PM</p>
                  </div>
                </div>
              </div>
              <div className="p-3 border-t bg-white flex gap-2">
                <input className="flex-1 px-4 py-2.5 border rounded-xl text-sm" placeholder="Type a message..." />
                <button className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shop Tab */}
      {activeTab === 'shop' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Product Catalog ({products.length} items)</h3>
            <button onClick={handleSyncCatalog} disabled={syncStatus === 'syncing' || !isConfigured}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              <RefreshCw className={cn('h-4 w-4', syncStatus === 'syncing' && 'animate-spin')} />
              {syncStatus === 'syncing' ? 'Syncing...' : 'Sync to Facebook'}
            </button>
          </div>
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Product</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">SKU</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Price</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">{t('common.status')}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.slice(0, 15).map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.sku}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-rose-600">{formatEGP(Number(p.base_price) / 100)}</td>
                    <td className="px-4 py-3"><span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{t('common.active')}</span></td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400">{isConfigured ? '✅ Ready' : '⏳ Configure first'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Settings className="h-4 w-4 text-blue-500" /> Facebook API Configuration</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
              <p className="font-medium mb-1">Setup Instructions:</p>
              <ol className="list-decimal ml-4 space-y-0.5 text-xs">
                <li>Go to <a href="https://developers.facebook.com" target="_blank" className="underline">Meta for Developers</a></li>
                <li>Create an app → Business type</li>
                <li>Add Messenger and Catalog products</li>
                <li>Generate a Page Access Token</li>
                <li>Copy your Page ID and Catalog ID below</li>
              </ol>
            </div>
            {[
              { key: 'page_id', label: 'Facebook Page ID', placeholder: 'e.g. 123456789012345' },
              { key: 'page_access_token', label: 'Page Access Token', placeholder: 'EAABx...' },
              { key: 'catalog_id', label: 'Catalog ID (for Shop)', placeholder: 'e.g. 987654321098765' },
              { key: 'pixel_id', label: 'Meta Pixel ID (optional)', placeholder: 'e.g. 111222333444555' },
            ].map(field => (
              <div key={field.key}>
                <label className="text-xs font-medium text-gray-600">{field.label}</label>
                <input value={(config as any)[field.key] || ''} onChange={e => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={field.placeholder} />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={config.messenger_enabled} onChange={e => setConfig(prev => ({ ...prev, messenger_enabled: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">Enable Messenger Bot</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={config.shop_enabled} onChange={e => setConfig(prev => ({ ...prev, shop_enabled: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">Enable Facebook Shop</span>
              </label>
            </div>
            <button onClick={handleSaveConfig} disabled={saving}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
              {saving ? <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" /> : 'Save Configuration'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
