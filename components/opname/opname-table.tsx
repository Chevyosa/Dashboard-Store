'use client';

import { Button } from '@/components/ui/button';
import type { OpnameRecord } from '@/lib/api';
import { formatDateIndo, formatRupiah } from '@/lib/format';
import { OpnameStatusBadge } from './opname-status-badge';

interface Props {
  opnames: OpnameRecord[];
  onViewDetail: (opname: OpnameRecord) => void;
  onResumeDraft: (opname: OpnameRecord) => void;
  onDeleteDraft: (opname: OpnameRecord) => void;
}

export function OpnameTable({
  opnames,
  onViewDetail,
  onResumeDraft,
  onDeleteDraft,
}: Props) {
  if (opnames.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-xs text-zinc-500 shadow-xs">
        Belum ada riwayat penutupan periode (opname).
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
            <tr>
              <th className="py-3 px-3.5">Tanggal</th>
              <th className="py-3 px-3.5">Status</th>
              <th className="py-3 px-3.5 text-right">Terjual</th>
              <th className="py-3 px-3.5 text-right">Omset (T)</th>
              <th className="py-3 px-3.5 text-right">Modal Own</th>
              <th className="py-3 px-3.5 text-right">Hak Penitip</th>
              <th className="py-3 px-3.5">Catatan</th>
              <th className="py-3 px-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {opnames.map((item) => {
              const isDraft = item.status === 'draft';

              return (
                <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className="font-semibold text-zinc-900 block">
                      {formatDateIndo(item.opnameDate)}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {item.opnameDate}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <OpnameStatusBadge status={item.status} />
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-medium text-zinc-900 whitespace-nowrap">
                    {item.totalSoldQty} pcs
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-bold text-zinc-900 whitespace-nowrap">
                    {formatRupiah(item.totalTurnover)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-zinc-700 whitespace-nowrap">
                    {formatRupiah(item.totalCogs)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-semibold text-orange-950 whitespace-nowrap">
                    {formatRupiah(item.totalPayoutDue)}
                  </td>
                  <td className="py-3 px-3.5 text-zinc-600 max-w-xs truncate">
                    {item.note || '—'}
                  </td>
                  <td className="py-3 px-3.5 text-right space-x-1 whitespace-nowrap">
                    {isDraft ? (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onResumeDraft(item)}
                          className="h-7 text-xs px-2 text-amber-700 hover:text-amber-800 hover:bg-amber-50 font-semibold"
                        >
                          Lanjutkan
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteDraft(item)}
                          className="h-7 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Hapus
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(item)}
                        className="h-7 text-xs px-2 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100"
                      >
                        Lihat Rincian
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
