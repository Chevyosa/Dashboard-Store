'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { setConsignorStatus, type Consignor } from '@/lib/api';

interface Props {
  open: boolean;
  consignor: Consignor | null;
  onClose: () => void;
  onStatusChanged: (updated: Consignor) => void;
}

export function ConsignorStatusDialog({ open, consignor, onClose, onStatusChanged }: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!open || !consignor) return null;

  const willActivate = !consignor.isActive;

  async function handleConfirm() {
    if (!consignor) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await setConsignorStatus(consignor.id, willActivate);
      onStatusChanged(res.data);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Gagal mengubah status penitip.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-900/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl bg-white border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-dialog-title"
      >
        <div className="w-12 h-1 bg-zinc-200 rounded-full mx-auto sm:hidden mt-3 -mb-1" />
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`size-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                willActivate ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {willActivate ? '✓' : '!'}
            </div>
            <div>
              <h3 id="status-dialog-title" className="text-sm font-bold text-zinc-900">
                {willActivate ? 'Aktifkan Penitip?' : 'Nonaktifkan Penitip?'}
              </h3>
              <p className="text-xs text-zinc-500 font-medium">{consignor.name}</p>
            </div>
          </div>

          <p className="text-xs text-zinc-600 leading-relaxed">
            {willActivate
              ? `Penitip ini akan diaktifkan kembali dan akan muncul di pilihan pembuatan produk atau pencatatan barang masuk.`
              : `Penitip yang dinonaktifkan tidak akan muncul di form pembuatan produk atau barang masuk baru. Riwayat keuangan dan ledger tetap tersimpan utuh.`}
          </p>

          {errorMessage && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 font-medium">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="h-10 sm:h-8 text-xs px-3"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={loading}
              className={`h-10 sm:h-8 text-xs font-medium text-white px-4 ${
                willActivate
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-zinc-700 hover:bg-zinc-800'
              }`}
            >
              {loading ? 'Memproses...' : willActivate ? 'Ya, Aktifkan' : 'Ya, Nonaktifkan'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
