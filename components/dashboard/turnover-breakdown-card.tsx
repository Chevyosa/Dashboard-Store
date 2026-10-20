import React from 'react';
import { formatRupiah } from '@/lib/format';
import type { DashboardTurnoverBreakdown } from '@/lib/api';

interface TurnoverBreakdownCardProps {
  breakdown: DashboardTurnoverBreakdown;
}

export function TurnoverBreakdownCard({ breakdown }: TurnoverBreakdownCardProps) {
  const ownPct = breakdown.ownPercentage;
  const consignorPct = breakdown.consignorPercentage;
  const totalNum = Number(breakdown.totalTurnover);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <h3 className="text-sm font-semibold text-zinc-900">
          Komposisi Omset Penjualan
        </h3>
        <span className="text-xs font-mono font-semibold text-zinc-700">
          Total: {formatRupiah(breakdown.totalTurnover)}
        </span>
      </div>

      {totalNum === 0 ? (
        <div className="py-6 text-center text-xs text-zinc-400">
          Belum ada data penjualan pada periode ini.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 flex">
            <div
              style={{ width: `${ownPct}%` }}
              className="h-full bg-[#D97757] transition-all"
              title={`Barang Sendiri: ${ownPct}%`}
            />
            <div
              style={{ width: `${consignorPct}%` }}
              className="h-full bg-amber-400 transition-all"
              title={`Barang Titipan: ${consignorPct}%`}
            />
          </div>

          {/* Breakdown Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded border border-zinc-100 bg-zinc-50 p-3 space-y-1">
              <div className="flex items-center space-x-1.5">
                <span className="size-2 rounded-full bg-[#D97757]" />
                <span className="text-xs font-medium text-zinc-600">Barang Sendiri</span>
              </div>
              <div className="text-base font-bold text-zinc-900 font-sans">
                {formatRupiah(breakdown.ownTurnover)}
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">
                {ownPct}% dari total omset
              </p>
            </div>

            <div className="rounded border border-zinc-100 bg-zinc-50 p-3 space-y-1">
              <div className="flex items-center space-x-1.5">
                <span className="size-2 rounded-full bg-amber-400" />
                <span className="text-xs font-medium text-zinc-600">Barang Titipan</span>
              </div>
              <div className="text-base font-bold text-zinc-900 font-sans">
                {formatRupiah(breakdown.consignorTurnover)}
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">
                {consignorPct}% dari total omset
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
