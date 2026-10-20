'use client';

import { formatRupiah } from '@/lib/format';
import type { ConsignorLedgersOverview } from '@/lib/api';

interface Props {
  totals: ConsignorLedgersOverview['totals'];
}

export function PayoutSummaryCards({ totals }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
        <p className="text-[11px] font-medium text-zinc-500">
          Total Hak Penitip
        </p>
        <p className="mt-1 text-base sm:text-lg font-bold text-zinc-900 font-mono">
          {formatRupiah(totals.totalAccrual)}
        </p>
        <p className="mt-0.5 text-[10px] text-zinc-400">
          Akrual dari seluruh opname final
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
        <p className="text-[11px] font-medium text-zinc-500">
          Total Terbayar
        </p>
        <p className="mt-1 text-base sm:text-lg font-bold text-emerald-700 font-mono">
          {formatRupiah(totals.totalPayment)}
        </p>
        <p className="mt-0.5 text-[10px] text-zinc-400">
          Penyaluran kas ke penitip
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
        <p className="text-[11px] font-medium text-zinc-500">
          Sisa Hutang Toko
        </p>
        <p
          className={`mt-1 text-base sm:text-lg font-bold font-mono ${
            Number(totals.totalBalance) > 0
              ? 'text-[#D97757]'
              : Number(totals.totalBalance) < 0
              ? 'text-sky-700'
              : 'text-zinc-700'
          }`}
        >
          {formatRupiah(totals.totalBalance)}
        </p>
        <p className="mt-0.5 text-[10px] text-zinc-400">
          {Number(totals.totalBalance) > 0
            ? 'Kewajiban harus diselesaikan'
            : Number(totals.totalBalance) < 0
            ? 'Kelebihan pembayaran'
            : 'Semua kewajiban lunas'}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
        <p className="text-[11px] font-medium text-zinc-500">
          Penitip Belum Lunas
        </p>
        <p className="mt-1 text-base sm:text-lg font-bold text-zinc-900 font-mono">
          {totals.unpaidCount}{' '}
          <span className="text-xs font-normal text-zinc-500">orang</span>
        </p>
        <p className="mt-0.5 text-[10px] text-zinc-400">
          Status buku kas masih unpaid
        </p>
      </div>
    </div>
  );
}
