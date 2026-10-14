'use client';

import type { ConsignorLedgerStatus } from '@/lib/api';

interface Props {
  status: ConsignorLedgerStatus;
}

export function PayoutStatusBadge({ status }: Props) {
  if (status === 'unpaid') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200">
        <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
        Belum Lunas
      </span>
    );
  }

  if (status === 'overpaid') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-800 border border-sky-200">
        <span className="size-1.5 rounded-full bg-sky-500" />
        Lebih Bayar
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
      <span className="size-1.5 rounded-full bg-emerald-600" />
      Lunas
    </span>
  );
}
