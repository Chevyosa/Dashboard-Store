'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { LossRecord } from '@/lib/api';

interface Props {
  open: boolean;
  loss: LossRecord | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteLossDialog({ open, loss, onClose, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !loss) return null;

  async function handleConfirm() {
    try {
      setLoading(true);
      setError(null);
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal menghapus data loss.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
    >
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl border border-zinc-200 space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-zinc-900">Konfirmasi Hapus Catatan Loss</h2>
          <p className="text-xs text-zinc-500">
            Apakah Anda yakin ingin menghapus catatan loss barang{' '}
            <strong className="text-zinc-800">{loss.productName}</strong> sejumlah{' '}
            <strong className="text-zinc-800">{loss.qtyPcs} pcs</strong> ({loss.date})?
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="h-8 text-xs"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={loading}
            className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? 'Menghapus...' : 'Hapus Loss'}
          </Button>
        </div>
      </div>
    </div>
  );
}
