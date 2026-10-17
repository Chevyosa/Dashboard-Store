import React from 'react';
import Link from 'next/link';
import { formatRupiah } from '@/lib/format';
import type { DashboardOverview, DashboardReconciliationResult, TakeProfitOverview } from '@/lib/api';

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
  const profitA = latestReconciliation ? latestReconciliation.profitA : null;
  const unpaidPayout = overview.totalUnpaidConsignorBalance;
  const stockValuation = overview.totalStockValuation;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Omset Penjualan */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Omset Penjualan</span>
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

      {/* 2. Laba Halal Ditarik (Take Profit) */}
      <Link
        href="/take-profit"
        className="rounded-lg border border-zinc-200 bg-white p-5 shadow-xs space-y-2 hover:border-[#D97757]/60 hover:shadow-xs transition-all group block"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider group-hover:text-[#D97757] transition-colors">
            Laba Halal Ditarik
          </span>
          {takeProfit ? (
            takeProfit.isSafe ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                Aman Ditarik
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                Tahan Dulu
              </span>
            )
          ) : (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              Take Profit
            </span>
          )}
        </div>
        <div
          className={`text-2xl font-bold tracking-tight font-sans ${
            takeProfit && !takeProfit.isSafe && Number(takeProfit.availableToWithdraw) <= 0
              ? 'text-amber-700'
              : 'text-emerald-700'
          }`}
        >
          {takeProfit
            ? formatRupiah(takeProfit.availableToWithdraw)
            : profitA
            ? formatRupiah(profitA)
            : '—'}
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="truncate">
            {takeProfit
              ? takeProfit.isSafe
                ? 'Bersih setelah payout & modal belanja'
                : 'Belum cukup modal belanja toko'
              : 'Kas bersih yang halal ditarik owner'}
          </span>
          <span className="text-[11px] text-[#D97757] font-medium group-hover:translate-x-0.5 transition-transform shrink-0 ml-1">
            Tarik →
          </span>
        </div>
      </Link>

      {/* 3. Kerugian Barang (Loss) */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Kerugian Barang (Loss)</span>
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
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Kewajiban Penitip</span>
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
