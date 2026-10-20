'use client';

import { Button } from '@/components/ui/button';
import type { LossRecord } from '@/lib/api';
import { LossBorneBadge } from './loss-borne-badge';
import { LossReasonBadge } from './loss-reason-badge';

interface Props {
  loss: LossRecord;
  onEdit: (loss: LossRecord) => void;
  onDelete: (loss: LossRecord) => void;
}

export function LossCard({ loss, onEdit, onDelete }: Props) {
  const isClosed = loss.opnameId !== null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-zinc-500 font-medium">{loss.date}</span>
        {isClosed ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600">
            Opname #{loss.opnameId}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="size-1 rounded-full bg-emerald-500 mr-1" />
            Terbuka
          </span>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-zinc-900">{loss.productName}</h3>
        <p className="text-[11px] text-zinc-500">
          {loss.ownerType === 'own' ? (
            'Milik Sendiri (Own)'
          ) : (
            <span className="text-[#D97757]">
              Titipan ({loss.consignorName ?? 'Mitra'})
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="font-mono font-bold text-xs text-zinc-900 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200">
          {loss.qtyPcs} pcs
        </span>
        <LossReasonBadge reason={loss.reason} />
      </div>

      <div>
        <LossBorneBadge borneBy={loss.borneBy} consignorName={loss.consignorName} />
      </div>

      {loss.note && (
        <p className="text-xs text-zinc-600 italic bg-zinc-50 p-2 rounded-lg border border-zinc-100">
          &ldquo;{loss.note}&rdquo;
        </p>
      )}

      <div className="flex items-center justify-end gap-1 pt-2 border-t border-zinc-100">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isClosed}
          onClick={() => onEdit(loss)}
          className="h-8 text-xs px-2.5 text-zinc-600 hover:text-zinc-900 disabled:opacity-40"
        >
          Ubah
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isClosed}
          onClick={() => onDelete(loss)}
          className="h-8 text-xs px-2.5 text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          Hapus
        </Button>
      </div>
    </div>
  );
}
