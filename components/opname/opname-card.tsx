'use client';

import { Button } from '@/components/ui/button';
import type { OpnameRecord } from '@/lib/api';
import { formatDateIndo, formatRupiah } from '@/lib/format';
import { OpnameStatusBadge } from './opname-status-badge';

interface Props {
  opname: OpnameRecord;
  onViewDetail: (opname: OpnameRecord) => void;
  onResumeDraft: (opname: OpnameRecord) => void;
  onDeleteDraft: (opname: OpnameRecord) => void;
}

export function OpnameCard({
  opname,
  onViewDetail,
  onResumeDraft,
  onDeleteDraft,
}: Props) {
  const isDraft = opname.status === 'draft';

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-semibold text-zinc-900 text-sm block">
            {formatDateIndo(opname.opnameDate)}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">
            {opname.opnameDate}
          </span>
        </div>
        <OpnameStatusBadge status={opname.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-100">
        <div>
          <span className="text-[10px] text-zinc-400 block uppercase font-medium">Terjual</span>
          <span className="font-mono font-bold text-zinc-900">{opname.totalSoldQty} pcs</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-400 block uppercase font-medium">Omset (T)</span>
          <span className="font-mono font-bold text-zinc-900">{formatRupiah(opname.totalTurnover)}</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-400 block uppercase font-medium">Modal Own</span>
          <span className="font-mono font-semibold text-zinc-700">{formatRupiah(opname.totalCogs)}</span>
        </div>
        <div>
          <span className="text-[10px] text-orange-700 block uppercase font-medium">Hak Penitip</span>
          <span className="font-mono font-bold text-orange-950">{formatRupiah(opname.totalPayoutDue)}</span>
        </div>
      </div>

      {opname.note && (
        <p className="text-xs text-zinc-600 italic bg-zinc-50 p-2 rounded-lg border border-zinc-100">
          &ldquo;{opname.note}&rdquo;
        </p>
      )}

      <div className="flex items-center justify-end gap-1 pt-2 border-t border-zinc-100">
        {isDraft ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onResumeDraft(opname)}
              className="h-7 text-xs px-2.5 text-amber-700 hover:text-amber-800 border-amber-200 bg-amber-50/50 font-semibold"
            >
              Lanjutkan Draf
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDeleteDraft(opname)}
              className="h-7 text-xs px-2 text-red-600 hover:bg-red-50"
            >
              Hapus
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onViewDetail(opname)}
            className="h-7 text-xs px-3 text-zinc-700 hover:text-zinc-900"
          >
            Lihat Rincian
          </Button>
        )}
      </div>
    </div>
  );
}
