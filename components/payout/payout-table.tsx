'use client';

import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/format';
import type { ConsignorLedgerItem } from '@/lib/api';
import { PayoutStatusBadge } from './payout-status-badge';
import { ConsignorLedgerCard } from './consignor-ledger-card';

interface Props {
  ledgers: ConsignorLedgerItem[];
  onPay: (ledger: ConsignorLedgerItem) => void;
  onViewLedger: (ledger: ConsignorLedgerItem) => void;
}

export function PayoutTable({ ledgers, onPay, onViewLedger }: Props) {
  if (ledgers.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-xs text-zinc-500 shadow-xs">
        Tidak ada data buku kas penitip yang sesuai filter.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
              <tr>
                <th className="py-3 px-3.5">Nama Penitip</th>
                <th className="py-3 px-3.5">Kontak</th>
                <th className="py-3 px-3.5 text-right">Total Hak (Akrual)</th>
                <th className="py-3 px-3.5 text-right">Telah Dibayar</th>
                <th className="py-3 px-3.5 text-right">Sisa Saldo</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {ledgers.map((item) => {
                const balanceNum = Number(item.balance);

                return (
                  <tr key={item.consignorId} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-medium text-zinc-900">
                      <div className="flex items-center gap-1.5">
                        <span>{item.consignorName}</span>
                        {!item.isActive && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-500 font-normal">
                            Nonaktif
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-zinc-500 font-mono">
                      {item.phone || '—'}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-zinc-700">
                      {formatRupiah(item.totalAccrual)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-emerald-700 font-medium">
                      {formatRupiah(item.totalPayment)}
                    </td>
                    <td
                      className={`py-3 px-3.5 text-right font-mono font-bold ${
                        balanceNum > 0
                          ? 'text-[#D97757]'
                          : balanceNum < 0
                          ? 'text-sky-700'
                          : 'text-zinc-600'
                      }`}
                    >
                      {formatRupiah(item.balance)}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <PayoutStatusBadge status={item.status} />
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5"
                          onClick={() => onViewLedger(item)}
                        >
                          Buku Kas
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-xs px-2.5 bg-[#D97757] hover:bg-[#C26344] text-white"
                          onClick={() => onPay(item)}
                        >
                          Bayar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-2.5">
        {ledgers.map((item) => (
          <ConsignorLedgerCard
            key={item.consignorId}
            ledger={item}
            onPay={onPay}
            onViewLedger={onViewLedger}
          />
        ))}
      </div>
    </div>
  );
}
