'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';
import { Building2, Users, MapPin, Receipt, Plug, Shield, Save, Check } from 'lucide-react';

const tabs = [
  { id: 'company', label: 'Company Info', icon: Building2 },
  { id: 'users', label: 'Users & Roles', icon: Users },
  { id: 'branches', label: 'Branches', icon: MapPin },
  { id: 'tax', label: 'Tax Settings', icon: Receipt },
  { id: 'integrations', label: 'Integrations', icon: Plug },
];

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

const users: User[] = [
  { id: '1', name: 'Mohamed Tarek', email: 'mohamed@brushia.com', role: 'Admin', status: 'active', lastLogin: '2026-05-21T10:30:00' },
  { id: '2', name: 'Noha Adel', email: 'noha@brushia.com', role: 'Manager', status: 'active', lastLogin: '2026-05-21T09:15:00' },
  { id: '3', name: 'Ahmed Hassan', email: 'ahmed@brushia.com', role: 'Warehouse', status: 'active', lastLogin: '2026-05-20T16:00:00' },
  { id: '4', name: 'Sara Ali', email: 'sara@brushia.com', role: 'Sales', status: 'active', lastLogin: '2026-05-21T11:00:00' },
  { id: '5', name: 'Karim Mahmoud', email: 'karim@brushia.com', role: 'Accountant', status: 'inactive', lastLogin: '2026-05-10T14:00:00' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your organization settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {activeTab === 'company' && (
          <div className="p-6 space-y-6">
            <h3 className="font-semibold text-gray-900">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" defaultValue="Brushia Cosmetics LLC" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name</label>
                <input type="text" defaultValue="Brushia for Cosmetics and Beauty Products LLC" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Registration Number</label>
                <input type="text" defaultValue="514-892-341" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commercial Register</label>
                <input type="text" defaultValue="CR-2024-87654" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" defaultValue="10th of Ramadan City, Industrial Zone A, Building 45, Cairo, Egypt" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" defaultValue="+20-2-2580-1234" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" defaultValue="info@brushia.com" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <input type="text" defaultValue="EGP - Egyptian Pound" disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <input type="text" defaultValue="Africa/Cairo (UTC+2)" disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-rose-600 hover:to-purple-700">
                <Save className="h-4 w-4" /> Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Users & Roles</h3>
              <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-3 py-1.5 text-sm font-medium text-white">
                Invite User
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-left text-xs font-semibold uppercase text-gray-500">User</th>
                    <th className="pb-3 text-left text-xs font-semibold uppercase text-gray-500">Role</th>
                    <th className="pb-3 text-center text-xs font-semibold uppercase text-gray-500">Status</th>
                    <th className="pb-3 text-left text-xs font-semibold uppercase text-gray-500">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-purple-100 text-xs font-bold text-rose-600">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          <Shield className="h-3 w-3" /> {user.role}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 text-xs">{new Date(user.lastLogin).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="p-6 space-y-6">
            <h3 className="font-semibold text-gray-900">Branches</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Main Office & Warehouse</p>
                    <p className="text-xs text-gray-400">HQ</p>
                  </div>
                  <span className="ml-auto rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Active</span>
                </div>
                <p className="text-sm text-gray-500">10th of Ramadan City, Industrial Zone A, Cairo</p>
                <p className="text-sm text-gray-500">+20-2-2580-1234</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Zamalek Showroom</p>
                    <p className="text-xs text-gray-400">Retail</p>
                  </div>
                  <span className="ml-auto rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Active</span>
                </div>
                <p className="text-sm text-gray-500">26 July Street, Zamalek, Cairo</p>
                <p className="text-sm text-gray-500">+20-2-2580-5678</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="p-6 space-y-6">
            <h3 className="font-semibold text-gray-900">Tax Settings</h3>
            <div className="max-w-md space-y-4">
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Value Added Tax (VAT)</p>
                    <p className="text-sm text-gray-500">Applied to all sales transactions</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">14%</span>
                    <Check className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Tax Registration</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax Reg. Number</span>
                    <span className="font-mono text-gray-900">514-892-341</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax Authority</span>
                    <span className="text-gray-900">Egyptian Tax Authority (ETA)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">E-Invoice</span>
                    <span className="text-emerald-600 font-medium">Enabled</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Tax Rules</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Prices include VAT</span>
                    <span className="text-gray-900">No (added at checkout)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Tax on shipping</span>
                    <span className="text-gray-900">Yes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="p-6 space-y-6">
            <h3 className="font-semibold text-gray-900">Integrations</h3>
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl font-bold text-blue-600">B</div>
                    <div>
                      <p className="font-medium text-gray-900">Bosta</p>
                      <p className="text-sm text-gray-500">Shipping & delivery service</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
                    </span>
                    <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Configure</button>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-xl">💬</div>
                    <div>
                      <p className="font-medium text-gray-900">WhatsApp Business</p>
                      <p className="text-sm text-gray-500">Customer notifications & order updates</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
                    </span>
                    <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Configure</button>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-dashed border-gray-300 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-xl text-gray-400">+</div>
                    <div>
                      <p className="font-medium text-gray-900">Add Integration</p>
                      <p className="text-sm text-gray-500">Connect more services</p>
                    </div>
                  </div>
                  <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Browse</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
