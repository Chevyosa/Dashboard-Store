'use client';

import { useState, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import type { StockIn } from '@/lib/api';

interface Props {
  stockIns: StockIn[];
  onEdit: (stockIn: StockIn) => void;
  onDelete: (stockIn: StockIn) => void;
}

function formatRupiah(amountStr: string): string {
  const num = parseFloat(amountStr);
  if (isNaN(num)) return 'Rp 0';
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
}

export function StockInTable({ stockIns, onEdit, onDelete }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  function toggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (stockIns.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-xs">
        <span className="text-3xl block mb-2">📦</span>
        <h3 className="text-sm font-bold text-zinc-900">Belum ada riwayat barang masuk</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          Klik tombol &quot;Catat Barang Masuk&quot; di atas untuk mencatat pasokan belanja sendiri, setoran penitip, atau stok awal.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
            <tr>
              <th className="py-3 px-3.5 w-10"></th>
              <th className="py-3 px-3.5">Tanggal</th>
              <th className="py-3 px-3.5">Tipe</th>
              <th className="py-3 px-3.5 text-right">Total Pcs</th>
              <th className="py-3 px-3.5 text-right">Modal Belanja</th>
              <th className="py-3 px-3.5 text-center">Status Periode</th>
              <th className="py-3 px-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {stockIns.map((item) => {
              const isExpanded = expandedId === item.id;
              const isClosed = item.opnameId !== null;

              return (
                <Fragment key={item.id}>
                  <tr
                    onClick={() => toggleExpand(item.id)}
                    className="hover:bg-zinc-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3.5 text-zinc-400 text-center font-mono select-none">
                      {isExpanded ? '▼' : '▶'}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-medium text-zinc-900">
                      {item.date}
                    </td>
                    <td className="py-3 px-3.5">
                      {item.type === 'purchase' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
                          Belanja Own
                        </span>
                      )}
                      {item.type === 'consignment_in' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-orange-50 text-[#D97757] border border-orange-200">
                          Setoran Penitip
                        </span>
                      )}
                      {item.type === 'initial' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-800 border border-sky-200">
                          Stok Awal
                        </span>
                      )}
                      {item.note && (
                        <span className="block text-[11px] text-zinc-500 truncate max-w-xs mt-0.5">
                          {item.note}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-zinc-900">
                      {item.totalQtyPcs} pcs
                      <span className="block text-[10px] text-zinc-400 font-normal">
                        ({item.linesCount} item)
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-zinc-900">
                      {item.type === 'consignment_in' ? (
                        <span className="text-zinc-400 font-normal">Rp 0 (Titipan)</span>
                      ) : (
                        formatRupiah(item.totalCost)
                      )}
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
                    <td className="py-3 px-3.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
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

                  {/* Expanded Detail Rows */}
                  {isExpanded && (
                    <tr className="bg-zinc-50/50">
                      <td colSpan={7} className="px-6 py-3 border-t border-zinc-100">
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                            Rincian Item Produk:
                          </div>
                          {item.lines && item.lines.length > 0 ? (
                            <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
                              <table className="w-full text-left text-[11px]">
                                <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500">
                                  <tr>
                                    <th className="py-1.5 px-3">Produk</th>
                                    <th className="py-1.5 px-3">Tipe</th>
                                    <th className="py-1.5 px-3 text-center">Satuan Masuk</th>
                                    <th className="py-1.5 px-3 text-right">Kuantitas Pcs</th>
                                    <th className="py-1.5 px-3 text-right">Biaya Modal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                  {item.lines.map((l) => (
                                    <tr key={l.id}>
                                      <td className="py-1.5 px-3 font-medium text-zinc-900">
                                        {l.productName}
                                      </td>
                                      <td className="py-1.5 px-3">
                                        {l.ownerType === 'own' ? (
                                          <span className="text-zinc-600">Own</span>
                                        ) : (
                                          <span className="text-[#D97757]">
                                            Titipan ({l.consignorName ?? 'Mitra'})
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-1.5 px-3 text-center">
                                        {l.inputMode === 'pack' ? (
                                          <span className="font-mono">
                                            {l.qtyPack} pack (@{l.pcsPerPackSnapshot} pcs)
                                          </span>
                                        ) : (
                                          <span className="font-mono">Pcs langsung</span>
                                        )}
                                      </td>
                                      <td className="py-1.5 px-3 text-right font-mono font-bold text-zinc-900">
                                        {l.qtyPcs} pcs
                                      </td>
                                      <td className="py-1.5 px-3 text-right font-mono text-zinc-700">
                                        {l.ownerType === 'own' ? formatRupiah(l.totalCost) : 'Rp 0'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-[11px] text-zinc-400 italic">
                              Tidak ada rincian item (klik untuk memuat detail).
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
