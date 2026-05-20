'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';
import { Plus, X, Edit, Trash2, Building2, Phone, Clock } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  paymentTerms: string;
  leadTimeDays: number;
  status: 'active' | 'inactive';
  productCategories: string[];
}

const vendors: Vendor[] = [
  { id: '1', name: 'Shanghai Beauty Cosmetics Co.', contactPerson: 'Li Wei', email: 'li.wei@shbeauty.cn', phone: '+86-21-5555-0001', country: 'China', city: 'Shanghai', paymentTerms: 'Net 30', leadTimeDays: 45, status: 'active', productCategories: ['Makeup', 'Lip Products'] },
  { id: '2', name: 'Qingdao Mink Lash Factory', contactPerson: 'Zhang Mei', email: 'zhang@qingdaolash.com', phone: '+86-532-8888-1234', country: 'China', city: 'Qingdao', paymentTerms: 'Net 30', leadTimeDays: 35, status: 'active', productCategories: ['Lashes'] },
  { id: '3', name: 'Shenzhen Brush Master Ltd.', contactPerson: 'Wang Jun', email: 'sales@brushmaster.cn', phone: '+86-755-2666-5678', country: 'China', city: 'Shenzhen', paymentTerms: 'Net 45', leadTimeDays: 40, status: 'active', productCategories: ['Brushes', 'Brush Sets'] },
  { id: '4', name: 'Cairo Packaging Solutions', contactPerson: 'Ahmed Nabil', email: 'ahmed@cairopack.eg', phone: '+20-2-2580-1234', country: 'Egypt', city: 'Cairo', paymentTerms: 'Net 15', leadTimeDays: 7, status: 'active', productCategories: ['Packaging'] },
  { id: '5', name: 'Italian Cosmetics Lab', contactPerson: 'Marco Rossi', email: 'marco@italabcosmetics.it', phone: '+39-02-1234-5678', country: 'Italy', city: 'Milan', paymentTerms: 'Net 60', leadTimeDays: 60, status: 'active', productCategories: ['Makeup', 'Concealer'] },
  { id: '6', name: 'Korean Beauty Ingredients', contactPerson: 'Park Soo-jin', email: 'park@kbeautyingr.kr', phone: '+82-2-1234-5678', country: 'South Korea', city: 'Seoul', paymentTerms: 'Net 30', leadTimeDays: 30, status: 'inactive', productCategories: ['Skincare'] },
];

export default function VendorsPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">{vendors.length} registered vendors</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:from-rose-600 hover:to-purple-700"
        >
          <Plus className="h-4 w-4" />
          Add Vendor
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Country</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Payment Terms</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Lead Time</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{vendor.name}</p>
                        <div className="flex gap-1 mt-0.5">
                          {vendor.productCategories.map((cat) => (
                            <span key={cat} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{cat}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{vendor.contactPerson}</p>
                    <p className="text-xs text-gray-400">{vendor.email}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{vendor.country}, {vendor.city}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-xs">{vendor.phone}</td>
                  <td className="px-6 py-4 text-gray-600">{vendor.paymentTerms}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <Clock className="h-3 w-3" />
                      {vendor.leadTimeDays}d
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', vendor.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600')}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Edit className="h-4 w-4" /></button>
                      <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Add Vendor</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500">
                    <option>Net 15</option><option>Net 30</option><option>Net 45</option><option>Net 60</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead Time (days)</label>
                  <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => setShowModal(false)} className="rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2 text-sm font-medium text-white">Add Vendor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
