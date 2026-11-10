'use client';

import { Button } from '@/components/ui/button';
import {
  isTakeProfitLiquiditySafe,
  isTakeProfitWithdrawalAllowed,
  type TakeProfitOverview,
} from '@/lib/api';
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
    payoutStatus,
    totalUnpaidConsignorBalance,
    minWorkingCapital,
    withdrawnCurrentPeriod,
    totalWithdrawnAllTime,
    availableToWithdraw,
    warningReason,
    liquidityInitialized,
    currentLiquidBalance,
    unpaidStockPurchaseBalance,
    totalUnpaidObligations,
    liquidityShortfall,
  } = overview;

  const safeShortfall = typeof liquidityShortfall === 'string' ? liquidityShortfall : null;
  const hasShortfall = liquidityInitialized && safeShortfall !== null && Number(safeShortfall) > 0;
  const safe = isTakeProfitLiquiditySafe(overview);
  const canWithdraw = isTakeProfitWithdrawalAllowed(overview);

  const heroTone = safe
    ? 'bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-white border-emerald-200/80'
    : 'bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-white border-amber-200/80';

  const payoutStatusLabel =
    payoutStatus === 'settled'
      ? 'Payout opname terakhir lunas'
      : payoutStatus === 'partial'
        ? 'Payout opname terakhir dibayar sebagian'
        : 'Payout opname terakhir belum dibayar';

  return (
    <div className="space-y-4">
      {/* Main Headline Hero Card */}
      <div className={`rounded-2xl border p-6 transition-all shadow-xs ${heroTone}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-zinc-600">
                Status Penarikan Pemilik
              </span>
              {!liquidityInitialized ? (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Likuiditas Belum Diinisialisasi
                </span>
              ) : safe ? (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Aman Ditarik
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
                data-testid="safe-to-withdraw"
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight font-mono ${
                  safe ? 'text-emerald-950' : 'text-amber-950'
                }`}
              >
                {safe ? formatRupiah(availableToWithdraw) : '—'}
              </h2>
              <span className="text-xs text-zinc-500 font-medium">aman ditarik saat ini</span>
            </div>

            {!liquidityInitialized ? (
              <div
                role="alert"
                className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 max-w-2xl leading-relaxed"
              >
                <strong>Saldo kas likuid belum diinisialisasi.</strong> Nominal aman ditarik
                belum dapat dihitung dari buku kas, sehingga pencatatan penarikan dinonaktifkan.
                Inisialisasi saldo kas likuid terlebih dahulu.
              </div>
            ) : (
              <p className="text-xs text-zinc-600 max-w-2xl leading-relaxed">
                {safe ? (
                  <>
                    Nominal ini adalah <strong className="text-emerald-800">kas likuid</strong> yang
                    tersisa setelah kewajiban belum dibayar ({formatRupiah(totalUnpaidObligations)})
                    dan cadangan modal belanja ({formatRupiah(minWorkingCapital)}) disisihkan.
                  </>
                ) : (
                  <span className="text-amber-800 font-medium">
                    {warningReason ||
                      'Kas likuid belum cukup menutup kewajiban penitip/stok dan cadangan modal belanja. Disarankan untuk menahan penarikan.'}
                  </span>
                )}
              </p>
            )}

            <p className="text-[11px] text-zinc-500 max-w-2xl leading-relaxed">
              Angka ini berasal dari saldo kas likuid aktual, bukan Profit A/B. Profit A/B adalah
              laba akuntansi per periode opname dan tidak menjamin ketersediaan kas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <Button
              onClick={onOpenWithdrawDialog}
              disabled={!canWithdraw}
              className={`h-10 px-5 text-xs font-semibold shadow-xs ${
                safe
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

      {/* Transparent Liquidity Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Step 1: Actual liquid cash from ledger */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-medium">1. Kas Likuid Aktual</span>
            <span className="text-[10px] font-mono text-emerald-600 font-semibold">+ Saldo Kas</span>
          </div>
          <div
            data-testid="current-liquid-balance"
            className="text-lg font-bold text-zinc-900 font-mono"
          >
            {liquidityInitialized ? (
              formatRupiah(currentLiquidBalance)
            ) : (
              <span className="text-sm text-amber-700">Belum diinisialisasi</span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 leading-tight">
            {latestOpname
              ? `Kas riil opname #${latestOpname.id} (${formatDateIndo(latestOpname.opnameDate)}): ${formatRupiah(latestOpname.realCash)}`
              : 'Belum ada opname final'}
          </p>
        </div>

        {/* Step 2: Unpaid obligations (consignor + stock purchases) */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-medium">2. Kewajiban Belum Dibayar</span>
            <span className="text-[10px] font-mono text-rose-600 font-semibold">- Kewajiban</span>
          </div>
          <div
            data-testid="total-unpaid-obligations"
            className="text-lg font-bold text-rose-700 font-mono"
          >
            {formatRupiah(totalUnpaidObligations)}
          </div>
          <div className="text-[11px] leading-tight text-zinc-500 space-y-0.5">
            <div className="flex justify-between gap-2">
              <span>Penitip</span>
              <span data-testid="unpaid-consignor-balance" className="font-mono text-zinc-700">
                {formatRupiah(totalUnpaidConsignorBalance)}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Belanja stok</span>
              <span
                data-testid="unpaid-stock-purchase-balance"
                className="font-mono text-zinc-700"
              >
                {formatRupiah(unpaidStockPurchaseBalance)}
              </span>
            </div>
            <div className="text-zinc-400">{payoutStatusLabel}</div>
          </div>
        </div>

        {/* Step 3: Working Capital Reserve */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-medium">3. Cadangan Modal Belanja</span>
            <span className="text-[10px] font-mono text-blue-600 font-semibold">- Terkunci</span>
          </div>
          <div className="flex items-center justify-between">
            <div
              data-testid="working-capital-reserve"
              className="text-lg font-bold text-blue-700 font-mono"
            >
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
            Cadangan kas untuk belanja barang dagangan periode berikutnya.
          </p>
        </div>

        {/* Step 4: Liquidity shortfall */}
        <div
          className={`rounded-xl border p-4 shadow-2xs space-y-2 ${
            hasShortfall ? 'border-rose-200 bg-rose-50/60' : 'border-zinc-200/80 bg-white'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-medium">4. Kekurangan Likuiditas</span>
            <span className="text-[10px] font-mono text-rose-600 font-semibold">Shortfall</span>
          </div>
          <div
            data-testid="liquidity-shortfall"
            className={`text-lg font-bold font-mono ${hasShortfall ? 'text-rose-700' : 'text-zinc-800'}`}
          >
            {liquidityInitialized ? formatRupiah(safeShortfall) : '—'}
          </div>
          <p className="text-[11px] text-zinc-500 leading-tight">
            {hasShortfall
              ? 'Kas likuid kurang untuk menutup kewajiban dan cadangan modal belanja.'
              : 'Selisih kas likuid terhadap kewajiban + cadangan modal belanja.'}
          </p>
        </div>
      </div>

      {/* Withdrawal Aggregates */}
      <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-zinc-600 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-700">Ditarik Sejak Opname Terakhir:</span>
          <span className="font-mono font-bold text-zinc-900">
            {formatRupiah(withdrawnCurrentPeriod)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Total Penarikan Owner Sepanjang Masa:</span>
          <span className="font-mono font-bold text-zinc-800">
            {formatRupiah(totalWithdrawnAllTime)}
          </span>
        </div>
      </div>
    </div>
  );
}
