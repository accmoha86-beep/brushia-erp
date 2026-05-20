'use client';

import { formatEGP } from '@/lib/utils';
import { Warehouse, MapPin, Package, Box, BarChart3, ArrowRightLeft, Settings } from 'lucide-react';

interface WarehouseData {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  type: 'main' | 'showroom' | 'returns';
  totalSKUs: number;
  totalUnits: number;
  totalValue: number;
  capacity: number;
  utilizationPercent: number;
  manager: string;
  phone: string;
}

const warehouses: WarehouseData[] = [
  {
    id: '1', name: 'Main Warehouse', code: 'WH-MAIN', city: 'Cairo', address: '10th of Ramadan City, Industrial Zone A, Building 45', type: 'main',
    totalSKUs: 24, totalUnits: 1542, totalValue: 28450000, capacity: 5000, utilizationPercent: 68, manager: 'Mohamed Hassan', phone: '+201012340001',
  },
  {
    id: '2', name: 'Showroom', code: 'WH-SHOW', city: 'Cairo', address: 'Zamalek, 26 July Street, 3rd Floor', type: 'showroom',
    totalSKUs: 18, totalUnits: 300, totalValue: 4890000, capacity: 800, utilizationPercent: 38, manager: 'Noha Adel', phone: '+201012340002',
  },
];

const typeColors: Record<string, string> = {
  main: 'bg-blue-100 text-blue-700',
  showroom: 'bg-purple-100 text-purple-700',
  returns: 'bg-orange-100 text-orange-700',
};

export default function WarehousesPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
        <p className="text-sm text-gray-500 mt-1">{warehouses.length} locations</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Warehouse className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{warehouses.length}</p>
              <p className="text-sm text-gray-500">Locations</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <Box className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{warehouses.reduce((s, w) => s + w.totalSKUs, 0)}</p>
              <p className="text-sm text-gray-500">Total SKUs</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{warehouses.reduce((s, w) => s + w.totalUnits, 0).toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Units</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <BarChart3 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatEGP(warehouses.reduce((s, w) => s + w.totalValue, 0))}</p>
              <p className="text-sm text-gray-500">Total Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Warehouse Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {warehouses.map((wh) => (
          <div key={wh.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                    <Warehouse className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{wh.name}</h3>
                    <p className="text-sm text-gray-400 font-mono">{wh.code}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[wh.type]}`}>
                  {wh.type}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-3 text-sm text-gray-400">
                <MapPin className="h-3.5 w-3.5" />
                {wh.address}
              </div>
            </div>

            {/* Stats */}
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{wh.totalSKUs}</p>
                  <p className="text-xs text-gray-500">SKUs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{wh.totalUnits.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Units</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{formatEGP(wh.totalValue)}</p>
                  <p className="text-xs text-gray-500">Value</p>
                </div>
              </div>

              {/* Capacity bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-600">Capacity Utilization</span>
                  <span className="text-sm font-semibold text-gray-900">{wh.utilizationPercent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full transition-all ${wh.utilizationPercent > 80 ? 'bg-red-500' : wh.utilizationPercent > 60 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                    style={{ width: `${wh.utilizationPercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{wh.totalUnits.toLocaleString()} of {wh.capacity.toLocaleString()} capacity</p>
              </div>

              {/* Manager */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{wh.manager}</p>
                  <p className="text-xs text-gray-400">{wh.phone}</p>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg border border-gray-300 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700" title="Transfer">
                    <ArrowRightLeft className="h-4 w-4" />
                  </button>
                  <button className="rounded-lg border border-gray-300 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700" title="Settings">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
