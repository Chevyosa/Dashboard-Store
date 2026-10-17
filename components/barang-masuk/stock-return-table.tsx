'use client';

import { Button } from '@/components/ui/button';
import type { StockReturn } from '@/lib/api';

interface Props {
  returns: StockReturn[];
  onEdit: (ret: StockReturn) => void;
  onDelete: (ret: StockReturn) => void;
}

export function StockReturnTable({ returns, onEdit, onDelete }: Props) {
  if (returns.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-xs">
        <span className="text-3xl block mb-2">↩️</span>
        <h3 className="text-sm font-bold text-zinc-900">Belum ada riwayat retur penitip</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          Jika mitra mengambil kembali sisa produk titipan yang tidak laku, catat lewat tombol &quot;Catat Retur Penitip&quot;.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden sm:block rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
            <tr>
              <th className="py-3 px-3.5">Tanggal</th>
              <th className="py-3 px-3.5">Produk Titipan</th>
              <th className="py-3 px-3.5">Mitra Penitip</th>
              <th className="py-3 px-3.5 text-right">Jumlah (Pcs)</th>
              <th className="py-3 px-3.5">Catatan</th>
              <th className="py-3 px-3.5 text-center">Status Periode</th>
              <th className="py-3 px-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {returns.map((item) => {
              const isClosed = item.opnameId !== null;

              return (
                <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-3 px-3.5 font-mono font-medium text-zinc-900">
                    {item.date}
                  </td>
                  <td className="py-3 px-3.5 font-medium text-zinc-900">
                    {item.productName}
                  </td>
                  <td className="py-3 px-3.5 text-[#D97757] font-medium">
                    {item.consignorName ?? '—'}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-bold text-zinc-900">
                    {item.qtyPcs} pcs
                  </td>
                  <td className="py-3 px-3.5 text-zinc-500 max-w-xs truncate">
                    {item.note ?? '—'}
                  </td>
                  <td className="py-3 px-3.5 text-center">
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
                  <td className="py-3 px-3.5 text-right space-x-1">
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

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {returns.map((item) => {
          const isClosed = item.opnameId !== null;

          return (
            <div
              key={item.id}
              className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-zinc-900">{item.date}</span>
                {isClosed ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600">
                    Opname #{item.opnameId}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="size-1 rounded-full bg-emerald-500 mr-1" />
                    Terbuka
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-900">{item.productName}</h4>
                <p className="text-[11px] text-[#D97757]">Mitra: {item.consignorName ?? '—'}</p>
              </div>

              {item.note && (
                <p className="text-xs text-zinc-500 italic bg-zinc-50 p-2 rounded-lg">
                  {item.note}
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                <div className="font-mono text-xs font-bold text-zinc-900">
                  {item.qtyPcs} pcs diretur
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isClosed}
                    onClick={() => onEdit(item)}
                    className="h-8 text-xs px-2.5 text-zinc-600 hover:text-zinc-900 disabled:opacity-40"
                  >
                    Ubah
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isClosed}
                    onClick={() => onDelete(item)}
                    className="h-8 text-xs px-2.5 text-red-600 hover:bg-red-50 disabled:opacity-40"
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
