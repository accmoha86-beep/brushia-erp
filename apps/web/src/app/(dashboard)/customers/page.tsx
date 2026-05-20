'use client';

import { useState, useMemo } from 'react';
import { formatEGP } from '@/lib/utils';
import { Search, Plus, Star, Phone, X, Eye } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: 'retail' | 'wholesale';
  city: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lastOrder: string;
}

const customers: Customer[] = [
  { id: '1', name: 'Sara Ahmed', phone: '+201012345678', email: 'sara@email.com', type: 'retail', city: 'Cairo', totalOrders: 24, totalSpent: 1856000, loyaltyPoints: 1856, tier: 'gold', lastOrder: '2026-05-21' },
  { id: '2', name: 'Nour ElSayed', phone: '+201098765432', email: 'nour@email.com', type: 'retail', city: 'Alexandria', totalOrders: 18, totalSpent: 1245000, loyaltyPoints: 1245, tier: 'gold', lastOrder: '2026-05-21' },
  { id: '3', name: 'Fatma Hassan', phone: '+201155667788', email: 'fatma@email.com', type: 'retail', city: 'Giza', totalOrders: 8, totalSpent: 524000, loyaltyPoints: 524, tier: 'silver', lastOrder: '2026-05-21' },
  { id: '4', name: 'Mariam Adel', phone: '+201233445566', email: 'mariam@email.com', type: 'wholesale', city: 'Cairo', totalOrders: 45, totalSpent: 8920000, loyaltyPoints: 8920, tier: 'platinum', lastOrder: '2026-05-20' },
  { id: '5', name: 'Yasmin Khaled', phone: '+201177889900', email: 'yasmin@email.com', type: 'retail', city: 'Mansoura', totalOrders: 12, totalSpent: 876000, loyaltyPoints: 876, tier: 'silver', lastOrder: '2026-05-20' },
  { id: '6', name: 'Hana Mostafa', phone: '+201066778899', email: 'hana@email.com', type: 'retail', city: 'Tanta', totalOrders: 6, totalSpent: 345000, loyaltyPoints: 345, tier: 'bronze', lastOrder: '2026-05-20' },
  { id: '7', name: 'Aya Ibrahim', phone: '+201244556677', email: 'aya@email.com', type: 'retail', city: 'Cairo', totalOrders: 31, totalSpent: 2340000, loyaltyPoints: 2340, tier: 'platinum', lastOrder: '2026-05-20' },
  { id: '8', name: 'Dina Fawzy', phone: '+201099887766', email: 'dina@email.com', type: 'retail', city: 'Cairo', totalOrders: 4, totalSpent: 156000, loyaltyPoints: 156, tier: 'bronze', lastOrder: '2026-05-20' },
  { id: '9', name: 'Reem Gamal', phone: '+201122334455', email: 'reem@email.com', type: 'wholesale', city: 'Aswan', totalOrders: 22, totalSpent: 4560000, loyaltyPoints: 4560, tier: 'platinum', lastOrder: '2026-05-20' },
  { id: '10', name: 'Layla Mahmoud', phone: '+201088776655', email: 'layla@email.com', type: 'retail', city: 'Luxor', totalOrders: 3, totalSpent: 89000, loyaltyPoints: 89, tier: 'bronze', lastOrder: '2026-05-20' },
  { id: '11', name: 'Beauty Corner Store', phone: '+201044332211', email: 'info@beautycorner.com', type: 'wholesale', city: 'Cairo', totalOrders: 67, totalSpent: 15670000, loyaltyPoints: 15670, tier: 'platinum', lastOrder: '2026-05-19' },
  { id: '12', name: 'Glam Studio', phone: '+201033221199', email: 'orders@glamstudio.com', type: 'wholesale', city: 'Alexandria', totalOrders: 38, totalSpent: 7890000, loyaltyPoints: 7890, tier: 'platinum', lastOrder: '2026-05-18' },
];

const tierColors: Record<string, string> = {
  bronze: 'bg-orange-100 text-orange-700',
  silver: 'bg-gray-100 text-gray-700',
  gold: 'bg-yellow-100 text-yellow-700',
  platinum: 'bg-purple-100 text-purple-700',
};

const typeColors: Record<string, string> = {
  retail: 'bg-blue-100 text-blue-700',
  wholesale: 'bg-emerald-100 text-emerald-700',
};

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{customers.length} registered customers</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:from-rose-600 hover:to-purple-700"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
          <p className="text-sm text-gray-500">Total Customers</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{customers.filter(c => c.type === 'wholesale').length}</p>
          <p className="text-sm text-gray-500">Wholesale</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{customers.filter(c => c.tier === 'platinum').length}</p>
          <p className="text-sm text-gray-500">Platinum Members</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{formatEGP(customers.reduce((s, c) => s + c.totalSpent, 0))}</p>
          <p className="text-sm text-gray-500">Lifetime Value</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Phone</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Orders</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Total Spent</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Points</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Tier</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-purple-100 text-xs font-bold text-rose-600">
                        {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-400">{customer.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-xs">{customer.phone}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[customer.type]}`}>{customer.type}</span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-900 font-medium">{customer.totalOrders}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatEGP(customer.totalSpent)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      {customer.loyaltyPoints.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tierColors[customer.tier]}`}>{customer.tier}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => setSelectedCustomer(customer)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Eye className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Add Customer</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="Customer name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="+201XXXXXXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="email@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="Cairo" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500">
                    <option>retail</option>
                    <option>wholesale</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2 text-sm font-medium text-white">Add Customer</button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Customer Details</h2>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="text-center mb-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-purple-600 text-xl font-bold text-white mb-3">
                {selectedCustomer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{selectedCustomer.name}</h3>
              <p className="text-sm text-gray-500">{selectedCustomer.city} · {selectedCustomer.type}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-xl font-bold text-gray-900">{selectedCustomer.totalOrders}</p>
                <p className="text-xs text-gray-500">Orders</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-xl font-bold text-gray-900">{formatEGP(selectedCustomer.totalSpent)}</p>
                <p className="text-xs text-gray-500">Total Spent</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-xl font-bold text-gray-900">{selectedCustomer.loyaltyPoints.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Loyalty Points</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className={`text-xl font-bold capitalize ${selectedCustomer.tier === 'platinum' ? 'text-purple-600' : selectedCustomer.tier === 'gold' ? 'text-yellow-600' : 'text-gray-600'}`}>{selectedCustomer.tier}</p>
                <p className="text-xs text-gray-500">Tier</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600"><Phone className="h-4 w-4 text-gray-400" />{selectedCustomer.phone}</div>
              <div className="flex items-center gap-2 text-gray-600">📧 {selectedCustomer.email}</div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setSelectedCustomer(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
