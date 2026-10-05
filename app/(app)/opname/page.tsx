'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  deleteDraftOpname,
  getOpnames,
  type OpnameRecord,
} from '@/lib/api';
import { formatDateIndo } from '@/lib/format';
import { OpnameCard } from '@/components/opname/opname-card';
import { OpnameDetailDialog } from '@/components/opname/opname-detail-dialog';
import { OpnameTable } from '@/components/opname/opname-table';
import { OpnameWizard } from '@/components/opname/opname-wizard';

export default function OpnamePage() {
  const [opnames, setOpnames] = useState<OpnameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardInitialDate, setWizardInitialDate] = useState<string | undefined>(undefined);

  // Detail dialog state
  const [detailOpnameId, setDetailOpnameId] = useState<number | null>(null);

  // Delete draft target
  const [draftToDelete, setDraftToDelete] = useState<OpnameRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'final' | 'draft'>('all');

  useEffect(() => {
    let ignore = false;

    async function initialFetch() {
      try {
        const res = await getOpnames({ limit: 100 });
        if (!ignore) {
          setOpnames(res.data);
          setErrorMessage(null);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Gagal memuat data riwayat opname.',
          );
          setLoading(false);
        }
      }
    }

    void initialFetch();
    return () => {
      ignore = true;
    };
  }, []);

  // Check for active draft
  const activeDraft = useMemo(() => {
    return opnames.find((o) => o.status === 'draft');
  }, [opnames]);

  // Filtered opnames
  const filteredOpnames = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return opnames.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      if (q) {
        const matchDate = item.opnameDate.includes(q);
        const matchDateIndo = formatDateIndo(item.opnameDate).toLowerCase().includes(q);
        const matchNote = item.note?.toLowerCase().includes(q) ?? false;
        if (!matchDate && !matchDateIndo && !matchNote) return false;
      }

      return true;
    });
  }, [opnames, statusFilter, searchQuery]);

  // Overall KPI
  const stats = useMemo(() => {
    const finalOpnames = opnames.filter((o) => o.status === 'final');
    const totalFinal = finalOpnames.length;
    let totalPcs = 0;
    for (const o of finalOpnames) {
      totalPcs += o.totalSoldQty;
    }
    const latestFinal = finalOpnames[0];

    return {
      totalFinal,
      totalPcs,
      latestDate: latestFinal ? latestFinal.opnameDate : null,
    };
  }, [opnames]);

  function handleStartNew() {
    setWizardInitialDate(undefined);
    setWizardOpen(true);
  }

  function handleResumeDraft(draft: OpnameRecord) {
    setWizardInitialDate(draft.opnameDate);
    setWizardOpen(true);
  }

  async function handleConfirmDeleteDraft() {
    if (!draftToDelete) return;
    try {
      setDeleting(true);
      await deleteDraftOpname(draftToDelete.id);
      setOpnames((prev) => prev.filter((o) => o.id !== draftToDelete.id));
      setDraftToDelete(null);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal menghapus draf opname.',
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleWizardSuccess(saved: OpnameRecord) {
    setWizardOpen(false);
    setOpnames((prev) => {
      const idx = prev.findIndex((o) => o.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    setDetailOpnameId(saved.id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Opname & Penutupan Periode
          </h1>
          <p className="text-xs text-zinc-500">
            Penghitungan stok fisik periodik untuk menurunkan omset, laba, dan hak bayar penitip.
          </p>
        </div>

        {!wizardOpen && (
          <Button
            type="button"
            onClick={handleStartNew}
            className="h-9 px-4 text-xs font-bold bg-[#D97757] hover:bg-[#c26243] text-white shadow-xs shrink-0 self-start sm:self-auto"
          >
            + Mulai Opname Baru
          </Button>
        )}
      </div>

      {/* Active Draft Banner */}
      {!wizardOpen && activeDraft && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h2 className="text-xs font-bold text-amber-900">
                Ada Draf Opname Belum Difinalisasi
              </h2>
              <p className="text-[11px] text-amber-700">
                Opname tanggal <strong>{formatDateIndo(activeDraft.opnameDate)}</strong> ({activeDraft.opnameDate})
                tersimpan sebagai draf dan belum menutup periode.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              size="sm"
              onClick={() => handleResumeDraft(activeDraft)}
              className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
            >
              Lanjutkan Draf
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDraftToDelete(activeDraft)}
              className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
            >
              Hapus
            </Button>
          </div>
        </div>
      )}

      {/* Wizard Flow if Open */}
      {wizardOpen ? (
        <OpnameWizard
          initialDate={wizardInitialDate}
          onSuccess={handleWizardSuccess}
          onCancel={() => setWizardOpen(false)}
        />
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
              <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
                Total Opname Selesai
              </span>
              <div className="mt-1 font-mono text-xl font-bold text-zinc-900">
                {stats.totalFinal} periode
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {stats.latestDate ? `Terakhir: ${formatDateIndo(stats.latestDate)}` : 'Belum pernah opname'}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
              <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
                Total Barang Terjual
              </span>
              <div className="mt-1 font-mono text-xl font-bold text-zinc-900">
                {stats.totalPcs} pcs
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Akumulasi seluruh periode final
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium text-orange-700 uppercase tracking-wider block">
                Prinsip Pure Opname
              </span>
              <div className="mt-1 text-xs font-semibold text-zinc-800">
                Expected − Fisik − Loss = Terjual
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Penjualan diturunkan murni dari stok fisik
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Input
                type="text"
                placeholder="Cari tanggal atau catatan..."
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

            <div className="flex items-center gap-1.5 text-xs shrink-0">
              <span className="text-[11px] text-zinc-400 hidden sm:inline">Status:</span>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-zinc-800 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('final')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  statusFilter === 'final'
                    ? 'bg-zinc-800 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Final
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('draft')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  statusFilter === 'draft'
                    ? 'bg-zinc-800 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Draf
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Data List */}
          {loading ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-500 shadow-xs">
              Memuat riwayat opname...
            </div>
          ) : (
            <>
              <div className="hidden sm:block">
                <OpnameTable
                  opnames={filteredOpnames}
                  onViewDetail={(item) => setDetailOpnameId(item.id)}
                  onResumeDraft={handleResumeDraft}
                  onDeleteDraft={(item) => setDraftToDelete(item)}
                />
              </div>

              <div className="sm:hidden space-y-3">
                {filteredOpnames.length === 0 ? (
                  <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-xs text-zinc-500">
                    Belum ada riwayat penutupan periode (opname).
                  </div>
                ) : (
                  filteredOpnames.map((item) => (
                    <OpnameCard
                      key={item.id}
                      opname={item}
                      onViewDetail={(target) => setDetailOpnameId(target.id)}
                      onResumeDraft={handleResumeDraft}
                      onDeleteDraft={(target) => setDraftToDelete(target)}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Detail Dialog */}
      <OpnameDetailDialog
        opnameId={detailOpnameId}
        onClose={() => setDetailOpnameId(null)}
      />

      {/* Delete Draft Confirmation Dialog */}
      {draftToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl border border-zinc-200 space-y-3">
            <h2 className="text-sm font-bold text-zinc-900">Hapus Draf Opname?</h2>
            <p className="text-xs text-zinc-600">
              Apakah Anda yakin ingin menghapus draf opname tanggal{' '}
              <strong>{formatDateIndo(draftToDelete.opnameDate)}</strong>? Hitungan fisik yang
              belum difinalisasi akan hilang.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={deleting}
                onClick={() => setDraftToDelete(null)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={deleting}
                onClick={() => void handleConfirmDeleteDraft()}
                className="text-xs bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus Draf'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
