'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatRupiah, formatDateIndo } from '@/lib/format';
import type { TakeProfitItem } from '@/lib/api';

interface Props {
  items: TakeProfitItem[];
  loading: boolean;
  onDelete: (item: TakeProfitItem) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (newPage: number) => void;
}

export function TakeProfitTable({
  items,
  loading,
  onDelete,
  pagination,
  onPageChange,
}: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function handleDeleteClick(item: TakeProfitItem) {
    if (confirm(`Hapus catatan penarikan laba sebesar ${formatRupiah(item.amount)} pada tanggal ${formatDateIndo(item.withdrawalDate)}?`)) {
      setDeletingId(item.id);
      onDelete(item);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-xs text-zinc-500 shadow-xs">
        Memuat riwayat penarikan laba...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-xs text-zinc-500 shadow-xs">
        Belum ada catatan penarikan laba (Take Profit). Klik tombol <strong>+ Catat Tarik Laba</strong> di atas untuk mencatat penarikan.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
              <tr>
                <th className="py-3 px-3.5">Tanggal Penarikan</th>
                <th className="py-3 px-3.5">Periode Opname</th>
                <th className="py-3 px-3.5 text-right">Nominal Ditarik</th>
                <th className="py-3 px-3.5 text-center">Metode</th>
                <th className="py-3 px-3.5">Catatan</th>
                <th className="py-3 px-3.5">Dicatat Oleh</th>
                <th className="py-3 px-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-3 px-3.5 font-mono text-zinc-900 font-medium">
                    {formatDateIndo(item.withdrawalDate)}
                  </td>
                  <td className="py-3 px-3.5 text-zinc-600 font-mono text-[11px]">
                    {item.opnameId ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="font-semibold text-zinc-800">Opname #{item.opnameId}</span>
                        {item.opnameDate && <span>({formatDateIndo(item.opnameDate)})</span>}
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700">
                    {formatRupiah(item.amount)}
                  </td>
                  <td className="py-3 px-3.5 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        item.paymentMethod === 'cash'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {item.paymentMethod === 'cash' ? '💵 Tunai' : '🏦 Transfer'}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-zinc-600 max-w-xs truncate">
                    {item.note || <span className="text-zinc-400 italic">Tanpa catatan</span>}
                  </td>
                  <td className="py-3 px-3.5 text-zinc-500 text-[11px]">
                    {item.createdByUsername || 'System'}
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClick(item)}
                      disabled={deletingId === item.id}
                      className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2"
                    >
                      {deletingId === item.id ? 'Menghapus...' : 'Hapus'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
          <div>
            Halaman <strong className="text-zinc-800">{pagination.page}</strong> dari{' '}
            <strong className="text-zinc-800">{pagination.totalPages}</strong> (Total {pagination.total} transaksi)
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="h-7 text-xs px-2.5"
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="h-7 text-xs px-2.5"
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
