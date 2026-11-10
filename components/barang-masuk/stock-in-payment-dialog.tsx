'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createStockInPayment,
  getStockInPayments,
  type CreateStockInPaymentPayload,
  type StockIn,
  type StockInPayment,
  type StockInPaymentHistory,
  type StockInPaymentMethod,
} from '@/lib/api';
import { formatRupiah } from '@/lib/format';

interface Props {
  open: boolean;
  stockIn: StockIn;
  onClose: () => void;
  onPaid?: (payment: StockInPayment) => void;
}

const METHOD_LABELS: Record<StockInPaymentMethod, string> = {
  cash: 'Tunai',
  transfer: 'Transfer',
  qris: 'QRIS',
};

// Mirrors backend DECIMAL(20,4) validation.
const AMOUNT_REGEX = /^\d{1,16}(\.\d{1,4})?$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Converts a decimal string to 1/10000 units without float rounding. */
function toUnits(value: string): bigint {
  const [intPart = '0', decPart = ''] = value.trim().split('.');
  return BigInt(`${intPart || '0'}${decPart.padEnd(4, '0').slice(0, 4)}`);
}

function getTodayJakarta(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0] ?? '';
  }
}

export function StockInPaymentDialog({ open, stockIn, onClose, onPaid }: Props) {
  const [history, setHistory] = useState<StockInPaymentHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayJakarta);
  const [paymentMethod, setPaymentMethod] = useState<StockInPaymentMethod>('cash');
  const [note, setNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Key + serialized body of the last unconfirmed attempt, so a retry of the
  // exact same payment replays safely instead of double-recording.
  const pendingAttempt = useRef<{ key: string; body: string } | null>(null);

  const titleId = useId();
  const amountId = useId();
  const dateId = useId();
  const methodId = useId();
  const noteId = useId();

  useEffect(() => {
    if (!open) return;
    let ignore = false;

    getStockInPayments(stockIn.id)
      .then((res) => {
        if (ignore) return;
        setHistory(res.data);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setLoadError(err instanceof Error ? err.message : 'Gagal memuat riwayat pembayaran.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [open, stockIn.id, reloadToken]);

  if (!open) return null;

  const outstandingUnits = history ? toUnits(history.outstandingAmount) : null;
  const isSettled = outstandingUnits !== null && outstandingUnits <= BigInt(0);
  const canSubmit = history !== null && !isSettled && !submitting;

  function validate(): string | null {
    const trimmed = amount.trim();
    if (!AMOUNT_REGEX.test(trimmed) || toUnits(trimmed) <= BigInt(0)) {
      return 'Nominal pembayaran harus berupa angka lebih besar dari 0 (maks. 4 desimal).';
    }
    if (outstandingUnits !== null && toUnits(trimmed) > outstandingUnits) {
      return `Nominal pembayaran melebihi sisa tagihan (${formatRupiah(history?.outstandingAmount)}).`;
    }
    if (!DATE_REGEX.test(paymentDate)) {
      return 'Tanggal pembayaran wajib diisi (format YYYY-MM-DD).';
    }
    if (!(paymentMethod in METHOD_LABELS)) {
      return 'Metode pembayaran tidak valid.';
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    if (!canSubmit) return;

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload: CreateStockInPaymentPayload = {
      amount: amount.trim(),
      paymentDate,
      paymentMethod,
      note: note.trim() || null,
    };
    const body = JSON.stringify(payload);
    if (pendingAttempt.current?.body !== body) {
      pendingAttempt.current = { key: crypto.randomUUID(), body };
    }
    const { key } = pendingAttempt.current;

    setSubmitting(true);
    try {
      const res = await createStockInPayment(stockIn.id, payload, key);
      pendingAttempt.current = null;
      setAmount('');
      setNote('');
      setSuccessMessage(`Pembayaran berhasil dicatat: ${formatRupiah(res.data.amount)}.`);
      setReloadToken((t) => t + 1);
      onPaid?.(res.data);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Gagal mencatat pembayaran.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-zinc-200/80 w-full max-w-lg max-h-[92dvh] overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-white/95 backdrop-blur-xs z-10 p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between shrink-0">
          <div>
            <h2 id={titleId} className="text-sm font-bold text-zinc-900">
              Pembayaran Belanja {stockIn.date}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Catat pelunasan nota belanja. Pembayaran bisa dicicil dan riwayat tidak dapat diubah.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-zinc-400 hover:text-zinc-600 text-lg leading-none p-2 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 flex-1">
          {loading && !history && (
            <p aria-live="polite" className="text-xs text-zinc-500">
              Memuat riwayat pembayaran...
            </p>
          )}

          {loadError && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
            >
              {loadError}
            </div>
          )}

          {history && (
            <>
              <dl className="grid grid-cols-3 gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs">
                <div>
                  <dt className="text-[10px] text-zinc-500">Total Nota</dt>
                  <dd data-testid="payment-receipt-total" className="font-mono font-bold text-zinc-900">
                    {formatRupiah(history.receiptTotal)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] text-zinc-500">Sudah Dibayar</dt>
                  <dd data-testid="payment-paid-amount" className="font-mono font-bold text-emerald-700">
                    {formatRupiah(history.paidAmount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] text-zinc-500">Sisa Tagihan</dt>
                  <dd
                    data-testid="payment-outstanding-amount"
                    className="font-mono font-bold text-amber-700"
                  >
                    {formatRupiah(history.outstandingAmount)}
                  </dd>
                </div>
              </dl>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500">Status:</span>
                {isSettled ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    Lunas
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                    Belum Lunas
                  </span>
                )}
              </div>

              <section className="space-y-1.5">
                <h3 className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                  Riwayat Pembayaran
                </h3>
                {history.payments.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Belum ada pembayaran tercatat.</p>
                ) : (
                  <ul
                    aria-label="Riwayat pembayaran"
                    className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 text-xs"
                  >
                    {history.payments.map((p) => (
                      <li key={p.id} className="flex items-start justify-between gap-2 p-2.5">
                        <div>
                          <span className="font-mono text-zinc-900">{p.paymentDate}</span>
                          <span className="ml-2 text-zinc-600">{METHOD_LABELS[p.paymentMethod]}</span>
                          {p.note && <span className="block text-[11px] text-zinc-500">{p.note}</span>}
                        </div>
                        <span className="font-mono font-bold text-zinc-900 shrink-0">
                          {formatRupiah(p.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}

          {successMessage && (
            <div
              role="status"
              className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"
            >
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-3 border-t border-zinc-100 pt-4">
            {formError && (
              <div
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
              >
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor={amountId} className="text-xs font-semibold text-zinc-700">
                Nominal Pembayaran (Rp)
              </Label>
              <Input
                id={amountId}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="Contoh: 25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!canSubmit && !submitting}
                className="h-10 text-sm font-mono"
              />
              <span className="text-[11px] text-zinc-500 block">
                Pembayaran sebagian diperbolehkan, maksimal sebesar sisa tagihan. Pembayaran aktual
                tetap dapat dicatat walau kas cadangan belanja terlampaui.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={dateId} className="text-xs font-semibold text-zinc-700">
                  Tanggal Pembayaran
                </Label>
                <Input
                  id={dateId}
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={methodId} className="text-xs font-semibold text-zinc-700">
                  Metode Pembayaran
                </Label>
                <select
                  id={methodId}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as StockInPaymentMethod)}
                  className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#D97757]/40"
                >
                  <option value="cash">Tunai</option>
                  <option value="transfer">Transfer</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={noteId} className="text-xs font-semibold text-zinc-700">
                Catatan (Opsional)
              </Label>
              <Input
                id={noteId}
                type="text"
                maxLength={1000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
                className="h-9 text-xs px-3"
              >
                Tutup
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="h-9 text-xs px-4 bg-[#D97757] hover:bg-[#c26243] text-white font-medium shadow-xs"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
