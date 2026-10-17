'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/format';
import type { ConsignorLedgerItem } from '@/lib/api';
import { PayoutStatusBadge } from './payout-status-badge';

interface ConsignorLedgerCardProps {
  ledger: ConsignorLedgerItem;
  onPay: (ledger: ConsignorLedgerItem) => void;
  onViewLedger: (ledger: ConsignorLedgerItem) => void;
}

export function ConsignorLedgerCard({
  ledger,
  onPay,
  onViewLedger,
}: ConsignorLedgerCardProps) {
  const balanceNum = Number(ledger.balance);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
      {/* Header: Name, Status & Inactive badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-zinc-900 text-sm">
              {ledger.consignorName}
            </span>
            {!ledger.isActive && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-500">
                Nonaktif
              </span>
            )}
          </div>
          {ledger.phone && (
            <p className="text-xs text-zinc-500 font-mono">
              📞 {ledger.phone}
            </p>
          )}
        </div>

        <PayoutStatusBadge status={ledger.status} />
      </div>

      {/* 3-Column Financial Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-100">
        <div>
          <span className="text-[10px] text-zinc-500 block">Hak Bersih</span>
          <span className="font-mono text-xs font-semibold text-zinc-800 block mt-0.5">
            {formatRupiah(ledger.totalAccrual)}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-zinc-500 block">Telah Dibayar</span>
          <span className="font-mono text-xs font-semibold text-emerald-700 block mt-0.5">
            {formatRupiah(ledger.totalPayment)}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-zinc-500 block">Sisa Hutang</span>
          <span
            className={`font-mono text-xs font-bold block mt-0.5 ${
              balanceNum > 0
                ? 'text-[#D97757]'
                : balanceNum < 0
                ? 'text-sky-700'
                : 'text-zinc-600'
            }`}
          >
            {formatRupiah(ledger.balance)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-9 text-xs border-zinc-200 hover:bg-zinc-50"
          onClick={() => onViewLedger(ledger)}
        >
          Buku Kas
        </Button>
        <Button
          size="sm"
          className="flex-1 h-9 text-xs bg-[#D97757] hover:bg-[#C26344] text-white font-medium"
          onClick={() => onPay(ledger)}
        >
          Bayar
        </Button>
      </div>
    </div>
  );
}
