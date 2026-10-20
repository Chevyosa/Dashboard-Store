'use client';

import { Button } from '@/components/ui/button';
import type { LossRecord } from '@/lib/api';
import { LossBorneBadge } from './loss-borne-badge';
import { LossReasonBadge } from './loss-reason-badge';

interface Props {
  losses: LossRecord[];
  onEdit: (loss: LossRecord) => void;
  onDelete: (loss: LossRecord) => void;
}

export function LossTable({ losses, onEdit, onDelete }: Props) {
  if (losses.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-xs text-zinc-500 shadow-xs">
        Belum ada catatan barang rusak atau hilang (loss).
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
              <th className="py-3 px-3.5">Produk</th>
              <th className="py-3 px-3.5 text-right">Kuantitas</th>
              <th className="py-3 px-3.5">Alasan</th>
              <th className="py-3 px-3.5">Penanggung Jawab</th>
              <th className="py-3 px-3.5">Catatan</th>
              <th className="py-3 px-3.5 text-center">Status Periode</th>
              <th className="py-3 px-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {losses.map((item) => {
              const isClosed = item.opnameId !== null;

              return (
                <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-3 px-3.5 font-mono font-medium text-zinc-900 whitespace-nowrap">
                    {item.date}
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="font-medium text-zinc-900 block">{item.productName}</span>
                    <span className="text-[10px] text-zinc-500">
                      {item.ownerType === 'own' ? (
                        'Milik Sendiri (Own)'
                      ) : (
                        <span className="text-[#D97757]">
                          Titipan ({item.consignorName ?? 'Mitra'})
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-bold text-zinc-900 whitespace-nowrap">
                    {item.qtyPcs} pcs
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <LossReasonBadge reason={item.reason} />
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <LossBorneBadge
                      borneBy={item.borneBy}
                      consignorName={item.consignorName}
                    />
                  </td>
                  <td className="py-3 px-3.5 text-zinc-600 max-w-xs truncate">
                    {item.note || '—'}
                  </td>
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    {isClosed ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600">
                        Opname #{item.opnameId}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="size-1 rounded-full bg-emerald-500 mr-1" />
                        Terbuka
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-right space-x-1 whitespace-nowrap">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isClosed}
                      onClick={() => onEdit(item)}
                      className="h-7 text-xs px-2 text-zinc-600 hover:text-zinc-900 disabled:opacity-40"
                    >
                      Ubah
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isClosed}
                      onClick={() => onDelete(item)}
                      className="h-7 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-40"
                    >
                      Hapus
                    </Button>
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
