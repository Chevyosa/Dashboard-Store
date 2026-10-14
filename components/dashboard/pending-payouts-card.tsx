import React from 'react';
import Link from 'next/link';
import { formatRupiah } from '@/lib/format';
import type { DashboardPendingPayout } from '@/lib/api';

interface PendingPayoutsCardProps {
  consignors: DashboardPendingPayout[];
}

export function PendingPayoutsCard({ consignors }: PendingPayoutsCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-zinc-900">
            Kewajiban Bagi Hasil Penitip
          </h3>
          {consignors.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
              {consignors.length} Tertunggak
            </span>
          )}
        </div>
        <Link
          href="/payout"
          className="text-xs font-medium text-[#D97757] hover:underline"
        >
          Lihat Buku Kas →
        </Link>
      </div>

      {!consignors.length ? (
        <div className="py-6 text-center text-xs text-zinc-400">
          Semua kewajiban bagi hasil penitip telah lunas terbayar.
        </div>
      ) : (
        <div className="divide-y divide-zinc-100">
          {consignors.map((c) => (
            <div key={c.consignorId} className="flex items-center justify-between py-2.5">
              <div>
                <div className="text-xs font-semibold text-zinc-900">{c.consignorName}</div>
                <div className="text-[11px] text-zinc-500">
                  {c.phone ? c.phone : 'Tanpa nomor telepon'}
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="text-xs font-bold text-rose-700 font-sans">
                  {formatRupiah(c.balance)}
                </div>
                <Link
                  href="/payout"
                  className="inline-block rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Bayar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
