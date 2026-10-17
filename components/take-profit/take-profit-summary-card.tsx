'use client';

import { Button } from '@/components/ui/button';
import type { TakeProfitOverview } from '@/lib/api';
import { formatRupiah, formatDateIndo } from '@/lib/format';

interface Props {
  overview: TakeProfitOverview | null;
  onOpenWithdrawDialog: () => void;
  onOpenEditCapitalDialog: () => void;
}

export function TakeProfitSummaryCard({
  overview,
  onOpenWithdrawDialog,
  onOpenEditCapitalDialog,
}: Props) {
  if (!overview) return null;

  const {
    latestOpname,
    totalPayout,
    payoutPaid,
    payoutUnpaid,
    payoutStatus,
    minWorkingCapital,
    withdrawnCurrentPeriod,
    totalWithdrawnAllTime,
    availableToWithdraw,
    rawBalance,
    isSafe,
    warningReason,
  } = overview;

  return (
    <div className="space-y-4">
      {/* Main Headline Hero Card */}
      <div
        className={`rounded-2xl border p-6 transition-all shadow-xs ${
          isSafe
            ? 'bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-white border-emerald-200/80'
            : 'bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-white border-amber-200/80'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Live Status Penarikan Owner
              </span>
              {isSafe ? (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Halal & Aman Ditarik
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Tahan Penarikan
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <h2
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight font-mono ${
                  isSafe ? 'text-emerald-950' : 'text-amber-950'
                }`}
              >
                {formatRupiah(availableToWithdraw)}
              </h2>
              <span className="text-xs text-zinc-500 font-medium">tersedia saat ini</span>
            </div>

            <p className="text-xs text-zinc-600 max-w-2xl leading-relaxed">
              {isSafe ? (
                <>
                  Nominal ini adalah <strong className="text-emerald-800">keuntungan murni Anda</strong> yang halal untuk ditarik. Payout bagi hasil penitip ({formatRupiah(totalPayout)}) dan cadangan modal belanja ({formatRupiah(minWorkingCapital)}) sudah aman disisihkan dari kas toko.
                </>
              ) : (
                <span className="text-amber-800 font-medium">
                  {warningReason || 'Kas toko saat ini belum mencapai batas aman modal belanja dan payout penitip. Disarankan untuk menahan penarikan laba.'}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <Button
              onClick={onOpenWithdrawDialog}
              disabled={!isSafe && Number(availableToWithdraw) <= 0}
              className={`h-10 px-5 text-xs font-semibold shadow-xs ${
                isSafe
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-zinc-700 hover:bg-zinc-800 text-white'
              }`}
            >
              + Catat Tarik Laba
            </Button>
            <Button
              variant="outline"
              onClick={onOpenEditCapitalDialog}
              className="h-9 px-4 text-xs font-medium bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700"
            >
              ⚙️ Ubah Modal Belanja ({formatRupiah(minWorkingCapital)})
            </Button>
          </div>
        </div>
      </div>

      {/* Transparent Math Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Step 1: Real Cash from Latest Opname */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-medium">1. Kas Riil Opname</span>
            <span className="text-[10px] font-mono text-emerald-600 font-semibold">+ Kas Masuk</span>
          </div>
          <div className="text-lg font-bold text-zinc-900 font-mono">
            {formatRupiah(latestOpname?.realCash ?? '0')}
          </div>
          <p className="text-[11px] text-zinc-500 leading-tight">
            {latestOpname
              ? `Opname #${latestOpname.id} (${formatDateIndo(latestOpname.opnameDate)})`
              : 'Belum ada opname final'}
          </p>
        </div>

        {/* Step 2: Payout Consignors */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-medium">2. Payout Penitip</span>
            <span className="text-[10px] font-mono text-rose-600 font-semibold">- Payout</span>
          </div>
          <div className="text-lg font-bold text-rose-700 font-mono">
            {formatRupiah(totalPayout)}
          </div>
          <div className="text-[11px] leading-tight">
            {payoutStatus === 'settled' ? (
              <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                ✓ Lunas Dibayar {payoutPaid && Number(payoutPaid) > 0 ? `(${formatRupiah(payoutPaid)})` : ''}
              </span>
            ) : payoutStatus === 'partial' ? (
              <span className="text-amber-700 font-medium">
                Dibayar: {formatRupiah(payoutPaid)} · Sisa: {formatRupiah(payoutUnpaid)}
              </span>
            ) : (
              <span className="text-zinc-500">
                Belum Dibayarkan ({formatRupiah(payoutUnpaid)})
              </span>
            )}
          </div>
        </div>

        {/* Step 3: Working Capital Buffer */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-medium">3. Modal Belanja Wajib</span>
            <span className="text-[10px] font-mono text-blue-600 font-semibold">- Terkunci</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-blue-700 font-mono">
              {formatRupiah(minWorkingCapital)}
            </div>
            <button
              onClick={onOpenEditCapitalDialog}
              className="text-[11px] text-[#D97757] hover:underline font-medium"
            >
              Ubah
            </button>
          </div>
          <p className="text-[11px] text-zinc-500 leading-tight">
            Cadangan modal kas belanja barang dagangan periode berikutnya.
          </p>
        </div>

        {/* Step 4: Withdrawn Current Period */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-medium">4. Ditarik Periode Ini</span>
            <span className="text-[10px] font-mono text-zinc-600 font-semibold">- Terambil</span>
          </div>
          <div className="text-lg font-bold text-zinc-800 font-mono">
            {formatRupiah(withdrawnCurrentPeriod)}
          </div>
          <p className="text-[11px] text-zinc-500 leading-tight">
            Total laba yang telah Anda tarik sejak opname terakhir.
          </p>
        </div>
      </div>

      {/* Aggregate All-Time Information Banner */}
      <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-zinc-600 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-700">📊 Saldo Kas Bersih Toko Saat Ini:</span>
          <span className="font-mono font-bold text-zinc-900">{formatRupiah(rawBalance)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Total Penarikan Owner Sepanjang Masa:</span>
          <span className="font-mono font-bold text-zinc-800">{formatRupiah(totalWithdrawnAllTime)}</span>
        </div>
      </div>
    </div>
  );
}
