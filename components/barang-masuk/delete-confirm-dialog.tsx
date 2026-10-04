'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Hapus',
  onClose,
  onConfirm,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!open) return null;

  async function handleConfirm() {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Gagal menghapus data.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-zinc-200 space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-zinc-900">{title}</h2>
          <p className="text-xs text-zinc-600 leading-relaxed">{description}</p>
        </div>

        {errorMessage && (
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="h-8 text-xs px-3"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="h-8 text-xs px-3 bg-red-600 hover:bg-red-700 text-white font-medium"
          >
            {submitting ? 'Menghapus...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
