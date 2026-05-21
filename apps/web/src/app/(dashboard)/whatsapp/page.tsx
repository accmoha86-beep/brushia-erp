'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  MessageCircle,
  Search,
  Send,
  Plus,
  X,
  Phone,
  User,
  Clock,
  ShoppingCart,
  TrendingUp,
  MessageSquare,
  ArrowRightLeft,
  ChevronRight,
} from 'lucide-react';

interface Conversation {
  id: string;
  customer_name: string;
  customer_phone: string;
  status: 'open' | 'pending' | 'converted' | 'closed';
  last_message: string;
  last_message_at: string;
  assigned_to: string;
  unread_count: number;
}

interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  type: 'text' | 'image' | 'product_inquiry' | 'order_request';
  created_at: string;
}

interface WhatsAppStats {
  open_conversations: number;
  pending: number;
  converted_today: number;
  conversion_rate: number;
}

export default function WhatsAppPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<WhatsAppStats | null>(null);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'pending' | 'converted' | 'closed'>('all');
  const [messageInput, setMessageInput] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newForm, setNewForm] = useState({
    customer_phone: '+20',
    customer_name: '',
    notes: '',
  });
  const [convertItems, setConvertItems] = useState([{ product: '', quantity: '1', price: '' }]);
  const [convertAddress, setConvertAddress] = useState('');

  useEffect(() => {
    loadConversations();
    loadStats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.get('/whatsapp/conversations', token);
      const data = Array.isArray(res) ? res : res.data || [];
      setConversations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await api.get('/whatsapp/stats', token);
      setStats(res.data || res);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (convId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await api.get(`/whatsapp/conversations/${convId}/messages`, token);
      const data = Array.isArray(res) ? res : res.data || [];
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    loadMessages(conv.id);
  };

  const handleSendMessage = async () => {
    if (!selectedConv || !messageInput.trim()) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await api.post(`/whatsapp/conversations/${selectedConv.id}/messages`, {
        direction: 'outbound',
        content: messageInput.trim(),
      }, token);
      setMessageInput('');
      loadMessages(selectedConv.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNewConversation = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await api.post('/whatsapp/conversations', {
        customer_phone: newForm.customer_phone,
        customer_name: newForm.customer_name,
        notes: newForm.notes,
      }, token);
      setShowNewModal(false);
      setNewForm({ customer_phone: '+20', customer_name: '', notes: '' });
      loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvert = async () => {
    if (!selectedConv) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await api.post(`/whatsapp/conversations/${selectedConv.id}/convert`, {
        items: convertItems.map((i) => ({
          product: i.product,
          quantity: parseInt(i.quantity),
          price: Math.round(parseFloat(i.price) * 100),
        })),
        shipping_address: convertAddress,
      }, token);
      setShowConvertModal(false);
      setConvertItems([{ product: '', quantity: '1', price: '' }]);
      setConvertAddress('');
      loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const matchSearch = `${c.customer_name} ${c.customer_phone}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColors: Record<string, string> = {
    open: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    converted: 'bg-blue-100 text-blue-700',
    closed: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Open</p>
                <p className="text-lg font-bold text-gray-900">{stats.open_conversations}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-lg font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Converted Today</p>
                <p className="text-lg font-bold text-gray-900">{stats.converted_today}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-rose-50 p-2">
                <TrendingUp className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Conversion Rate</p>
                <p className="text-lg font-bold text-gray-900">{stats.conversion_rate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Split View */}
      <div className="flex h-[calc(100vh-260px)] rounded-xl border bg-white shadow-sm overflow-hidden">
        {/* Left Panel - Conversation List */}
        <div className="w-1/3 border-r flex flex-col">
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Conversations</h2>
              <button
                onClick={() => setShowNewModal(true)}
                className="rounded-lg bg-rose-500 p-1.5 text-white hover:bg-rose-600"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border py-2 pl-10 pr-4 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {(['all', 'open', 'pending', 'converted', 'closed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                    statusFilter === s
                      ? 'bg-rose-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                <MessageSquare className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                No conversations found.
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={cn(
                    'cursor-pointer border-b px-4 py-3 hover:bg-gray-50 transition-colors',
                    selectedConv?.id === conv.id && 'bg-rose-50 hover:bg-rose-50'
                  )}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                        {conv.customer_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{conv.customer_name}</p>
                        <p className="text-xs text-gray-500">{conv.customer_phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-medium', statusColors[conv.status])}>
                        {conv.status}
                      </span>
                      {conv.unread_count > 0 && (
                        <div className="mt-1 flex justify-end">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                            {conv.unread_count}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 truncate pl-10">{conv.last_message}</p>
                  <div className="flex items-center justify-between mt-1 pl-10">
                    <p className="text-[10px] text-gray-400">{conv.assigned_to && `Assigned: ${conv.assigned_to}`}</p>
                    <p className="text-[10px] text-gray-400">
                      {conv.last_message_at && new Date(conv.last_message_at).toLocaleString('en-EG', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Conversation Detail */}
        <div className="flex-1 flex flex-col">
          {selectedConv ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-700">
                    {selectedConv.customer_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedConv.customer_name}</p>
                    <p className="text-xs text-gray-500">{selectedConv.customer_phone}</p>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[selectedConv.status])}>
                    {selectedConv.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowConvertModal(true)}
                    className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
                  >
                    <ShoppingCart className="h-3 w-3" />
                    Convert to Order
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400">
                    No messages yet. Start the conversation.
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex',
                        msg.direction === 'inbound' ? 'justify-start' : 'justify-end'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[70%] rounded-2xl px-4 py-2 shadow-sm',
                          msg.direction === 'inbound'
                            ? 'bg-emerald-50 rounded-tl-none'
                            : 'bg-white rounded-tr-none'
                        )}
                      >
                        {msg.type !== 'text' && (
                          <span className="mb-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                            {msg.type.replace('_', ' ')}
                          </span>
                        )}
                        <p className="text-sm text-gray-900">{msg.content}</p>
                        <p className="mt-1 text-[10px] text-gray-400 text-right">
                          {new Date(msg.created_at).toLocaleString('en-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border px-4 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle className="mx-auto mb-3 h-12 w-12 text-gray-200" />
                <p className="text-sm">Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">New Conversation</h2>
              <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
                <input
                  type="text"
                  value={newForm.customer_phone}
                  onChange={(e) => setNewForm({ ...newForm, customer_phone: e.target.value })}
                  placeholder="+20 1XX XXX XXXX"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={newForm.customer_name}
                  onChange={(e) => setNewForm({ ...newForm, customer_name: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newForm.notes}
                  onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNewConversation}
                  className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
                >
                  Start Conversation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Order Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Convert to Order</h2>
              <button onClick={() => setShowConvertModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Items</label>
                {convertItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={item.product}
                      onChange={(e) => {
                        const updated = [...convertItems];
                        updated[idx].product = e.target.value;
                        setConvertItems(updated);
                      }}
                      placeholder="Product name"
                      className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...convertItems];
                        updated[idx].quantity = e.target.value;
                        setConvertItems(updated);
                      }}
                      placeholder="Qty"
                      className="w-16 rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const updated = [...convertItems];
                        updated[idx].price = e.target.value;
                        setConvertItems(updated);
                      }}
                      placeholder="Price"
                      className="w-24 rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    {convertItems.length > 1 && (
                      <button
                        onClick={() => setConvertItems(convertItems.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setConvertItems([...convertItems, { product: '', quantity: '1', price: '' }])}
                  className="text-sm text-rose-600 hover:text-rose-700"
                >
                  + Add item
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
                <textarea
                  value={convertAddress}
                  onChange={(e) => setConvertAddress(e.target.value)}
                  rows={3}
                  placeholder="Full delivery address..."
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowConvertModal(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConvert}
                  className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                >
                  Create Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
