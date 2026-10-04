'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getConsignors, type Consignor } from '@/lib/api';
import { ConsignorDialog } from '@/components/penitip/consignor-dialog';
import { ConsignorStatusDialog } from '@/components/penitip/consignor-status-dialog';
import { ConsignorTable } from '@/components/penitip/consignor-table';
import { ConsignorCard } from '@/components/penitip/consignor-card';

type StatusFilter = 'all' | 'active' | 'inactive';

export default function PenitipPage() {
  const [consignors, setConsignors] = useState<Consignor[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConsignor, setSelectedConsignor] = useState<Consignor | null>(null);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusTargetConsignor, setStatusTargetConsignor] = useState<Consignor | null>(null);

  async function loadConsignors() {
    setLoading(true);
    setErrorMessage(null);
    try {
      // Ambil semua data (page 1, limit 100)
      const res = await getConsignors({ limit: 100 });
      setConsignors(res.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Gagal memuat daftar penitip.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function initialFetch() {
      try {
        const res = await getConsignors({ limit: 100 });
        if (!ignore) {
          setConsignors(res.data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof Error) {
            setErrorMessage(err.message);
          } else {
            setErrorMessage('Gagal memuat daftar penitip.');
          }
          setLoading(false);
        }
      }
    }

    void initialFetch();

    return () => {
      ignore = true;
    };
  }, []);

  // Filtered consignors
  const filteredConsignors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return consignors.filter((c) => {
      // Status filter
      if (statusFilter === 'active' && !c.isActive) return false;
      if (statusFilter === 'inactive' && c.isActive) return false;

      // Search query
      if (q) {
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q) ?? false;
        const matchNote = c.note?.toLowerCase().includes(q) ?? false;
        if (!matchName && !matchPhone && !matchNote) return false;
      }

      return true;
    });
  }, [consignors, statusFilter, searchQuery]);

  // Summary counts
  const totalCount = consignors.length;
  const activeCount = consignors.filter((c) => c.isActive).length;
  const inactiveCount = totalCount - activeCount;

  function handleOpenCreate() {
    setSelectedConsignor(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(consignor: Consignor) {
    setSelectedConsignor(consignor);
    setDialogOpen(true);
  }

  function handleOpenStatusToggle(consignor: Consignor) {
    setStatusTargetConsignor(consignor);
    setStatusDialogOpen(true);
  }

  function handleSaved(saved: Consignor) {
    setConsignors((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  }

  function handleStatusChanged(updated: Consignor) {
    setConsignors((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">
            Master Penitip
          </h1>
          <p className="text-xs text-zinc-500">
            Kelola mitra konsinyasi titipan jualan warung dan skema margin default.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreate}
          className="bg-[#D97757] hover:bg-[#c26243] text-white font-medium text-xs h-9 px-4 shrink-0 shadow-xs"
        >
          <span className="text-sm mr-1 leading-none">+</span> Tambah Penitip
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Total Penitip
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-zinc-900">
            {totalCount}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Aktif
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-emerald-700">
            {activeCount}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-zinc-300" />
            Nonaktif
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-zinc-500">
            {inactiveCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-xs">
        <div className="relative flex-1">
          <Input
            type="search"
            placeholder="Cari nama, nomor telepon, atau catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 text-xs pl-8 border-zinc-200"
          />
          <span className="absolute left-2.5 top-2.5 text-zinc-400 text-xs">🔍</span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 shrink-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Semua ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'active'
                ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Aktif ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-white text-zinc-800 shadow-xs font-semibold'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Nonaktif ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center justify-between">
          <span>{errorMessage}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadConsignors}
            className="h-7 text-xs bg-white"
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-400 space-y-2">
          <div className="inline-block animate-spin text-lg">⏳</div>
          <p>Memuat daftar penitip...</p>
        </div>
      ) : filteredConsignors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-12 text-center space-y-3">
          <div className="inline-flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 font-mono text-sm">
            👥
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-800">
              {searchQuery || statusFilter !== 'all'
                ? 'Tidak ada penitip yang cocok'
                : 'Belum ada data penitip'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Coba sesuaikan kata kunci pencarian atau ubah tab filter status.'
                : 'Mulai dengan menambahkan mitra konsinyasi pertama Anda untuk memudahkan pengelolaan stok titipan.'}
            </p>
          </div>
          {!searchQuery && statusFilter === 'all' && (
            <Button
              type="button"
              onClick={handleOpenCreate}
              size="sm"
              className="bg-[#D97757] hover:bg-[#c26243] text-white text-xs mt-2"
            >
              + Tambah Penitip Sekarang
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <ConsignorTable
              consignors={filteredConsignors}
              onEdit={handleOpenEdit}
              onToggleStatus={handleOpenStatusToggle}
            />
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredConsignors.map((c) => (
              <ConsignorCard
                key={c.id}
                consignor={c}
                onEdit={handleOpenEdit}
                onToggleStatus={handleOpenStatusToggle}
              />
            ))}
          </div>
        </>
      )}

      {/* Dialogs */}
      <ConsignorDialog
        open={dialogOpen}
        initialData={selectedConsignor}
        onClose={() => setDialogOpen(false)}
        onSaved={handleSaved}
      />

      <ConsignorStatusDialog
        open={statusDialogOpen}
        consignor={statusTargetConsignor}
        onClose={() => setStatusDialogOpen(false)}
        onStatusChanged={handleStatusChanged}
      />
    </div>
  );
}
