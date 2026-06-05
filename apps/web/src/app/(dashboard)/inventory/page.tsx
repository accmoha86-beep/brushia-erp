'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api-client';
import { formatEGP, cn } from '@/lib/utils';
import { exportToCSV } from '@/lib/export-data';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard, StatCardGrid } from '@/components/ui/stat-card';
import { SearchFilter, FilterTabs } from '@/components/ui/search-filter';
import { Badge } from '@/components/ui/badge';
import { EmptyState, TableSkeleton } from '@/components/ui/empty-state';
import { Table, Thead, Th, Td, Tr } from '@/components/ui/table';
import { Archive, RefreshCw, Download, AlertTriangle, Package, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';

interface StockItem {
  id: string; product_id: string; product_name?: string; sku?: string;
  warehouse_id: string; warehouse_name?: string; qty_on_hand: number;
  qty_reserved?: number; qty_available?: number; reorder_point?: number;
  unit_cost?: number;
}

export default function InventoryPage() {
  const { t } = useI18n();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/inventory/stock?limit=500');
      const data = res?.data?.rows || res?.data || res?.rows || (Array.isArray(res) ? res : []);
      setStock(Array.isArray(data) ? data : []);
    } catch { setStock([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  const filtered = stock.filter(s => {
    const matchSearch = `${s.product_name || ''} ${s.sku || ''} ${s.warehouse_name || ''}`.toLowerCase().includes(search.toLowerCase());
    const qty = Number(s.qty_on_hand || 0);
    const matchFilter = filter === 'all' || (filter === 'low' && qty < 20 && qty > 0) || (filter === 'out' && qty <= 0) || (filter === 'ok' && qty >= 20);
    return matchSearch && matchFilter;
  });

  const totalUnits = stock.reduce((s, i) => s + Number(i.qty_on_hand || 0), 0);
  const totalValue = stock.reduce((s, i) => s + Number(i.qty_on_hand || 0) * Number(i.unit_cost || 0), 0);
  const lowCount = stock.filter(i => Number(i.qty_on_hand || 0) < 20 && Number(i.qty_on_hand || 0) > 0).length;
  const outCount = stock.filter(i => Number(i.qty_on_hand || 0) <= 0).length;

  const exportData = () => {
    exportToCSV(filtered.map(s => ({
      Product: s.product_name || '', SKU: s.sku || '', Warehouse: s.warehouse_name || '',
      'On Hand': s.qty_on_hand, Reserved: s.qty_reserved || 0, Available: s.qty_available || Number(s.qty_on_hand || 0) - Number(s.qty_reserved || 0),
      'Unit Cost': Number(s.unit_cost || 0).toFixed(2),
    })), 'inventory');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={t('inventory.title') || 'Inventory'}
        subtitle={t('inventory.subtitle') || 'Real-time stock levels across all warehouses'}
        icon={<Archive className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            <button onClick={exportData} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition"><Download className="h-4 w-4" /></button>
            <button onClick={fetchStock} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition"><RefreshCw className="h-4 w-4" /></button>
          </div>
        }
      />

      <StatCardGrid cols={4}>
        <StatCard label="Total Units" value={totalUnits.toLocaleString()} icon={<Package className="h-5 w-5" />} color="emerald" />
        <StatCard label="Inventory Value" value={formatEGP(totalValue)} icon={<DollarSign className="h-5 w-5" />} color="blue" />
        <StatCard label="Low Stock" value={lowCount} icon={<AlertTriangle className="h-5 w-5" />} color="amber" />
        <StatCard label="Out of Stock" value={outCount} icon={<Archive className="h-5 w-5" />} color="red" />
      </StatCardGrid>

      <SearchFilter
        search={search} onSearchChange={setSearch}
        placeholder="Search by product, SKU, or warehouse..."
        filters={
          <FilterTabs
            tabs={[
              { key: 'all', label: 'All', count: stock.length },
              { key: 'ok', label: '✅ In Stock' },
              { key: 'low', label: '⚠️ Low Stock', count: lowCount },
              { key: 'out', label: '❌ Out', count: outCount },
            ]}
            active={filter} onChange={setFilter}
          />
        }
      />

      <Table>
        <Thead>
          <tr>
            <Th>Product</Th>
            <Th>SKU</Th>
            <Th>Warehouse</Th>
            <Th align="right">On Hand</Th>
            <Th align="right">Reserved</Th>
            <Th align="right">Available</Th>
            <Th align="right">Unit Cost</Th>
            <Th align="right">Total Value</Th>
            <Th>Status</Th>
          </tr>
        </Thead>
        <tbody>
          {loading ? <TableSkeleton rows={6} cols={9} /> : filtered.length === 0 ? (
            <tr><td colSpan={9}>
              <EmptyState icon={<Archive className="h-7 w-7" />} title="No stock records found" description="Stock data will appear after receiving goods" />
            </td></tr>
          ) : (
            filtered.map((s) => {
              const qty = Number(s.qty_on_hand || 0);
              const reserved = Number(s.qty_reserved || 0);
              const available = qty - reserved;
              const cost = Number(s.unit_cost || 0);
              const value = qty * cost;
              const statusColor = qty <= 0 ? 'red' : qty < 20 ? 'amber' : 'emerald';
              const statusLabel = qty <= 0 ? 'Out of Stock' : qty < 20 ? 'Low Stock' : 'In Stock';
              return (
                <Tr key={s.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-sm">📦</div>
                      <span className="font-semibold text-gray-900 line-clamp-1">{s.product_name || '—'}</span>
                    </div>
                  </Td>
                  <Td><span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{s.sku || '—'}</span></Td>
                  <Td><span className="text-sm text-gray-600">{s.warehouse_name || '—'}</span></Td>
                  <Td align="right"><span className={cn('font-bold', qty < 20 ? 'text-red-600' : 'text-gray-900')}>{qty.toLocaleString()}</span></Td>
                  <Td align="right"><span className="text-gray-500">{reserved}</span></Td>
                  <Td align="right"><span className="font-medium text-gray-900">{available.toLocaleString()}</span></Td>
                  <Td align="right"><span className="text-gray-600">{formatEGP(cost)}</span></Td>
                  <Td align="right"><span className="font-semibold text-gray-900">{formatEGP(value)}</span></Td>
                  <Td><Badge color={statusColor} dot>{statusLabel}</Badge></Td>
                </Tr>
              );
            })
          )}
        </tbody>
      </Table>
    </div>
  );
}
