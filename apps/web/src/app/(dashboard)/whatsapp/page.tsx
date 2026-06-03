'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  MessageCircle, Search, Send, Plus, X, Phone, User, Clock, ShoppingCart,
  TrendingUp, MessageSquare, ArrowRightLeft, ChevronRight, Bot, Zap,
  Bell, BarChart3, Settings, Hash, Tag, CheckCircle2, XCircle,
  RefreshCw, Eye, Edit2, Trash2, ToggleLeft, ToggleRight,
  AlertCircle, Package, Megaphone, Copy, Filter,
} from 'lucide-react';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface Conversation {
  id: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  priority: string;
  last_message_at: string;
  assigned_to: string;
  message_count: number;
  unread_count: number;
  bot_enabled: boolean;
  bot_state: string;
  tags: string[];
  source: string;
  created_at: string;
  messages?: Message[];
}

interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  message_type: string;
  created_at: string;
  read_at: string | null;
  sent_by: string | null;
}

interface BotFlow {
  id: string;
  name: string;
  trigger_keywords: string[];
  response_type: string;
  response_content: string;
  is_active: boolean;
  sort_order: number;
}

interface QuickReply {
  id: string;
  shortcut: string;
  title: string;
  content: string;
  category: string;
  is_active: boolean;
  usage_count: number;
}

interface NotifTemplate {
  id: string;
  name: string;
  template_type: string;
  content: string;
  variables: string[];
  is_active: boolean;
  send_count: number;
}

interface WAOrder {
  id: string;
  order_number: string;
  customer_phone: string;
  customer_name: string;
  items: any[];
  subtotal: number;
  total: number;
  status: string;
  sales_order_id: string | null;
  created_at: string;
}

interface Stats {
  total_conversations: number;
  open_conversations: number;
  converted_conversations: number;
  closed_conversations: number;
  conversion_rate: number;
  recent_activity: { messages_24h: number; active_conversations_24h: number };
  messages: { total: number; inbound: number; outbound: number };
  active_bot_flows: number;
  active_templates: number;
}

type TabKey = 'conversations' | 'orders' | 'bot-flows' | 'templates' | 'analytics' | 'settings';

// ═══════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════

