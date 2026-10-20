'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { StockIn } from '@/lib/api';

interface Props {
  stockIn: StockIn;
  onEdit: (stockIn: StockIn) => void;
  onDelete: (stockIn: StockIn) => void;
}

function formatRupiah(amountStr: string): string {
  const num = parseFloat(amountStr);
  if (isNaN(num)) return 'Rp 0';
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
}

export function StockInCard({ stockIn, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isClosed = stockIn.opnameId !== null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-zinc-900">
            {stockIn.date}
          </span>
          {stockIn.type === 'purchase' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
              Own
            </span>
          )}
          {stockIn.type === 'consignment_in' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-[#D97757] border border-orange-200">
              Titipan
            </span>
          )}
          {stockIn.type === 'initial' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-50 text-sky-800 border border-sky-200">
              Stok Awal
            </span>
          )}
        </div>

        <div>
          {isClosed ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600">
              Opname #{stockIn.opnameId}
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="size-1 rounded-full bg-emerald-500 mr-1" />
              Terbuka
            </span>
          )}
        </div>
      </div>

      {stockIn.note && (
        <p className="text-xs text-zinc-500 line-clamp-1 italic">{stockIn.note}</p>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-100">
        <div>
          <span className="text-[10px] text-zinc-500 font-medium block">
            Kuantitas
          </span>
          <span className="font-mono text-sm font-bold text-zinc-900">
            {stockIn.totalQtyPcs} pcs
          </span>
          <span className="text-[10px] text-zinc-500 ml-1">({stockIn.linesCount} item)</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-zinc-500 font-medium block">
            Modal Belanja
          </span>
          <span className="font-mono text-sm font-bold text-zinc-900">
            {stockIn.type === 'consignment_in' ? 'Rp 0' : formatRupiah(stockIn.totalCost)}
          </span>
        </div>
      </div>

      {/* Expandable items */}
      {expanded && stockIn.lines && stockIn.lines.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-zinc-100">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
            Item Produk:
          </span>
          <div className="space-y-1 bg-zinc-50 p-2 rounded-lg text-xs">
            {stockIn.lines.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-[11px]">
                <div className="truncate mr-2">
                  <span className="font-medium text-zinc-800">{l.productName}</span>
                  {l.inputMode === 'pack' && (
                    <span className="text-zinc-500 font-mono ml-1">
                      ({l.qtyPack} pack)
                    </span>
                  )}
                </div>
                <div className="text-right font-mono shrink-0">
                  <span className="font-bold text-zinc-900 mr-2">{l.qtyPcs} pcs</span>
                  <span className="text-zinc-500">
                    {l.ownerType === 'own' ? formatRupiah(l.totalCost) : 'Rp 0'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-zinc-500 hover:text-zinc-800"
        >
          {expanded ? '▲ Tutup Rincian' : '▼ Lihat Rincian'}
        </button>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isClosed}
            onClick={() => onEdit(stockIn)}
            className="h-8 text-xs px-2.5 text-zinc-600 hover:text-zinc-900 disabled:opacity-40"
          >
            Ubah
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isClosed}
            onClick={() => onDelete(stockIn)}
            className="h-8 text-xs px-2.5 text-red-600 hover:bg-red-50 disabled:opacity-40"
          >
            Hapus
          </Button>
        </div>
      </div>
    </div>
  );
}
