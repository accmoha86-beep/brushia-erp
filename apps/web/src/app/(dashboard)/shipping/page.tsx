'use client';

import { useState, useMemo } from 'react';
import { formatEGP, formatDate, cn } from '@/lib/utils';
import { Search, Truck, Package, Clock, CheckCircle2, MapPin, ExternalLink } from 'lucide-react';

interface Shipment {
  id: string;
  orderNumber: string;
  carrier: string;
  trackingNumber: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  recipient: string;
  phone: string;
  city: string;
  address: string;
  codAmount: number;
  createdAt: string;
  updatedAt: string;
}

const shipments: Shipment[] = [
  { id: '1', orderNumber: 'ORD-2024-1847', carrier: 'Bosta', trackingNumber: 'BST-98765432', status: 'pending', recipient: 'Sara Ahmed', phone: '+201012345678', city: 'Cairo', address: 'Nasr City, Block 5, Apt 12', codAmount: 0, createdAt: '2026-05-21T10:30:00', updatedAt: '2026-05-21T10:30:00' },
  { id: '2', orderNumber: 'ORD-2024-1846', carrier: 'Bosta', trackingNumber: 'BST-98765431', status: 'in_transit', recipient: 'Nour ElSayed', phone: '+201098765432', city: 'Alexandria', address: 'Smouha, Street 10, Building 8', codAmount: 0, createdAt: '2026-05-21T09:45:00', updatedAt: '2026-05-21T14:20:00' },
  { id: '3', orderNumber: 'ORD-2024-1845', carrier: 'Bosta', trackingNumber: 'BST-98765430', status: 'pending', recipient: 'Fatma Hassan', phone: '+201155667788', city: 'Giza', address: 'Dokki, Tahrir Street 25', codAmount: 115140, createdAt: '2026-05-21T09:12:00', updatedAt: '2026-05-21T09:12:00' },
  { id: '4', orderNumber: 'ORD-2024-1844', carrier: 'Bosta', trackingNumber: 'BST-98765429', status: 'delivered', recipient: 'Mariam Adel', phone: '+201233445566', city: 'Cairo', address: 'Maadi, Street 9, Villa 15', codAmount: 0, createdAt: '2026-05-20T18:30:00', updatedAt: '2026-05-21T11:00:00' },
  { id: '5', orderNumber: 'ORD-2024-1843', carrier: 'Bosta', trackingNumber: 'BST-98765428', status: 'picked_up', recipient: 'Yasmin Khaled', phone: '+201177889900', city: 'Mansoura', address: 'University District, Building 20', codAmount: 0, createdAt: '2026-05-20T17:15:00', updatedAt: '2026-05-21T08:00:00' },
  { id: '6', orderNumber: 'ORD-2024-1842', carrier: 'Bosta', trackingNumber: 'BST-98765427', status: 'in_transit', recipient: 'Hana Mostafa', phone: '+201066778899', city: 'Tanta', address: 'Downtown, Al-Geish Street 45', codAmount: 0, createdAt: '2026-05-20T16:00:00', updatedAt: '2026-05-21T12:30:00' },
  { id: '7', orderNumber: 'ORD-2024-1841', carrier: 'Bosta', trackingNumber: 'BST-98765426', status: 'delivered', recipient: 'Aya Ibrahim', phone: '+201244556677', city: 'Cairo', address: 'Heliopolis, Merghani Street 88', codAmount: 0, createdAt: '2026-05-20T14:20:00', updatedAt: '2026-05-21T09:00:00' },
  { id: '8', orderNumber: 'ORD-2024-1839', carrier: 'Bosta', trackingNumber: 'BST-98765424', status: 'delivered', recipient: 'Reem Gamal', phone: '+201122334455', city: 'Aswan', address: 'Corniche Street, Block 3', codAmount: 0, createdAt: '2026-05-20T11:45:00', updatedAt: '2026-05-21T15:00:00' },
  { id: '9', orderNumber: 'ORD-2024-1838', carrier: 'Bosta', trackingNumber: 'BST-98765423', status: 'picked_up', recipient: 'Layla Mahmoud', phone: '+201088776655', city: 'Luxor', address: 'East Bank, Karnak Avenue 12', codAmount: 36480, createdAt: '2026-05-20T10:30:00', updatedAt: '2026-05-21T07:30:00' },
  { id: '10', orderNumber: 'ORD-2024-1837', carrier: 'Bosta', trackingNumber: 'BST-98765422', status: 'delivered', recipient: 'Salma Tarek', phone: '+201055443322', city: 'Cairo', address: 'New Cairo, 5th Settlement, Area 1', codAmount: 0, createdAt: '2026-05-19T19:00:00', updatedAt: '2026-05-20T14:00:00' },
];

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  picked_up: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  failed: 'Failed',
};

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  picked_up: Package,
  in_transit: Truck,
  delivered: CheckCircle2,
  failed: Clock,
};

export default function ShippingPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return shipments.filter((s) => {
      const matchesSearch = search === '' || s.orderNumber.toLowerCase().includes(search.toLowerCase()) || s.trackingNumber.toLowerCase().includes(search.toLowerCase()) || s.recipient.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const counts = {
    pending: shipments.filter(s => s.status === 'pending').length,
    picked_up: shipments.filter(s => s.status === 'picked_up').length,
    in_transit: shipments.filter(s => s.status === 'in_transit').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shipping</h1>
        <p className="text-sm text-gray-500 mt-1">{shipments.length} shipments · Carrier: Bosta</p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(counts).map(([status, count]) => {
          const Icon = statusIcons[status] || Clock;
          return (
            <button key={status} onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)} className={cn('rounded-xl border bg-white p-4 shadow-sm text-left transition-all', statusFilter === status ? 'border-rose-500 ring-1 ring-rose-500/30' : 'border-gray-200 hover:border-gray-300')}>
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-gray-400" />
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status]}`}>{statusLabels[status]}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Search by order#, tracking#, or recipient..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Order</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Tracking</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Recipient</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">City</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">COD</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((shipment) => {
                const StatusIcon = statusIcons[shipment.status] || Clock;
                return (
                  <tr key={shipment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{shipment.orderNumber}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-gray-600">{shipment.trackingNumber}</span>
                        <ExternalLink className="h-3 w-3 text-gray-400 cursor-pointer hover:text-rose-500" />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{shipment.carrier}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[shipment.status]}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusLabels[shipment.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{shipment.recipient}</p>
                      <p className="text-xs text-gray-400">{shipment.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">{shipment.city}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {shipment.codAmount > 0 ? (
                        <span className="font-medium text-amber-700">{formatEGP(shipment.codAmount)}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(shipment.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
