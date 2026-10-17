'use client';

import { useState, useId, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createConsignorPayment,
  type ConsignorPayment,
  type ConsignorLedgerItem,
} from '@/lib/api';
import { formatRupiah } from '@/lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (payment: ConsignorPayment) => void;
  consignors: ConsignorLedgerItem[];
  selectedConsignorId?: number | null;
}

function getTodayJakarta(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0] ?? '';
  }
}

interface FormContentProps {
  onClose: () => void;
  onSaved: (payment: ConsignorPayment) => void;
  consignors: ConsignorLedgerItem[];
  selectedConsignorId?: number | null;
}

function PaymentFormContent({
  onClose,
  onSaved,
  consignors,
  selectedConsignorId,
}: FormContentProps) {
  const initialId = selectedConsignorId ?? consignors[0]?.consignorId ?? null;
  const [consignorId, setConsignorId] = useState<number | null>(initialId);
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(getTodayJakarta());
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'qris'>('cash');
  const [note, setNote] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const consignorSelectId = useId();
  const amountId = useId();
  const dateId = useId();
  const methodId = useId();
  const noteId = useId();

  const selectedLedger = consignors.find((c) => c.consignorId === consignorId);
  const currentBalanceNum = selectedLedger ? Number(selectedLedger.balance) : 0;

  // Auto-fill amount to settle balance if user clicks the quick button
  function handleFillBalance() {
    if (selectedLedger && currentBalanceNum > 0) {
      setAmount(String(Math.round(currentBalanceNum)));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!consignorId) {
      setErrorMessage('Pilih mitra penitip.');
      return;
    }

    const numericAmount = Number(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Nominal pembayaran harus berupa angka lebih besar dari 0.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createConsignorPayment({
        consignorId,
        amount: String(numericAmount),
        paymentDate,
        paymentMethod,
        note: note.trim() || null,
      });
      onSaved(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mencatat pembayaran.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-4 sm:p-6 shadow-xl border border-zinc-200 max-h-[92dvh] overflow-y-auto flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-zinc-900">Catat Pembayaran Hak Penitip</h2>
          <p className="text-[11px] text-zinc-500">
            Penyaluran kas atau transfer bagi hasil konsinyasi.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 text-lg leading-none p-1"
        >
          ✕
        </button>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Consignor Selection */}
        <div className="space-y-1.5">
          <Label htmlFor={consignorSelectId} className="text-xs font-semibold text-zinc-700">
            Mitra Penitip <span className="text-red-500">*</span>
          </Label>
          <select
            id={consignorSelectId}
            value={consignorId ?? ''}
            onChange={(e) => setConsignorId(Number(e.target.value))}
            className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#D97757]/40"
          >
            {consignors.map((c) => (
              <option key={c.consignorId} value={c.consignorId}>
                {c.consignorName} — Saldo: {formatRupiah(c.balance)}
              </option>
            ))}
          </select>
        </div>

        {/* Current Balance Hint */}
        {selectedLedger && (
          <div className="rounded-lg bg-zinc-50 border border-zinc-200/80 p-2.5 flex items-center justify-between text-xs">
            <div>
              <span className="text-zinc-500 text-[11px]">Sisa saldo hutang toko: </span>
              <span
                className={`font-mono font-bold ${
                  currentBalanceNum > 0
                    ? 'text-[#D97757]'
                    : currentBalanceNum < 0
                    ? 'text-sky-700'
                    : 'text-emerald-700'
                }`}
              >
                {formatRupiah(selectedLedger.balance)}
              </span>
            </div>
            {currentBalanceNum > 0 && (
              <button
                type="button"
                onClick={handleFillBalance}
                className="text-[11px] font-medium text-[#D97757] hover:underline"
              >
                Lunasi Pas Saldo
              </button>
            )}
          </div>
        )}

        {/* Amount */}
        <div className="space-y-1.5">
          <Label htmlFor={amountId} className="text-xs font-semibold text-zinc-700">
            Nominal Bayar (Rp) <span className="text-red-500">*</span>
          </Label>
          <Input
            id={amountId}
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Contoh: 50000"
            className="h-9 text-xs font-mono"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Payment Date */}
          <div className="space-y-1.5">
            <Label htmlFor={dateId} className="text-xs font-semibold text-zinc-700">
              Tanggal Bayar <span className="text-red-500">*</span>
            </Label>
            <Input
              id={dateId}
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="h-9 text-xs font-mono"
              required
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <Label htmlFor={methodId} className="text-xs font-semibold text-zinc-700">
              Metode Pembayaran
            </Label>
            <select
              id={methodId}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'transfer' | 'qris')}
              className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#D97757]/40"
            >
              <option value="cash">Tunai (Cash)</option>
              <option value="qris">QRIS</option>
              <option value="transfer">Transfer Bank</option>
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
            placeholder="Contoh: Dititipkan ke kurir / bukti transfer WA"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-zinc-100 p-3 sm:p-4 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 flex items-center justify-end gap-2 shrink-0">
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
            disabled={submitting || !consignorId}
            className="h-9 text-xs px-4 bg-[#D97757] hover:bg-[#c26243] text-white font-medium shadow-xs"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function PaymentDialog({
  open,
  onClose,
  onSaved,
  consignors,
  selectedConsignorId,
}: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs"
    >
      <PaymentFormContent
        key={selectedConsignorId ? `pay-${selectedConsignorId}` : 'pay-new'}
        onClose={onClose}
        onSaved={onSaved}
        consignors={consignors}
        selectedConsignorId={selectedConsignorId}
      />
    </div>
  );
}
