'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { setProductStatus, type Product } from '@/lib/api';

interface Props {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onStatusChanged: (updated: Product) => void;
}

export function ProductStatusDialog({ open, product, onClose, onStatusChanged }: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!open || !product) return null;

  const willActivate = !product.isActive;

  async function handleConfirm() {
    if (!product) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await setProductStatus(product.id, willActivate);
      onStatusChanged(res.data);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Gagal mengubah status produk.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-dialog-title"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`size-10 rounded-full flex items-center justify-center text-sm font-bold ${
                willActivate ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {willActivate ? '✓' : '!'}
            </div>
            <div>
              <h3 id="status-dialog-title" className="text-sm font-bold text-zinc-900">
                {willActivate ? 'Aktifkan Produk?' : 'Nonaktifkan Produk?'}
              </h3>
              <p className="text-xs text-zinc-500 font-medium">{product.name}</p>
            </div>
          </div>

          <p className="text-xs text-zinc-600 leading-relaxed">
            {willActivate
              ? `Produk ini akan diaktifkan kembali dan dapat dipilih saat mencatat barang masuk atau melakukan opname fisik.`
              : `Produk yang dinonaktifkan tidak akan muncul pada pilihan pencatatan stok baru atau opname. Seluruh riwayat penjualan dan laba masa lalu tetap tersimpan utuh.`}
          </p>

          {errorMessage && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 font-medium">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={loading}
              className={`text-xs font-medium text-white ${
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