export default function WhatsAppPage() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  const [activeTab, setActiveTab] = useState<TabKey>('conversations');
  const [stats, setStats] = useState<Stats | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{ configured: boolean; status: string } | null>(null);

  useEffect(() => {
    loadStats();
    loadConnectionStatus();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.get<Stats>('/whatsapp/stats');
      setStats(data);
    } catch { }
  };

  const loadConnectionStatus = async () => {
    try {
      const data = await api.get<any>('/whatsapp/connection-status');
      setConnectionStatus(data);
    } catch { }
  };

  const tabs: { key: TabKey; label: string; icon: any; count?: number }[] = [
    { key: 'conversations', label: isRTL ? 'المحادثات' : 'Conversations', icon: MessageCircle, count: stats?.open_conversations },
    { key: 'orders', label: isRTL ? 'الطلبات' : 'Orders', icon: ShoppingCart },
    { key: 'bot-flows', label: isRTL ? 'تدفقات البوت' : 'Bot Flows', icon: Bot, count: stats?.active_bot_flows },
    { key: 'templates', label: isRTL ? 'القوالب' : 'Templates', icon: Bell, count: stats?.active_templates },
    { key: 'analytics', label: isRTL ? 'التحليلات' : 'Analytics', icon: BarChart3 },
    { key: 'settings', label: isRTL ? 'الإعدادات' : 'Settings', icon: Settings },
  ];

  return (
    <div className={cn('min-h-screen bg-gray-50 p-4 md:p-6', isRTL && 'rtl')}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500 text-white">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isRTL ? 'واتساب' : 'WhatsApp Hub'}
            </h1>
            <p className="text-sm text-gray-500">
              {isRTL ? 'إدارة المحادثات والطلبات والبوت' : 'Manage conversations, orders & bot'}
            </p>
          </div>
          <div className={cn('ml-auto flex items-center gap-2', isRTL && 'mr-auto ml-0')}>
            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
              connectionStatus?.configured
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            )}>
              <span className={cn('h-2 w-2 rounded-full', connectionStatus?.configured ? 'bg-green-500' : 'bg-yellow-500')} />
              {connectionStatus?.configured
                ? (isRTL ? 'متصل' : 'Connected')
                : (isRTL ? 'غير مهيأ' : 'Not Configured')
              }
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
            {[
              { label: isRTL ? 'محادثات مفتوحة' : 'Open', value: stats.open_conversations, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: isRTL ? 'تم التحويل' : 'Converted', value: stats.converted_conversations, color: 'text-green-600', bg: 'bg-green-50' },
              { label: isRTL ? 'رسائل ٢٤ ساعة' : 'Messages 24h', value: stats.recent_activity?.messages_24h || 0, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: isRTL ? 'معدل التحويل' : 'Conv. Rate', value: `${Number(stats.conversion_rate || 0).toFixed(1)}%`, color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: isRTL ? 'إجمالي الرسائل' : 'Total Messages', value: stats.messages?.total || 0, color: 'text-gray-600', bg: 'bg-gray-50' },
            ].map((s, i) => (
              <div key={i} className={cn('rounded-xl p-3 border', s.bg)}>
                <div className={cn('text-xl font-bold', s.color)}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto border-b border-gray-200 pb-px">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors border-b-2',
              activeTab === tab.key
                ? 'border-green-500 text-green-700 bg-green-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'conversations' && <ConversationsTab isRTL={isRTL} onRefresh={loadStats} />}
      {activeTab === 'orders' && <OrdersTab isRTL={isRTL} />}
      {activeTab === 'bot-flows' && <BotFlowsTab isRTL={isRTL} />}
      {activeTab === 'templates' && <TemplatesTab isRTL={isRTL} />}
      {activeTab === 'analytics' && <AnalyticsTab isRTL={isRTL} stats={stats} />}
      {activeTab === 'settings' && <SettingsTab isRTL={isRTL} connectionStatus={connectionStatus} />}
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB: CONVERSATIONS
// ═══════════════════════════════════════════

function ConversationsTab({ isRTL, onRefresh }: { isRTL: boolean; onRefresh: () => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewConvo, setShowNewConvo] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await api.get<any>('/whatsapp/conversations', params);
      setConversations(data.data || []);
    } catch { } finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    api.get<QuickReply[]>('/whatsapp/quick-replies').then(setQuickReplies).catch(() => {});
  }, []);

  const selectConversation = async (convo: Conversation) => {
    setSelectedConvo(convo);
    try {
      const data = await api.get<any>(`/whatsapp/conversations/${convo.id}`);
      setMessages(data.messages || []);
      // Mark as read
      try { await api.post(`/whatsapp/conversations/${convo.id}/messages/read`); } catch {}
    } catch { }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-refresh messages every 10s
  useEffect(() => {
    if (!selectedConvo) return;
    const interval = setInterval(async () => {
      try {
        const data = await api.get<any>(`/whatsapp/conversations/${selectedConvo.id}`);
        setMessages(data.messages || []);
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedConvo]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConvo) return;
    setSending(true);
    try {
      await api.post(`/whatsapp/conversations/${selectedConvo.id}/messages`, {
        content: newMessage,
        direction: 'outbound',
        message_type: 'text',
      });
      setNewMessage('');
      const data = await api.get<any>(`/whatsapp/conversations/${selectedConvo.id}`);
      setMessages(data.messages || []);
      loadConversations();
    } catch { } finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Check for quick reply shortcut
    if (newMessage.startsWith('/') && quickReplies.length > 0) {
      setShowQuickReplies(true);
    } else {
      setShowQuickReplies(false);
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const insertQuickReply = (qr: QuickReply) => {
    setNewMessage(qr.content);
    setShowQuickReplies(false);
  };

  const toggleBot = async (convo: Conversation) => {
    try {
      await api.patch(`/whatsapp/conversations/${convo.id}/toggle-bot`, { enabled: !convo.bot_enabled });
      loadConversations();
      if (selectedConvo?.id === convo.id) {
        setSelectedConvo({ ...convo, bot_enabled: !convo.bot_enabled });
      }
    } catch { }
  };

  const resolveConvo = async (id: string) => {
    try {
      await api.patch(`/whatsapp/conversations/${id}/resolve`);
      loadConversations();
      onRefresh();
      if (selectedConvo?.id === id) setSelectedConvo(null);
    } catch { }
  };

  const createConversation = async (phone: string, name: string) => {
    try {
      await api.post('/whatsapp/conversations', { customer_phone: phone, customer_name: name });
      setShowNewConvo(false);
      loadConversations();
    } catch { }
  };

  const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    converted: 'bg-purple-100 text-purple-700',
    closed: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="flex h-[calc(100vh-320px)] min-h-[500px] rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Sidebar — Conversation List */}
      <div className={cn('w-full md:w-96 border-r flex flex-col', selectedConvo && 'hidden md:flex', isRTL && 'border-l border-r-0')}>
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                placeholder={isRTL ? 'بحث...' : 'Search...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border bg-gray-50 py-2 pl-9 pr-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              onClick={() => setShowNewConvo(true)}
              className="rounded-lg bg-green-500 p-2 text-white hover:bg-green-600"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-1">
            {['', 'open', 'converted', 'closed'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                  statusFilter === s ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                {s || (isRTL ? 'الكل' : 'All')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{isRTL ? 'لا توجد محادثات' : 'No conversations'}</p>
            </div>
          ) : conversations.map(convo => (
            <div
              key={convo.id}
              onClick={() => selectConversation(convo)}
              className={cn(
                'flex items-start gap-3 p-3 cursor-pointer border-b hover:bg-gray-50 transition-colors',
                selectedConvo?.id === convo.id && 'bg-green-50 border-l-2 border-l-green-500',
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-sm shrink-0">
                {(convo.customer_name || convo.customer_phone || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-gray-900 truncate">
                    {convo.customer_name || convo.customer_phone}
                  </span>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    {convo.last_message_at ? new Date(convo.last_message_at).toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-medium', statusColors[convo.status] || 'bg-gray-100 text-gray-600')}>
                    {convo.status}
                  </span>
                  {convo.bot_enabled && (
                    <span className="text-[10px] text-blue-500">🤖</span>
                  )}
                  {Number(convo.unread_count) > 0 && (
                    <span className="rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {convo.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {convo.customer_phone} • {convo.message_count} {isRTL ? 'رسالة' : 'msgs'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main — Chat Area */}
      <div className={cn('flex-1 flex flex-col', !selectedConvo && 'hidden md:flex')}>
        {selectedConvo ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b px-4 py-3 bg-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConvo(null)}
                  className="md:hidden rounded-lg p-1 hover:bg-gray-100"
                >
                  <ChevronRight className={cn('h-5 w-5', isRTL && 'rotate-180')} />
                </button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white font-bold text-sm">
                  {(selectedConvo.customer_name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{selectedConvo.customer_name || selectedConvo.customer_phone}</h3>
                  <p className="text-xs text-gray-400">{selectedConvo.customer_phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBot(selectedConvo)}
                  className={cn('rounded-lg px-2.5 py-1.5 text-xs font-medium flex items-center gap-1',
                    selectedConvo.bot_enabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500')}
                  title={selectedConvo.bot_enabled ? 'Bot ON' : 'Bot OFF'}
                >
                  {selectedConvo.bot_enabled ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                  🤖
                </button>
                <button
                  onClick={() => resolveConvo(selectedConvo.id)}
                  className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0f2f5]">
              {messages.map(msg => (
                <div key={msg.id} className={cn('flex', msg.direction === 'outbound' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm',
                    msg.direction === 'outbound'
                      ? 'bg-green-500 text-white rounded-br-md'
                      : 'bg-white text-gray-800 rounded-bl-md'
                  )}>
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className={cn('flex items-center gap-1 mt-1', msg.direction === 'outbound' ? 'justify-end' : '')}>
                      <span className={cn('text-[10px]', msg.direction === 'outbound' ? 'text-green-100' : 'text-gray-400')}>
                        {new Date(msg.created_at).toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.direction === 'outbound' && (
                        <span className="text-[10px] text-green-100">
                          {msg.read_at ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies Popup */}
            {showQuickReplies && quickReplies.length > 0 && (
              <div className="border-t bg-white px-4 py-2 max-h-32 overflow-y-auto">
                {quickReplies
                  .filter(qr => qr.shortcut.toLowerCase().includes(newMessage.toLowerCase()))
                  .map(qr => (
                    <button
                      key={qr.id}
                      onClick={() => insertQuickReply(qr)}
                      className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-green-50 flex items-center gap-2"
                    >
                      <Hash className="h-3 w-3 text-green-500" />
                      <span className="font-medium text-green-700">{qr.shortcut}</span>
                      <span className="text-gray-400 text-xs truncate">{qr.title}</span>
                    </button>
                  ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t bg-white p-3">
              <div className="flex items-center gap-2">
                <input
                  value={newMessage}
                  onChange={e => {
                    setNewMessage(e.target.value);
                    setShowQuickReplies(e.target.value.startsWith('/'));
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={isRTL ? 'اكتب رسالة... (/ للردود السريعة)' : 'Type a message... (/ for quick replies)'}
                  className="flex-1 rounded-full border bg-gray-50 px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#f0f2f5]">
            <div className="text-center text-gray-400">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">{isRTL ? 'اختر محادثة' : 'Select a conversation'}</p>
              <p className="text-sm mt-1">{isRTL ? 'أو أنشئ محادثة جديدة' : 'Or start a new one'}</p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConvo && <NewConvoModal isRTL={isRTL} onClose={() => setShowNewConvo(false)} onCreate={createConversation} />}
    </div>
  );
}

function NewConvoModal({ isRTL, onClose, onCreate }: { isRTL: boolean; onClose: () => void; onCreate: (phone: string, name: string) => void }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{isRTL ? 'محادثة جديدة' : 'New Conversation'}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{isRTL ? 'رقم الهاتف' : 'Phone Number'}</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+20 1xx xxxx xxx"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{isRTL ? 'اسم العميل' : 'Customer Name'}</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={isRTL ? 'اسم العميل (اختياري)' : 'Customer name (optional)'}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
            <button onClick={() => phone && onCreate(phone, name)} disabled={!phone}
              className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50">
              {isRTL ? 'إنشاء' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB: ORDERS
// ═══════════════════════════════════════════

function OrdersTab({ isRTL }: { isRTL: boolean }) {
  const [orders, setOrders] = useState<WAOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const data = await api.get<any>('/whatsapp/orders', params);
      setOrders(data.data || []);
    } catch { } finally { setLoading(false); }
  };

  const confirmOrder = async (id: string) => {
    try {
      await api.patch(`/whatsapp/orders/${id}/confirm`);
      loadOrders();
    } catch { }
  };

  const syncToSales = async (id: string) => {
    try {
      await api.post(`/whatsapp/orders/${id}/sync-to-sales`);
      loadOrders();
    } catch { }
  };

  const orderStatusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    synced: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">{isRTL ? 'طلبات واتساب' : 'WhatsApp Orders'}</h3>
        <div className="flex gap-1">
          {['', 'pending', 'confirmed', 'synced', 'cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('rounded-full px-2.5 py-1 text-xs font-medium', statusFilter === s ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
              {s || (isRTL ? 'الكل' : 'All')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><RefreshCw className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{isRTL ? 'لا توجد طلبات' : 'No orders yet'}</p>
          <p className="text-xs mt-1">{isRTL ? 'الطلبات من البوت ستظهر هنا' : 'Bot orders will appear here'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">{isRTL ? 'رقم الطلب' : 'Order #'}</th>
                <th className="px-4 py-3 text-left">{isRTL ? 'العميل' : 'Customer'}</th>
                <th className="px-4 py-3 text-left">{isRTL ? 'الهاتف' : 'Phone'}</th>
                <th className="px-4 py-3 text-right">{isRTL ? 'الإجمالي' : 'Total'}</th>
                <th className="px-4 py-3 text-center">{isRTL ? 'الحالة' : 'Status'}</th>
                <th className="px-4 py-3 text-center">{isRTL ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{order.order_number}</td>
                  <td className="px-4 py-3">{order.customer_name || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{order.customer_phone}</td>
                  <td className="px-4 py-3 text-right font-medium">EGP {(Number(order.total) / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', orderStatusColors[order.status] || 'bg-gray-100 text-gray-600')}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {order.status === 'pending' && (
                        <button onClick={() => confirmOrder(order.id)}
                          className="rounded bg-green-100 p-1.5 text-green-600 hover:bg-green-200" title="Confirm">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {(order.status === 'confirmed' && !order.sales_order_id) && (
                        <button onClick={() => syncToSales(order.id)}
                          className="rounded bg-blue-100 p-1.5 text-blue-600 hover:bg-blue-200" title="Sync to Sales">
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {order.sales_order_id && (
                        <span className="text-xs text-green-600 font-medium">✓ Synced</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB: BOT FLOWS
// ═══════════════════════════════════════════

function BotFlowsTab({ isRTL }: { isRTL: boolean }) {
  const [flows, setFlows] = useState<BotFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFlow, setEditingFlow] = useState<BotFlow | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { loadFlows(); }, []);

  const loadFlows = async () => {
    try {
      setLoading(true);
      const data = await api.get<BotFlow[]>('/whatsapp/bot-flows');
      setFlows(Array.isArray(data) ? data : []);
    } catch { } finally { setLoading(false); }
  };

  const deleteFlow = async (id: string) => {
    if (!confirm(isRTL ? 'حذف هذا التدفق؟' : 'Delete this flow?')) return;
    try {
      await api.delete(`/whatsapp/bot-flows/${id}`);
      loadFlows();
    } catch { }
  };

  const saveFlow = async (flow: Partial<BotFlow>) => {
    try {
      if (editingFlow) {
        await api.put(`/whatsapp/bot-flows/${editingFlow.id}`, flow);
      } else {
        await api.post('/whatsapp/bot-flows', flow);
      }
      setEditingFlow(null);
      setShowAdd(false);
      loadFlows();
    } catch { }
  };

  const typeIcons: Record<string, string> = {
    text: '💬', buttons: '🔘', list: '📋', image: '🖼️',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">{isRTL ? 'تدفقات البوت' : 'Bot Flows'}</h3>
        <button onClick={() => { setEditingFlow(null); setShowAdd(true); }}
          className="flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-2 text-sm font-medium text-white hover:bg-green-600">
          <Plus className="h-4 w-4" /> {isRTL ? 'إضافة تدفق' : 'Add Flow'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><RefreshCw className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {flows.map(flow => (
            <div key={flow.id} className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{typeIcons[flow.response_type] || '📝'}</span>
                  <h4 className="font-semibold text-sm">{flow.name}</h4>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', flow.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                  {flow.is_active ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'معطل' : 'Inactive')}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {(flow.trigger_keywords || []).map((kw, i) => (
                  <span key={i} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">{kw}</span>
                ))}
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mb-3">{flow.response_content}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditingFlow(flow); setShowAdd(true); }}
                  className="rounded bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200"><Edit2 className="h-3 w-3" /></button>
                <button onClick={() => deleteFlow(flow.id)}
                  className="rounded bg-red-50 p-1.5 text-red-500 hover:bg-red-100"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <FlowModal isRTL={isRTL} flow={editingFlow} onClose={() => { setShowAdd(false); setEditingFlow(null); }} onSave={saveFlow} />}
    </div>
  );
}

function FlowModal({ isRTL, flow, onClose, onSave }: { isRTL: boolean; flow: BotFlow | null; onClose: () => void; onSave: (f: Partial<BotFlow>) => void }) {
  const [name, setName] = useState(flow?.name || '');
  const [keywords, setKeywords] = useState((flow?.trigger_keywords || []).join(', '));
  const [responseType, setResponseType] = useState(flow?.response_type || 'text');
  const [content, setContent] = useState(flow?.response_content || '');
  const [isActive, setIsActive] = useState(flow?.is_active !== false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{flow ? (isRTL ? 'تعديل التدفق' : 'Edit Flow') : (isRTL ? 'إضافة تدفق' : 'Add Flow')}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{isRTL ? 'اسم التدفق' : 'Flow Name'}</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{isRTL ? 'الكلمات المفتاحية (فاصلة)' : 'Trigger Keywords (comma-separated)'}</label>
            <input value={keywords} onChange={e => setKeywords(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{isRTL ? 'نوع الرد' : 'Response Type'}</label>
            <select value={responseType} onChange={e => setResponseType(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="text">Text</option>
              <option value="buttons">Buttons</option>
              <option value="list">List</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{isRTL ? 'محتوى الرد' : 'Response Content'}</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded" />
            <span className="text-sm">{isRTL ? 'نشط' : 'Active'}</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
            <button onClick={() => onSave({
              name, trigger_keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
              response_type: responseType, response_content: content, is_active: isActive,
            })} disabled={!name || !content}
              className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50">
              {isRTL ? 'حفظ' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB: TEMPLATES + QUICK REPLIES
// ═══════════════════════════════════════════

function TemplatesTab({ isRTL }: { isRTL: boolean }) {
  const [templates, setTemplates] = useState<NotifTemplate[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'templates' | 'quick-replies'>('templates');

  useEffect(() => {
    Promise.all([
      api.get<NotifTemplate[]>('/whatsapp/notification-templates').then(d => setTemplates(Array.isArray(d) ? d : [])).catch(() => {}),
      api.get<QuickReply[]>('/whatsapp/quick-replies').then(d => setQuickReplies(Array.isArray(d) ? d : [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const deleteTemplate = async (id: string) => {
    if (!confirm(isRTL ? 'حذف هذا القالب؟' : 'Delete this template?')) return;
    try {
      await api.delete(`/whatsapp/notification-templates/${id}`);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch { }
  };

  const deleteQuickReply = async (id: string) => {
    if (!confirm(isRTL ? 'حذف هذا الرد السريع؟' : 'Delete this quick reply?')) return;
    try {
      await api.delete(`/whatsapp/quick-replies/${id}`);
      setQuickReplies(prev => prev.filter(q => q.id !== id));
    } catch { }
  };

  const typeEmojis: Record<string, string> = {
    order_confirmation: '✅', shipping_update: '🚚', delivery_confirmation: '📦',
    promo_broadcast: '🎉', re_engagement: '👋',
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <button onClick={() => setSubTab('templates')}
          className={cn('rounded-lg px-4 py-2 text-sm font-medium', subTab === 'templates' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600')}>
          <Bell className="h-4 w-4 inline mr-1" /> {isRTL ? 'قوالب الإشعارات' : 'Notification Templates'}
        </button>
        <button onClick={() => setSubTab('quick-replies')}
          className={cn('rounded-lg px-4 py-2 text-sm font-medium', subTab === 'quick-replies' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600')}>
          <Zap className="h-4 w-4 inline mr-1" /> {isRTL ? 'الردود السريعة' : 'Quick Replies'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><RefreshCw className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : subTab === 'templates' ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(tmpl => (
            <div key={tmpl.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{typeEmojis[tmpl.template_type] || '📝'}</span>
                  <h4 className="font-semibold text-sm">{tmpl.name}</h4>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', tmpl.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                  {tmpl.is_active ? '✓' : '✗'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2 line-clamp-3">{tmpl.content}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">
                  {isRTL ? `${tmpl.send_count} إرسال` : `${tmpl.send_count} sent`}
                </span>
                <button onClick={() => deleteTemplate(tmpl.id)}
                  className="rounded bg-red-50 p-1 text-red-500 hover:bg-red-100"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {quickReplies.map(qr => (
            <div key={qr.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{qr.shortcut}</span>
                  <h4 className="font-semibold text-sm">{qr.title}</h4>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">{qr.category}</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">{qr.content}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">
                  {isRTL ? `${qr.usage_count} استخدام` : `${qr.usage_count} uses`}
                </span>
                <button onClick={() => deleteQuickReply(qr.id)}
                  className="rounded bg-red-50 p-1 text-red-500 hover:bg-red-100"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB: ANALYTICS
// ═══════════════════════════════════════════

function AnalyticsTab({ isRTL, stats }: { isRTL: boolean; stats: Stats | null }) {
  const [dailyStats, setDailyStats] = useState<any[]>([]);

  useEffect(() => {
    api.get<any[]>('/whatsapp/stats/daily', { days: '14' })
      .then(d => setDailyStats(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  if (!stats) return <div className="text-center py-16 text-gray-400"><RefreshCw className="h-6 w-6 animate-spin mx-auto" /></div>;

  const cards = [
    { label: isRTL ? 'إجمالي المحادثات' : 'Total Conversations', value: stats.total_conversations, icon: MessageCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: isRTL ? 'مفتوحة' : 'Open', value: stats.open_conversations, icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50' },
    { label: isRTL ? 'تم تحويلها لطلبات' : 'Converted to Orders', value: stats.converted_conversations, icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: isRTL ? 'مغلقة' : 'Closed', value: stats.closed_conversations, icon: CheckCircle2, color: 'text-gray-600', bg: 'bg-gray-50' },
    { label: isRTL ? 'معدل التحويل' : 'Conversion Rate', value: `${Number(stats.conversion_rate || 0).toFixed(1)}%`, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: isRTL ? 'رسائل واردة' : 'Inbound Messages', value: stats.messages?.inbound || 0, icon: ArrowRightLeft, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: isRTL ? 'رسائل صادرة' : 'Outbound Messages', value: stats.messages?.outbound || 0, icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: isRTL ? 'تدفقات نشطة' : 'Active Flows', value: stats.active_bot_flows, icon: Bot, color: 'text-pink-600', bg: 'bg-pink-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <div key={i} className={cn('rounded-xl border p-4', card.bg)}>
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={cn('h-4 w-4', card.color)} />
              <span className="text-xs text-gray-500">{card.label}</span>
            </div>
            <div className={cn('text-2xl font-bold', card.color)}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Daily Activity Bar Chart (simple) */}
      {dailyStats.length > 0 && (
        <div className="rounded-xl border bg-white p-4">
          <h4 className="font-semibold text-sm mb-4">{isRTL ? 'النشاط اليومي (آخر 14 يوم)' : 'Daily Activity (Last 14 days)'}</h4>
          <div className="flex items-end gap-1 h-32">
            {dailyStats.map((d, i) => {
              const total = Number(d.messages_sent || 0) + Number(d.messages_received || 0);
              const maxVal = Math.max(...dailyStats.map(s => Number(s.messages_sent || 0) + Number(s.messages_received || 0)), 1);
              const height = (total / maxVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center">
                    <span className="text-[9px] text-gray-400">{total || ''}</span>
                    <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                      <div className="w-full rounded-t bg-green-400 transition-all" style={{ height: `${height}%`, minHeight: total ? '4px' : '0' }} />
                    </div>
                  </div>
                  <span className="text-[9px] text-gray-400">{new Date(d.date).getDate()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB: SETTINGS
// ═══════════════════════════════════════════

function SettingsTab({ isRTL, connectionStatus }: { isRTL: boolean; connectionStatus: any }) {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Connection Status */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-green-600" />
          {isRTL ? 'حالة الاتصال بـ Meta' : 'Meta API Connection'}
        </h3>
        <div className={cn('flex items-center gap-3 p-4 rounded-lg',
          connectionStatus?.configured ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200')}>
          <span className={cn('flex h-10 w-10 items-center justify-center rounded-full text-white',
            connectionStatus?.configured ? 'bg-green-500' : 'bg-yellow-500')}>
            {connectionStatus?.configured ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          </span>
          <div>
            <p className="font-medium">
              {connectionStatus?.configured
                ? (isRTL ? 'متصل بـ Meta Cloud API' : 'Connected to Meta Cloud API')
                : (isRTL ? 'غير مهيأ — يحتاج بيانات API' : 'Not Configured — API credentials needed')
              }
            </p>
            <p className="text-sm text-gray-500">
              {connectionStatus?.configured
                ? (isRTL ? 'البوت جاهز لاستقبال الرسائل' : 'Bot is ready to receive messages')
                : (isRTL ? 'أضف Phone Number ID و Access Token في صفحة التكاملات' : 'Add Phone Number ID & Access Token in Integrations page')
              }
            </p>
          </div>
        </div>
      </div>

      {/* Webhook URL */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="font-semibold mb-3">{isRTL ? 'رابط Webhook' : 'Webhook URL'}</h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-mono text-gray-600 overflow-x-auto">
            https://api-production-0cfb.up.railway.app/api/v1/webhook/whatsapp
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText('https://api-production-0cfb.up.railway.app/api/v1/webhook/whatsapp');
            }}
            className="rounded-lg bg-gray-100 p-2 hover:bg-gray-200"
          >
            <Copy className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {isRTL ? 'استخدم هذا الرابط في إعدادات Meta Developers' : 'Use this URL in Meta Developers webhook configuration'}
        </p>
      </div>

      {/* Verify Token */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="font-semibold mb-3">{isRTL ? 'رمز التحقق' : 'Verify Token'}</h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-mono text-gray-600">
            brushia-whatsapp-verify-2024
          </code>
          <button
            onClick={() => navigator.clipboard.writeText('brushia-whatsapp-verify-2024')}
            className="rounded-lg bg-gray-100 p-2 hover:bg-gray-200"
          >
            <Copy className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Setup Steps */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="font-semibold mb-4">{isRTL ? 'خطوات الإعداد' : 'Setup Steps'}</h3>
        <ol className="space-y-3 text-sm text-gray-600">
          {[
            isRTL ? 'افتح developers.facebook.com وأنشئ تطبيق' : 'Go to developers.facebook.com and create an app',
            isRTL ? 'أضف منتج WhatsApp للتطبيق' : 'Add WhatsApp product to the app',
            isRTL ? 'انسخ Phone Number ID و Access Token' : 'Copy Phone Number ID & Access Token',
            isRTL ? 'أضفهم في صفحة التكاملات ← واتساب' : 'Add them in Integrations → WhatsApp',
            isRTL ? 'في إعدادات الويبهوك، أضف الرابط ورمز التحقق أعلاه' : 'In webhook settings, add the URL and verify token above',
            isRTL ? 'فعّل اشتراك حقل messages' : 'Subscribe to messages field',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
