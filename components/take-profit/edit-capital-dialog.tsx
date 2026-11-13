'use client';

import { useState, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateWorkingCapital } from '@/lib/api';
import { formatRupiah } from '@/lib/format';

interface Props {
  open: boolean;
  currentValue: string;
  onClose: () => void;
  onSaved: (newValue: string) => void;
}

export function EditCapitalDialog({ open, currentValue, onClose, onSaved }: Props) {
  const [value, setValue] = useState<string>(String(Math.round(Number(currentValue) || 400000)));
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputId = useId();

  if (!open) return null;

  const quickOptions = [300000, 400000, 500000, 750000, 1000000];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const num = Number(value);
    if (!value || isNaN(num) || num < 0) {
      setErrorMessage('Nominal modal belanja harus berupa angka dan tidak boleh negatif.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateWorkingCapital(value);
      onSaved(res.data.minWorkingCapital);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui target modal belanja.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-zinc-200/80 w-full max-w-md max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-150 flex flex-col">
        <div className="sticky top-0 bg-white/95 backdrop-blur-xs z-10 p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-bold text-zinc-900">Atur Cadangan Modal Belanja</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Batas kas minimal yang harus tetap ada di toko untuk belanja periode depan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 text-lg leading-none p-2 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 flex-1">
          {errorMessage && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {errorMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor={inputId} className="text-xs font-semibold text-zinc-700">
              Nominal Cadangan Modal (Rp)
            </Label>
            <Input
              id={inputId}
              type="number"
              min="0"
              step="any"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Contoh: 400000"
              className="h-10 text-sm font-mono"
              required
            />
            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5">
              <span>Preview: <strong className="text-zinc-800 font-mono">{formatRupiah(value || '0')}</strong></span>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-zinc-500">Pilihan Cepat:</span>
            <div className="flex flex-wrap gap-1.5">
              {quickOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setValue(String(opt))}
                  className={`text-xs px-2.5 py-1 rounded-md border font-mono transition-colors ${
                    Number(value) === opt
                      ? 'border-[#D97757] bg-orange-50 text-[#D97757] font-semibold'
                      : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  {formatRupiah(String(opt))}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-800 space-y-1">
            <p className="font-semibold">💡 Cara Kerja Cadangan Modal:</p>
            <p className="text-[11px] leading-relaxed text-blue-700">
              Sistem akan otomatis menjaga agar penarikan laba Anda tidak memakan nominal ini. Jika sisa uang kas toko di bawah angka ini, status penarikan akan memberi peringatan untuk menahan penarikan laba.
            </p>
          </div>

          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-zinc-100 p-3 sm:p-4 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="h-9 text-xs px-3"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-9 text-xs px-4 bg-[#D97757] hover:bg-[#c26243] text-white font-medium shadow-xs"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
