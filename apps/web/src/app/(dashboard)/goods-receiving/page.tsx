'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api-client';
import { formatEGP, cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard, StatCardGrid } from '@/components/ui/stat-card';
import { SearchFilter, FilterTabs } from '@/components/ui/search-filter';
import { BloomModal, BtnPrimary, BtnSecondary } from '@/components/ui/bloom-modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState, TableSkeleton } from '@/components/ui/empty-state';
import { Table, Thead, Th, Td, Tr } from '@/components/ui/table';
import { ClipboardCheck, RefreshCw, Eye, Package, Clock, CheckCircle2, Truck } from 'lucide-react';

interface GRN {
  id: string; grn_number: string; po_id?: string; po_number?: string;
  vendor_name?: string; warehouse_name?: string; status: string;
  total_items?: number; total_cost?: number; received_at?: string;
  created_at: string; notes?: string;
}

const statusConfig: Record<string, { color: 'amber' | 'blue' | 'emerald' | 'red' | 'gray'; label: string }> = {
  draft: { color: 'gray', label: 'Draft' }, pending: { color: 'amber', label: 'Pending' },
  partial: { color: 'blue', label: 'Partial' }, received: { color: 'emerald', label: 'Received' },
  completed: { color: 'emerald', label: 'Completed' }, cancelled: { color: 'red', label: 'Cancelled' },
};

export default function GRNPage() {
  const { t } = useI18n();
  const [grns, setGrns] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<GRN | null>(null);

  const fetchGRN = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/purchasing/grn');
      const data = res?.data?.rows || res?.data || res?.rows || (Array.isArray(res) ? res : []);
      setGrns(Array.isArray(data) ? data : []);
    } catch { setGrns([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGRN(); }, [fetchGRN]);

  const filtered = grns.filter(g => {
    const matchSearch = `${g.grn_number} ${g.po_number || ''} ${g.vendor_name || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || g.status === filter;
    return matchSearch && matchFilter;
  });

  const completed = grns.filter(g => g.status === 'received' || g.status === 'completed').length;
  const pending = grns.filter(g => g.status === 'pending' || g.status === 'draft').length;
  const totalCost = grns.reduce((s, g) => s + Number(g.total_cost || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader title={t('grn.title') || 'Goods Receiving (GRN)'} subtitle="Track incoming shipments and update inventory"
        icon={<ClipboardCheck className="h-5 w-5" />}
        actions={<button onClick={fetchGRN} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition"><RefreshCw className="h-4 w-4" /></button>}
      />

      <StatCardGrid cols={4}>
        <StatCard label="Total GRNs" value={grns.length} icon={<ClipboardCheck className="h-5 w-5" />} color="emerald" />
        <StatCard label="Completed" value={completed} icon={<CheckCircle2 className="h-5 w-5" />} color="blue" />
        <StatCard label="Pending" value={pending} icon={<Clock className="h-5 w-5" />} color="amber" />
        <StatCard label="Total Cost" value={formatEGP(totalCost)} icon={<Package className="h-5 w-5" />} color="teal" />
      </StatCardGrid>

      <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search GRN number, PO, or vendor..."
        filters={<FilterTabs tabs={[
          { key: 'all', label: 'All', count: grns.length },
          { key: 'pending', label: '⏳ Pending', count: pending },
          { key: 'received', label: '✅ Received', count: completed },
        ]} active={filter} onChange={setFilter} />}
      />

      <Table>
        <Thead><tr>
          <Th>GRN #</Th><Th>PO #</Th><Th>Vendor</Th><Th>Warehouse</Th>
          <Th align="right">Items</Th><Th align="right">Cost</Th><Th>Status</Th><Th>Date</Th><Th align="right">Actions</Th>
        </tr></Thead>
        <tbody>
          {loading ? <TableSkeleton rows={4} cols={9} /> : filtered.length === 0 ? (
            <tr><td colSpan={9}><EmptyState icon={<ClipboardCheck className="h-7 w-7" />} title="No GRNs found" /></td></tr>
          ) : filtered.map(g => {
            const sc = statusConfig[g.status] || statusConfig.pending;
            return (
              <Tr key={g.id} onClick={() => setSelected(g)}>
                <Td><span className="font-mono text-xs font-semibold text-gray-900">{g.grn_number}</span></Td>
                <Td><span className="font-mono text-xs text-gray-500">{g.po_number || '—'}</span></Td>
                <Td><span className="text-sm text-gray-700">{g.vendor_name || '—'}</span></Td>
                <Td><span className="text-sm text-gray-600">{g.warehouse_name || '—'}</span></Td>
                <Td align="right"><span className="font-medium">{g.total_items || 0}</span></Td>
                <Td align="right"><span className="font-semibold text-gray-900">{formatEGP(Number(g.total_cost || 0))}</span></Td>
                <Td><Badge color={sc.color} dot>{sc.label}</Badge></Td>
                <Td><span className="text-sm text-gray-500">{new Date(g.created_at).toLocaleDateString('en-GB')}</span></Td>
                <Td align="right">
                  <button onClick={(e) => { e.stopPropagation(); setSelected(g); }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition"><Eye className="h-4 w-4" /></button>
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>

      <BloomModal open={!!selected} onClose={() => setSelected(null)} title={`GRN ${selected?.grn_number || ''}`} subtitle={`Vendor: ${selected?.vendor_name || '—'}`} size="md">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="PO Number" value={selected.po_number || '—'} />
              <InfoCard label="Warehouse" value={selected.warehouse_name || '—'} />
              <InfoCard label="Status" value={(statusConfig[selected.status] || statusConfig.pending).label} />
              <InfoCard label="Total Cost" value={formatEGP(Number(selected.total_cost || 0))} />
              <InfoCard label="Items" value={String(selected.total_items || 0)} />
              <InfoCard label="Date" value={new Date(selected.created_at).toLocaleDateString('en-GB')} />
            </div>
            {selected.notes && <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500 mb-1">Notes</p><p className="text-sm text-gray-700">{selected.notes}</p></div>}
          </div>
        )}
      </BloomModal>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500 mb-0.5">{label}</p><p className="text-sm font-semibold text-gray-900">{value}</p></div>;
}
