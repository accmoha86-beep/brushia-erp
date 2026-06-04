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
import { FileText, Plus, RefreshCw, Eye, Clock, CheckCircle2, DollarSign, Package, Truck } from 'lucide-react';

interface PO {
  id: string; po_number: string; vendor_id?: string; vendor_name?: string;
  status: string; total_amount?: number; currency?: string;
  expected_delivery?: string; created_at: string; notes?: string;
  item_count?: number;
}

const statusConfig: Record<string, { color: 'gray' | 'amber' | 'blue' | 'emerald' | 'red' | 'purple'; label: string }> = {
  draft: { color: 'gray', label: 'Draft' }, pending: { color: 'amber', label: 'Pending' },
  approved: { color: 'blue', label: 'Approved' }, ordered: { color: 'purple', label: 'Ordered' },
  received: { color: 'emerald', label: 'Received' }, completed: { color: 'emerald', label: 'Completed' },
  cancelled: { color: 'red', label: 'Cancelled' },
};

export default function PurchaseOrdersPage() {
  const { t } = useI18n();
  const [pos, setPOs] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<PO | null>(null);

  const fetchPOs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/purchasing/orders');
      const data = res?.data?.rows || res?.data || res?.rows || (Array.isArray(res) ? res : []);
      setPOs(Array.isArray(data) ? data : []);
    } catch { setPOs([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPOs(); }, [fetchPOs]);

  const filtered = pos.filter(p => {
    const matchSearch = `${p.po_number} ${p.vendor_name || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const totalValue = pos.reduce((s, p) => s + Number(p.total_amount || 0), 0);
  const pendingCount = pos.filter(p => p.status === 'pending' || p.status === 'draft').length;
  const completedCount = pos.filter(p => p.status === 'received' || p.status === 'completed').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader title={t('purchaseOrders.title') || 'Purchase Orders'} subtitle="Create and track orders from vendors"
        icon={<FileText className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            <button onClick={fetchPOs} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition"><RefreshCw className="h-4 w-4" /></button>
            <BtnPrimary className="flex items-center gap-2"><Plus className="h-4 w-4" /> New PO</BtnPrimary>
          </div>
        }
      />

      <StatCardGrid cols={4}>
        <StatCard label="Total POs" value={pos.length} icon={<FileText className="h-5 w-5" />} color="emerald" />
        <StatCard label="Total Value" value={formatEGP(totalValue)} icon={<DollarSign className="h-5 w-5" />} color="blue" />
        <StatCard label="Pending" value={pendingCount} icon={<Clock className="h-5 w-5" />} color="amber" />
        <StatCard label="Completed" value={completedCount} icon={<CheckCircle2 className="h-5 w-5" />} color="teal" />
      </StatCardGrid>

      <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search PO number or vendor..."
        filters={<FilterTabs tabs={[
          { key: 'all', label: 'All', count: pos.length },
          { key: 'pending', label: '⏳ Pending', count: pendingCount },
          { key: 'approved', label: '✅ Approved' },
          { key: 'received', label: '📦 Received', count: completedCount },
        ]} active={filter} onChange={setFilter} />}
      />

      <Table>
        <Thead><tr>
          <Th>PO #</Th><Th>Vendor</Th><Th>Status</Th><Th align="right">Items</Th>
          <Th align="right">Total</Th><Th>Expected</Th><Th>Date</Th><Th align="right">Actions</Th>
        </tr></Thead>
        <tbody>
          {loading ? <TableSkeleton rows={4} cols={8} /> : filtered.length === 0 ? (
            <tr><td colSpan={8}><EmptyState icon={<FileText className="h-7 w-7" />} title="No purchase orders" description="Create your first purchase order" /></td></tr>
          ) : filtered.map(p => {
            const sc = statusConfig[p.status] || statusConfig.draft;
            return (
              <Tr key={p.id} onClick={() => setSelected(p)}>
                <Td><span className="font-mono text-xs font-semibold text-gray-900">{p.po_number}</span></Td>
                <Td><span className="text-sm text-gray-700">{p.vendor_name || '—'}</span></Td>
                <Td><Badge color={sc.color} dot>{sc.label}</Badge></Td>
                <Td align="right"><span className="font-medium">{p.item_count || 0}</span></Td>
                <Td align="right"><span className="font-semibold text-gray-900">{formatEGP(Number(p.total_amount || 0))}</span></Td>
                <Td><span className="text-sm text-gray-500">{p.expected_delivery ? new Date(p.expected_delivery).toLocaleDateString('en-GB') : '—'}</span></Td>
                <Td><span className="text-sm text-gray-500">{new Date(p.created_at).toLocaleDateString('en-GB')}</span></Td>
                <Td align="right">
                  <button onClick={(e) => { e.stopPropagation(); setSelected(p); }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition"><Eye className="h-4 w-4" /></button>
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>

      <BloomModal open={!!selected} onClose={() => setSelected(null)} title={`PO ${selected?.po_number || ''}`} subtitle={`Vendor: ${selected?.vendor_name || '—'}`}>
        {selected && (
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Status" value={(statusConfig[selected.status] || statusConfig.draft).label} />
            <InfoCard label="Total" value={formatEGP(Number(selected.total_amount || 0))} />
            <InfoCard label="Items" value={String(selected.item_count || 0)} />
            <InfoCard label="Expected Delivery" value={selected.expected_delivery ? new Date(selected.expected_delivery).toLocaleDateString('en-GB') : '—'} />
          </div>
        )}
      </BloomModal>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500 mb-0.5">{label}</p><p className="text-sm font-semibold text-gray-900">{value}</p></div>;
}
