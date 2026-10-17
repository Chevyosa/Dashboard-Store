'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  getTakeProfitOverview,
  listTakeProfits,
  deleteTakeProfit,
  type TakeProfitOverview,
  type TakeProfitItem,
} from '@/lib/api';
import { formatRupiah } from '@/lib/format';
import { TakeProfitSummaryCard } from '@/components/take-profit/take-profit-summary-card';
import { TakeProfitTable } from '@/components/take-profit/take-profit-table';
import { TakeProfitDialog } from '@/components/take-profit/take-profit-dialog';
import { EditCapitalDialog } from '@/components/take-profit/edit-capital-dialog';

export default function TakeProfitPage() {
  const [overview, setOverview] = useState<TakeProfitOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  const [withdrawals, setWithdrawals] = useState<TakeProfitItem[]>([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dialogs
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [editCapitalDialogOpen, setEditCapitalDialogOpen] = useState(false);

  // Messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadOverview() {
    setLoadingOverview(true);
    try {
      const res = await getTakeProfitOverview();
      setOverview(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat ringkasan take profit.';
      setErrorMessage(msg);
    } finally {
      setLoadingOverview(false);
    }
  }

  async function loadWithdrawals(page = 1) {
    setLoadingTable(true);
    try {
      const res = await listTakeProfits({
        page,
        limit: 10,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setWithdrawals(res.data);
      setPagination(res.pagination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat riwayat penarikan laba.';
      setErrorMessage(msg);
    } finally {
      setLoadingTable(false);
    }
  }

  useEffect(() => {
    loadOverview();
    loadWithdrawals(1);
  }, []);

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadWithdrawals(1);
  }

  function handleResetFilter() {
    setStartDate('');
    setEndDate('');
    listTakeProfits({ page: 1, limit: 10 }).then((res) => {
      setWithdrawals(res.data);
      setPagination(res.pagination);
    });
  }

  function handleWithdrawSaved(item: TakeProfitItem) {
    setSuccessMessage(
      `Penarikan laba sebesar ${formatRupiah(item.amount)} berhasil dicatat ke dalam pembukuan toko.`,
    );
    loadOverview();
    loadWithdrawals(1);
    setTimeout(() => setSuccessMessage(null), 5000);
  }

  function handleCapitalSaved(newCapital: string) {
    setSuccessMessage(
      `Batas cadangan modal belanja berhasil diubah menjadi ${formatRupiah(newCapital)}.`,
    );
    loadOverview();
    setTimeout(() => setSuccessMessage(null), 5000);
  }

  async function handleDeleteWithdrawal(item: TakeProfitItem) {
    try {
      await deleteTakeProfit(item.id);
      setSuccessMessage(
        `Catatan penarikan laba ${formatRupiah(item.amount)} berhasil dihapus dan saldo kas dikembalikan.`,
      );
      loadOverview();
      loadWithdrawals(pagination.page);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus catatan penarikan laba.';
      setErrorMessage(msg);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">
            Take Profit
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Pusat penarikan laba bersih owner yang aman dengan proteksi modal belanja dan hak penitip.
          </p>
        </div>

        <Button
          onClick={() => setWithdrawDialogOpen(true)}
          className="bg-[#D97757] hover:bg-[#c26243] text-white text-xs h-9 px-4 font-medium shadow-xs shrink-0 self-start sm:self-auto"
        >
          + Catat Tarik Laba
        </Button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Summary Card with Live Calculation */}
      {loadingOverview ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-xs text-zinc-500 shadow-xs">
          Menghitung ketersediaan kas riil dan cadangan modal belanja...
        </div>
      ) : (
        <TakeProfitSummaryCard
          overview={overview}
          onOpenWithdrawDialog={() => setWithdrawDialogOpen(true)}
          onOpenEditCapitalDialog={() => setEditCapitalDialogOpen(true)}
        />
      )}

      {/* History Section */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-900">Riwayat Penarikan Laba (Prive)</h2>
            <p className="text-[11px] text-zinc-500">
              Daftar penarikan uang kas yang telah dilakukan oleh pemilik toko.
            </p>
          </div>

          {/* Filter Bar */}
          <form onSubmit={handleFilterSubmit} className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-mono text-zinc-700"
              placeholder="Dari"
            />
            <span className="text-xs text-zinc-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-mono text-zinc-700"
              placeholder="Sampai"
            />
            <Button type="submit" variant="outline" size="sm" className="h-8 text-xs px-2.5">
              Filter
            </Button>
            {(startDate || endDate) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilter}
                className="h-8 text-xs px-2 text-zinc-500"
              >
                Reset
              </Button>
            )}
          </form>
        </div>

        {/* Withdrawals Table */}
        <TakeProfitTable
          items={withdrawals}
          loading={loadingTable}
          onDelete={handleDeleteWithdrawal}
          pagination={pagination}
          onPageChange={(page) => loadWithdrawals(page)}
        />
      </div>

      {/* Dialogs */}
      <TakeProfitDialog
        open={withdrawDialogOpen}
        onClose={() => setWithdrawDialogOpen(false)}
        onSaved={handleWithdrawSaved}
        overview={overview}
      />

      <EditCapitalDialog
        open={editCapitalDialogOpen}
        currentValue={overview?.minWorkingCapital ?? '400000'}
        onClose={() => setEditCapitalDialogOpen(false)}
        onSaved={handleCapitalSaved}
      />
    </div>
  );
}
