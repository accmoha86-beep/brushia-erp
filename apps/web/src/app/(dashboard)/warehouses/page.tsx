'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api-client';
import { formatEGP, cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard, StatCardGrid } from '@/components/ui/stat-card';
import { SearchFilter } from '@/components/ui/search-filter';
import { BloomModal, BtnPrimary, BtnSecondary } from '@/components/ui/bloom-modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState, TableSkeleton } from '@/components/ui/empty-state';
import { Table, Thead, Th, Td, Tr } from '@/components/ui/table';
import { Warehouse, RefreshCw, Plus, Package, DollarSign, MapPin, Eye } from 'lucide-react';

interface WH {
  id: string; code: string; name: string; name_ar?: string;
  warehouse_type: string; city: string; governorate?: string;
  phone?: string; is_active: boolean; is_default: boolean;
  sku_count?: number; total_units?: number; total_value?: number;
}

export default function WarehousesPage() {
  const { t } = useI18n();
  const [warehouses, setWarehouses] = useState<WH[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<WH | null>(null);

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/warehouses');
      setWarehouses(Array.isArray(res) ? res : res?.data || []);
    } catch { setWarehouses([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchWarehouses(); }, [fetchWarehouses]);

  const filtered = warehouses.filter(w => `${w.name} ${w.code} ${w.city}`.toLowerCase().includes(search.toLowerCase()));
  const totalSKUs = warehouses.reduce((s, w) => s + Number(w.sku_count || 0), 0);
  const totalUnits = warehouses.reduce((s, w) => s + Number(w.total_units || 0), 0);
  const totalValue = warehouses.reduce((s, w) => s + Number(w.total_value || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader title={t('warehouses.title') || 'Warehouses'} subtitle="Manage storage locations and stock distribution"
        icon={<Warehouse className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            <button onClick={fetchWarehouses} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition"><RefreshCw className="h-4 w-4" /></button>
            <BtnPrimary className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add Warehouse</BtnPrimary>
          </div>
        }
      />

      <StatCardGrid cols={4}>
        <StatCard label="Warehouses" value={warehouses.length} icon={<Warehouse className="h-5 w-5" />} color="emerald" />
        <StatCard label="Total SKUs" value={totalSKUs.toLocaleString()} icon={<Package className="h-5 w-5" />} color="blue" />
        <StatCard label="Total Units" value={totalUnits.toLocaleString()} icon={<Package className="h-5 w-5" />} color="teal" />
        <StatCard label="Total Value" value={formatEGP(totalValue)} icon={<DollarSign className="h-5 w-5" />} color="amber" />
      </StatCardGrid>

      <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search warehouses..." />

      <Table>
        <Thead><tr>
          <Th>Warehouse</Th><Th>Code</Th><Th>Location</Th><Th>Type</Th>
          <Th align="right">SKUs</Th><Th align="right">Units</Th><Th align="right">Value</Th><Th>Status</Th><Th align="right">Actions</Th>
        </tr></Thead>
        <tbody>
          {loading ? <TableSkeleton rows={3} cols={9} /> : filtered.length === 0 ? (
            <tr><td colSpan={9}><EmptyState icon={<Warehouse className="h-7 w-7" />} title="No warehouses found" /></td></tr>
          ) : filtered.map(w => (
            <Tr key={w.id} onClick={() => setSelected(w)}>
              <Td>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-lg">🏭</div>
                  <div>
                    <p className="font-semibold text-gray-900">{w.name}</p>
                    {w.name_ar && <p className="text-xs text-gray-400" dir="rtl">{w.name_ar}</p>}
                  </div>
                </div>
              </Td>
              <Td><span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{w.code}</span></Td>
              <Td><span className="text-sm text-gray-600 flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-gray-400" /> {w.city || '—'}</span></Td>
              <Td><Badge color="blue">{w.warehouse_type || 'standard'}</Badge></Td>
              <Td align="right"><span className="font-medium">{Number(w.sku_count || 0).toLocaleString()}</span></Td>
              <Td align="right"><span className="font-semibold">{Number(w.total_units || 0).toLocaleString()}</span></Td>
              <Td align="right"><span className="font-semibold text-gray-900">{formatEGP(Number(w.total_value || 0))}</span></Td>
              <Td>
                <div className="flex items-center gap-2">
                  <Badge color={w.is_active ? 'emerald' : 'gray'} dot>{w.is_active ? 'Active' : 'Inactive'}</Badge>
                  {w.is_default && <Badge color="purple">Default</Badge>}
                </div>
              </Td>
              <Td align="right">
                <button onClick={(e) => { e.stopPropagation(); setSelected(w); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition"><Eye className="h-4 w-4" /></button>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>

      <BloomModal open={!!selected} onClose={() => setSelected(null)} title={selected?.name || ''} subtitle={selected?.code}>
        {selected && (
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Type" value={selected.warehouse_type || 'standard'} />
            <InfoCard label="City" value={selected.city || '—'} />
            <InfoCard label="SKUs" value={String(Number(selected.sku_count || 0))} />
            <InfoCard label="Units" value={Number(selected.total_units || 0).toLocaleString()} />
            <InfoCard label="Value" value={formatEGP(Number(selected.total_value || 0))} />
            <InfoCard label="Status" value={selected.is_active ? '✅ Active' : '⏸️ Inactive'} />
          </div>
        )}
      </BloomModal>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500 mb-0.5">{label}</p><p className="text-sm font-semibold text-gray-900">{value}</p></div>;
}
