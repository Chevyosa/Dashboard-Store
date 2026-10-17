'use client';

import { useState, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createTakeProfit,
  type TakeProfitItem,
  type TakeProfitOverview,
  type TakeProfitPaymentMethod,
} from '@/lib/api';
import { formatRupiah } from '@/lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (item: TakeProfitItem) => void;
  overview: TakeProfitOverview | null;
}

function getTodayJakarta(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0] ?? '';
  }
}

export function TakeProfitDialog({ open, onClose, onSaved, overview }: Props) {
  const [amount, setAmount] = useState<string>('');
  const [withdrawalDate, setWithdrawalDate] = useState<string>(getTodayJakarta());
  const [paymentMethod, setPaymentMethod] = useState<TakeProfitPaymentMethod>('cash');
  const [note, setNote] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const amountId = useId();
  const dateId = useId();
  const methodId = useId();
  const noteId = useId();

  if (!open) return null;

  const availableNum = overview ? Number(overview.availableToWithdraw) : 0;
  const numericAmount = Number(amount) || 0;
  const isOverSafeLimit = availableNum > 0 && numericAmount > availableNum;

  function handleFillMaxSafe() {
    if (availableNum > 0) {
      setAmount(String(Math.round(availableNum)));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!amount || numericAmount <= 0) {
      setErrorMessage('Nominal penarikan laba harus berupa angka lebih besar dari 0.');
      return;
    }

    if (!withdrawalDate) {
      setErrorMessage('Tanggal penarikan wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createTakeProfit({
        opnameId: overview?.latestOpname?.id ?? null,
        amount,
        withdrawalDate,
        paymentMethod,
        note: note.trim() || null,
      });

      onSaved(res.data);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mencatat penarikan laba.';
      setErrorMessage(msg);
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
      <div className="bg-white rounded-2xl shadow-xl border border-zinc-200/80 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-900">Catat Penarikan Laba (Take Profit)</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Tarik uang kas halal setelah hak penitip dan cadangan belanja disisihkan.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 text-lg leading-none p-1 rounded hover:bg-zinc-100 transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {errorMessage}
            </div>
          )}

          {/* Safe Available Banner */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-emerald-700 block">
                Nominal Halal & Aman Ditarik Saat Ini:
              </span>
              <span className="text-base font-bold text-emerald-800 font-mono">
                {overview ? formatRupiah(overview.availableToWithdraw) : '—'}
              </span>
            </div>

            {availableNum > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleFillMaxSafe}
                className="h-7 text-xs border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-800"
              >
                Tarik Semua Aman
              </Button>
            )}
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <Label htmlFor={amountId} className="text-xs font-semibold text-zinc-700">
              Nominal yang Ditarik (Rp)
            </Label>
            <Input
              id={amountId}
              type="number"
              min="1"
              step="1000"
              placeholder="Contoh: 150000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10 text-sm font-mono"
              required
            />
            {amount && (
              <span className="text-[11px] text-zinc-500 block">
                Terbaca: <strong className="text-zinc-800 font-mono">{formatRupiah(amount)}</strong>
              </span>
            )}

            {isOverSafeLimit && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 flex items-start gap-2 mt-1">
                <span>⚠️</span>
                <div>
                  <strong>Perhatian:</strong> Nominal ini melebihi batas aman yang dianjurkan (
                  {formatRupiah(overview?.availableToWithdraw)}). Mengambil lebih dari batas aman berisiko mengurangi modal belanja toko atau hak penitip.
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Withdrawal Date */}
            <div className="space-y-1.5">
              <Label htmlFor={dateId} className="text-xs font-semibold text-zinc-700">
                Tanggal Penarikan
              </Label>
              <Input
                id={dateId}
                type="date"
                value={withdrawalDate}
                onChange={(e) => setWithdrawalDate(e.target.value)}
                className="h-9 text-xs font-mono"
                required
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <Label htmlFor={methodId} className="text-xs font-semibold text-zinc-700">
                Metode Penarikan
              </Label>
              <select
                id={methodId}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as TakeProfitPaymentMethod)}
                className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#D97757]/40"
              >
                <option value="cash">Uang Tunai (Cash Fisik Kasir)</option>
                <option value="transfer">Transfer Rekening (Bank)</option>
              </select>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor={noteId} className="text-xs font-semibold text-zinc-700">
              Catatan (Opsional)
            </Label>
            <Input
              id={noteId}
              type="text"
              placeholder="Contoh: Prive mingguan / kebutuhan pribadi owner"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
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
              type="submit"
              disabled={submitting}
              className="h-8 text-xs px-4 bg-[#D97757] hover:bg-[#c26243] text-white font-medium shadow-xs"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Penarikan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
