import React from 'react';
import Link from 'next/link';
import { formatRupiah } from '@/lib/format';
import {
  isTakeProfitLiquiditySafe,
  type DashboardOverview,
  type DashboardReconciliationResult,
  type TakeProfitOverview,
} from '@/lib/api';

interface DashboardKPICardsProps {
  overview: DashboardOverview;
  latestReconciliation: DashboardReconciliationResult | null;
  takeProfit?: TakeProfitOverview | null;
}

export function DashboardKPICards({
  overview,
  latestReconciliation,
  takeProfit,
}: DashboardKPICardsProps) {
  const latest = overview.latestOpname;
  const turnover = latest ? latest.totalTurnover : '0.0000';
  const soldQty = latest ? latest.totalSoldQty : 0;
  const lossQty = latest ? latest.totalLossQty : 0;
  const lossCost = latestReconciliation ? latestReconciliation.totalOwnLossCost : '0.0000';
  const unpaidPayout = overview.totalUnpaidConsignorBalance;

  // Withdrawable cash comes only from the liquidity ledger. Before the ledger
  // is initialized (or when data is missing) no amount is shown: fail closed.
  const liquidityInitialized = takeProfit?.liquidityInitialized === true;
  const liquidityShortfall =
    typeof takeProfit?.liquidityShortfall === 'string' ? takeProfit.liquidityShortfall : null;
  const hasShortfall = liquidityInitialized && liquidityShortfall !== null && Number(liquidityShortfall) > 0;
  const safe = isTakeProfitLiquiditySafe(takeProfit ?? null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Omset Penjualan */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600">Omset Penjualan</span>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
            {latest ? `${soldQty} Pcs Terjual` : 'Belum Ada Opname'}
          </span>
        </div>
        <div className="text-2xl font-bold tracking-tight text-zinc-900 font-sans">
          {formatRupiah(turnover)}
        </div>
        <p className="text-xs text-zinc-500">
          {latest ? `Periode: ${latest.opnameDate}` : 'Lakukan opname pertama untuk mencatat omset'}
        </p>
      </div>

      {/* 2. Kas Aman Ditarik (Take Profit, ledger-based) */}
      <Link
        href="/take-profit"
        className="rounded-lg border border-zinc-200 bg-white p-5 shadow-xs space-y-2 hover:border-[#D97757]/60 hover:shadow-xs transition-all group block"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600 group-hover:text-[#D97757] transition-colors">
            Kas Aman Ditarik
          </span>
          {!takeProfit ? (
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
              Tidak Tersedia
            </span>
          ) : !liquidityInitialized ? (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              Belum Diinisialisasi
            </span>
          ) : safe ? (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              Aman Ditarik
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              Tahan Dulu
            </span>
          )}
        </div>
        <div
          className={`text-2xl font-bold tracking-tight font-sans ${
            !liquidityInitialized ? 'text-zinc-400' : safe ? 'text-emerald-700' : 'text-amber-700'
          }`}
        >
          {takeProfit && safe ? formatRupiah(takeProfit.availableToWithdraw) : '—'}
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="truncate">
            {!takeProfit
              ? 'Data likuiditas tidak tersedia'
              : !liquidityInitialized
                ? 'Saldo kas likuid belum diinisialisasi'
                : hasShortfall
                  ? `Kurang ${formatRupiah(liquidityShortfall)} untuk kewajiban & cadangan`
                  : safe
                    ? 'Kas likuid setelah kewajiban & cadangan'
                    : 'Tahan penarikan, kas likuid belum cukup'}
          </span>
          <span className="text-[11px] text-[#D97757] font-semibold shrink-0 ml-1">
            Buka
          </span>
        </div>
      </Link>

      {/* 3. Kerugian Barang (Loss) */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600">Kerugian Barang (Loss)</span>
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            {lossQty} Pcs Rusak/Basi
          </span>
        </div>
        <div className="text-2xl font-bold tracking-tight text-zinc-900 font-sans">
          {formatRupiah(lossCost)}
        </div>
        <p className="text-xs text-zinc-500">
          Biaya kerugian fisik yang ditanggung toko
        </p>
      </div>

      {/* 4. Kewajiban Payout Penitip */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600">Kewajiban Penitip</span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${Number(unpaidPayout) > 0 ? 'bg-rose-50 text-rose-700' : 'bg-zinc-100 text-zinc-600'}`}>
            {Number(unpaidPayout) > 0 ? 'Perlu Disetor' : 'Lunas'}
          </span>
        </div>
        <div className="text-2xl font-bold tracking-tight text-zinc-900 font-sans">
          {formatRupiah(unpaidPayout)}
        </div>
        <p className="text-xs text-zinc-500">
          {Number(unpaidPayout) > 0 ? 'Bagi hasil yang belum disetorkan' : 'Semua setoran penitip telah diselesaikan'}
        </p>
      </div>
    </div>
  );
}
