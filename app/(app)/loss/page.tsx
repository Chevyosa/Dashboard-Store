'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  deleteLoss,
  getLosses,
  getOpenPeriodLossSummary,
  getProducts,
  type LossBorneBy,
  type LossReason,
  type LossRecord,
  type LossSummary,
  type Product,
} from '@/lib/api';
import { DeleteLossDialog } from '@/components/loss/delete-loss-dialog';
import { LossCard } from '@/components/loss/loss-card';
import { LossDialog } from '@/components/loss/loss-dialog';
import { LOSS_REASON_LABELS } from '@/components/loss/loss-reason-badge';
import { LossTable } from '@/components/loss/loss-table';

type PeriodFilter = 'open' | 'all';
type ReasonFilter = 'all' | LossReason;
type BorneFilter = 'all' | LossBorneBy;

export default function LossPage() {
  const [losses, setLosses] = useState<LossRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<LossSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('open');
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>('all');
  const [borneFilter, setBorneFilter] = useState<BorneFilter>('all');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLoss, setSelectedLoss] = useState<LossRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LossRecord | null>(null);

  async function loadData() {
    try {
      const [lossRes, prodRes, sumRes] = await Promise.all([
        getLosses({ limit: 100 }),
        getProducts({ limit: 100 }),
        getOpenPeriodLossSummary(),
      ]);
      setLosses(lossRes.data);
      setProducts(prodRes.data);
      setSummary(sumRes.data);
      setErrorMessage(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Gagal memuat data loss.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function initialFetch() {
      try {
        const [lossRes, prodRes, sumRes] = await Promise.all([
          getLosses({ limit: 100 }),
          getProducts({ limit: 100 }),
          getOpenPeriodLossSummary(),
        ]);
        if (!ignore) {
          setLosses(lossRes.data);
          setProducts(prodRes.data);
          setSummary(sumRes.data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof Error) {
            setErrorMessage(err.message);
          } else {
            setErrorMessage('Gagal memuat data loss.');
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

  // Filtered losses
  const filteredLosses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return losses.filter((item) => {
      if (periodFilter === 'open' && item.opnameId !== null) return false;
      if (reasonFilter !== 'all' && item.reason !== reasonFilter) return false;
      if (borneFilter !== 'all' && item.borneBy !== borneFilter) return false;

      if (q) {
        const matchProduct = item.productName.toLowerCase().includes(q);
        const matchConsignor = item.consignorName?.toLowerCase().includes(q) ?? false;
        const matchNote = item.note?.toLowerCase().includes(q) ?? false;
        const matchDate = item.date.includes(q);
        if (!matchProduct && !matchConsignor && !matchNote && !matchDate) return false;
      }

      return true;
    });
  }, [losses, periodFilter, reasonFilter, borneFilter, searchQuery]);

  function handleOpenCreate() {
    setSelectedLoss(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(item: LossRecord) {
    setSelectedLoss(item);
    setDialogOpen(true);
  }

  function handleLossSaved(saved: LossRecord) {
    setLosses((prev) => {
      const idx = prev.findIndex((l) => l.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    void loadData(); // refresh summary
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    await deleteLoss(deleteTarget.id);
    setLosses((prev) => prev.filter((l) => l.id !== deleteTarget.id));
    void loadData(); // refresh summary
  }

  // Top reason in open period
  const topReasonSummary = useMemo(() => {
    if (!summary) return null;
    const entries = Object.entries(summary.breakdownByReason) as [LossReason, number][];
    entries.sort((a, b) => b[1] - a[1]);
    const top = entries[0];
    if (!top || top[1] === 0) return null;
    return { reason: top[0], pcs: top[1] };
  }, [summary]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Barang Rusak & Hilang (Loss)
          </h1>
          <p className="text-xs text-zinc-500">
            Pencatatan mutasi barang berkurang di luar penjualan untuk dialokasikan saat opname.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreate}
          className="h-9 px-4 text-xs font-medium bg-[#D97757] hover:bg-[#c26243] text-white shadow-xs shrink-0 self-start sm:self-auto"
        >
          + Catat Loss Baru
        </Button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-zinc-400" />
            Total Loss (Terbuka)
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-zinc-900">
            {summary ? `${summary.totalPcs} pcs` : '—'}
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            {summary ? `${summary.totalRecords} catatan mutasi` : ''}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-zinc-700 flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-zinc-800" />
            Ditanggung Owner
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-zinc-900">
            {summary ? `${summary.totalOwnerBornePcs} pcs` : '—'}
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5">Memotong Profit A</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-orange-700 flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-[#D97757]" />
            Ditanggung Penitip
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-orange-950">
            {summary ? `${summary.totalConsignorBornePcs} pcs` : '—'}
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5">Tanpa ganti rugi uang</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Faktor Dominan
          </div>
          <div className="mt-1 text-sm font-bold text-zinc-900 truncate">
            {topReasonSummary ? LOSS_REASON_LABELS[topReasonSummary.reason] : 'Belum ada'}
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
            {topReasonSummary ? `${topReasonSummary.pcs} pcs` : 'Periode berjalan'}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Input
              type="text"
              placeholder="Cari nama produk, mitra, catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs pl-8 pr-7"
            />
            <span className="absolute left-2.5 top-2 text-zinc-400 text-xs">🔍</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Period Filter Buttons */}
          <div className="flex items-center gap-1.5 text-xs shrink-0">
            <span className="text-[11px] text-zinc-400 hidden sm:inline">Periode:</span>
            <button
              type="button"
              onClick={() => setPeriodFilter('open')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                periodFilter === 'open'
                  ? 'bg-zinc-800 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Terbuka (Berjalan)
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                periodFilter === 'all'
                  ? 'bg-zinc-800 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Semua Riwayat
            </button>
          </div>
        </div>

        {/* Reason & Borne Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-zinc-400">Alasan:</span>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value as ReasonFilter)}
              className="h-7 rounded border border-zinc-200 bg-white px-2 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#D97757]"
            >
              <option value="all">Semua Alasan</option>
              <option value="expired">Kadaluwarsa</option>
              <option value="damaged_on_display">Rusak di Etalase</option>
              <option value="damaged_before_display">Rusak Sebelum Dipajang</option>
              <option value="lost">Hilang</option>
              <option value="other">Lainnya</option>
            </select>
          </div>

          <div className="flex items-center gap-1 ml-2">
            <span className="text-[11px] text-zinc-400">Penanggung:</span>
            <select
              value={borneFilter}
              onChange={(e) => setBorneFilter(e.target.value as BorneFilter)}
              className="h-7 rounded border border-zinc-200 bg-white px-2 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#D97757]"
            >
              <option value="all">Semua Penanggung</option>
              <option value="owner">Aku (Owner)</option>
              <option value="consignor">Penitip</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Loading & Data Display */}
      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-500 shadow-xs">
          Memuat data catatan loss...
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <LossTable
              losses={filteredLosses}
              onEdit={handleOpenEdit}
              onDelete={(item) => setDeleteTarget(item)}
            />
          </div>

          {/* Mobile Card List View */}
          <div className="sm:hidden space-y-3">
            {filteredLosses.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-xs text-zinc-500">
                Belum ada catatan barang rusak atau hilang.
              </div>
            ) : (
              filteredLosses.map((item) => (
                <LossCard
                  key={item.id}
                  loss={item}
                  onEdit={handleOpenEdit}
                  onDelete={(target) => setDeleteTarget(target)}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Dialogs */}
      <LossDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={handleLossSaved}
        initialData={selectedLoss}
        products={products}
      />

      <DeleteLossDialog
        open={Boolean(deleteTarget)}
        loss={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
