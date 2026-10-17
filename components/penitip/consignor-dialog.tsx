'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createConsignor,
  updateConsignor,
  type Consignor,
  type CreateConsignorPayload,
} from '@/lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (consignor: Consignor) => void;
  initialData?: Consignor | null;
}

interface FormContentProps {
  initialData?: Consignor | null;
  onClose: () => void;
  onSaved: (consignor: Consignor) => void;
}

function ConsignorFormContent({ initialData, onClose, onSaved }: FormContentProps) {
  const isEditing = Boolean(initialData);

  const [name, setName] = useState(initialData?.name ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '');
  const [note, setNote] = useState(initialData?.note ?? '');
  const [marginOption, setMarginOption] = useState<'none' | 'nominal' | 'percent'>(
    initialData?.defaultMarginType ?? 'none'
  );
  const [marginValue, setMarginValue] = useState(initialData?.defaultMarginValue ?? '');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Nama penitip wajib diisi.');
      return;
    }

    let defaultMarginType: 'nominal' | 'percent' | null = null;
    let defaultMarginVal: string | null = null;

    if (marginOption !== 'none') {
      const val = marginValue.trim();
      if (!val) {
        setErrorMessage('Nilai margin default wajib diisi jika jenis margin dipilih.');
        return;
      }

      if (marginOption === 'nominal') {
        const num = parseFloat(val);
        if (isNaN(num) || num < 0) {
          setErrorMessage('Nilai margin nominal tidak boleh negatif.');
          return;
        }
        defaultMarginType = 'nominal';
        defaultMarginVal = val;
      } else if (marginOption === 'percent') {
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0 || num >= 100) {
          setErrorMessage('Persentase margin harus lebih besar dari 0% dan kurang dari 100%.');
          return;
        }
        defaultMarginType = 'percent';
        defaultMarginVal = val;
      }
    }

    const payload: CreateConsignorPayload = {
      name: trimmedName,
      phone: phone.trim() ? phone.trim() : null,
      note: note.trim() ? note.trim() : null,
      defaultMarginType,
      defaultMarginValue: defaultMarginVal,
    };

    setLoading(true);
    try {
      if (isEditing && initialData) {
        const res = await updateConsignor(initialData.id, payload);
        onSaved(res.data);
      } else {
        const res = await createConsignor(payload);
        onSaved(res.data);
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Terjadi kesalahan saat menyimpan data penitip.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-2">
          <span className="h-4 w-1.5 bg-[#D97757]" />
          <h2 id="dialog-title" className="font-bold text-sm text-zinc-900 font-sans">
            {isEditing ? 'Ubah Data Penitip' : 'Tambah Penitip Baru'}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 text-lg leading-none p-1 rounded-md"
          aria-label="Tutup dialog"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
        {errorMessage && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
            {errorMessage}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="consignor-name" className="text-xs font-semibold text-zinc-700">
            Nama Penitip <span className="text-red-500">*</span>
          </Label>
          <Input
            id="consignor-name"
            type="text"
            autoFocus
            placeholder="Contoh: Pak Sani, Kak Peja"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="consignor-phone" className="text-xs font-semibold text-zinc-700">
            No. Telepon / WhatsApp <span className="text-zinc-400 font-normal">(opsional)</span>
          </Label>
          <Input
            id="consignor-phone"
            type="tel"
            placeholder="08xxxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-9 text-sm font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="consignor-note" className="text-xs font-semibold text-zinc-700">
            Catatan <span className="text-zinc-400 font-normal">(opsional)</span>
          </Label>
          <textarea
            id="consignor-note"
            rows={2}
            placeholder="Jadwal setor, no. rekening BCA, kontak darurat, dll."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-md border border-zinc-200 p-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#D97757]/40 focus:border-[#D97757] resize-none"
          />
        </div>

        {/* Default Margin Scheme (Optional) */}
        <div className="pt-2 border-t border-zinc-100 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-zinc-700">
              Skema Margin Default
            </Label>
            <span className="text-[10px] text-zinc-400 font-mono">Prefill saat buat produk</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setMarginOption('none');
                setMarginValue('');
              }}
              className={`py-1.5 px-2 rounded-md text-xs font-medium border text-center transition-colors ${
                marginOption === 'none'
                  ? 'border-[#D97757] bg-orange-50/50 text-[#D97757] font-semibold'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              Tidak Ada
            </button>
            <button
              type="button"
              onClick={() => setMarginOption('nominal')}
              className={`py-1.5 px-2 rounded-md text-xs font-medium border text-center transition-colors ${
                marginOption === 'nominal'
                  ? 'border-[#D97757] bg-orange-50/50 text-[#D97757] font-semibold'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              Nominal (Rp)
            </button>
            <button
              type="button"
              onClick={() => setMarginOption('percent')}
              className={`py-1.5 px-2 rounded-md text-xs font-medium border text-center transition-colors ${
                marginOption === 'percent'
                  ? 'border-[#D97757] bg-orange-50/50 text-[#D97757] font-semibold'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              Persentase (%)
            </button>
          </div>

          {marginOption === 'nominal' && (
            <div className="space-y-1 pt-1">
              <Label htmlFor="margin-nominal-val" className="text-[11px] text-zinc-600">
                Margin Pemilik per Pcs (Rupiah)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-mono text-zinc-400">Rp</span>
                <Input
                  id="margin-nominal-val"
                  type="text"
                  placeholder="1000"
                  value={marginValue}
                  onChange={(e) => setMarginValue(e.target.value)}
                  className="h-8 pl-9 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {marginOption === 'percent' && (
            <div className="space-y-1 pt-1">
              <Label htmlFor="margin-percent-val" className="text-[11px] text-zinc-600">
                Persentase Margin Pemilik (%)
              </Label>
              <div className="relative">
                <Input
                  id="margin-percent-val"
                  type="text"
                  placeholder="Contoh: 3.65"
                  value={marginValue}
                  onChange={(e) => setMarginValue(e.target.value)}
                  className="h-8 pr-8 text-xs font-mono"
                />
                <span className="absolute right-3 top-2 text-xs font-mono text-zinc-400">%</span>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-zinc-100 p-3 sm:p-4 -mx-6 -mb-6 flex items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="h-9 text-xs px-3"
          >
            Batal
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={loading}
            className="h-9 px-4 bg-[#D97757] hover:bg-[#c26243] text-white text-xs font-medium"
          >
            {loading ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah Penitip'}
          </Button>
        </div>
      </form>
    </>
  );
}

export function ConsignorDialog({ open, onClose, onSaved, initialData }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-900/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        key={initialData ? `edit-${initialData.id}` : 'create'}
        className="w-full max-w-md rounded-t-2xl sm:rounded-xl bg-white border border-zinc-200 shadow-xl max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <ConsignorFormContent
          initialData={initialData}
          onClose={onClose}
          onSaved={onSaved}
        />
      </div>
    </div>
  );
}
