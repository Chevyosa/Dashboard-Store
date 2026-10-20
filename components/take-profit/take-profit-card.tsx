'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { formatRupiah, formatDateIndo } from '@/lib/format';
import type { TakeProfitItem } from '@/lib/api';

interface TakeProfitCardProps {
  item: TakeProfitItem;
  onDelete: (item: TakeProfitItem) => void;
  deleting: boolean;
}

export function TakeProfitCard({ item, onDelete, deleting }: TakeProfitCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
      {/* Top Header: Date & Payment Method */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-zinc-900 font-mono">
          {formatDateIndo(item.withdrawalDate)}
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
            item.paymentMethod === 'cash'
              ? 'bg-amber-100 text-amber-800 border border-amber-200'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}
        >
          {item.paymentMethod === 'cash' ? '💵 Tunai' : '🏦 Transfer'}
        </span>
      </div>

      {/* Main Metric: Amount */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
            Nominal Ditarik
          </span>
          <div className="text-xl font-bold font-mono text-emerald-700">
            {formatRupiah(item.amount)}
          </div>
        </div>

        {item.opnameId ? (
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 block">Dasar Opname</span>
            <span className="text-[11px] font-mono font-semibold text-zinc-700">
              #{item.opnameId}
            </span>
          </div>
        ) : null}
      </div>

      {/* Note if present */}
      {item.note && (
        <div className="rounded-lg bg-zinc-50 p-2 text-xs text-zinc-600 border border-zinc-100">
          <span className="font-medium text-zinc-500">Catatan:</span> {item.note}
        </div>
      )}

      {/* Footer: Recorded by & Action */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-[11px] text-zinc-500">
        <span>Oleh: {item.createdByUsername || 'System'}</span>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete(item)}
          disabled={deleting}
          className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 px-3"
        >
          {deleting ? 'Menghapus...' : 'Hapus'}
        </Button>
      </div>
    </div>
  );
}
