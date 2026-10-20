'use client';

import { useState, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createStockReturn,
  updateStockReturn,
  type StockReturn,
  type Product,
} from '@/lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (ret: StockReturn) => void;
  initialData?: StockReturn | null;
  products: Product[];
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
  onSaved: (ret: StockReturn) => void;
  initialData?: StockReturn | null;
  products: Product[];
}

function StockReturnFormContent({
  onClose,
  onSaved,
  initialData,
  products,
}: FormContentProps) {
  const isEditing = Boolean(initialData);
  const consignorProducts = products.filter(
    (p) => p.ownerType === 'consignor' && (p.isActive || p.id === initialData?.productId)
  );

  const [productId, setProductId] = useState<number | null>(
    initialData?.productId ?? (consignorProducts[0]?.id ?? null)
  );
  const [qtyPcs, setQtyPcs] = useState<string>(
    initialData ? String(initialData.qtyPcs) : '1'
  );
  const [date, setDate] = useState<string>(
    initialData?.date ?? getTodayJakarta()
  );
  const [note, setNote] = useState<string>(initialData?.note ?? '');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const productSelectId = useId();
  const qtyId = useId();
  const dateId = useId();
  const noteId = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!productId) {
      setErrorMessage('Pilih produk titipan yang diretur.');
      return;
    }

    const qty = parseInt(qtyPcs, 10);
    if (!Number.isInteger(qty) || qty < 1) {
      setErrorMessage('Jumlah pcs retur harus berupa bilangan bulat minimal 1.');
      return;
    }

    if (!date) {
      setErrorMessage('Tanggal retur wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && initialData) {
        const res = await updateStockReturn(initialData.id, {
          qtyPcs: qty,
          date,
          note: note.trim() || null,
        });
        onSaved(res.data);
      } else {
        const res = await createStockReturn({
          productId,
          qtyPcs: qty,
          date,
          note: note.trim() || null,
        });
        onSaved(res.data);
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Gagal menyimpan data retur.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl bg-white p-5 sm:p-6 shadow-xl border border-zinc-200 space-y-4 max-h-[92dvh] overflow-y-auto">
      <div className="w-12 h-1 bg-zinc-200 rounded-full mx-auto sm:hidden -mt-1 mb-2" />
      <div className="space-y-1">
        <h2 className="text-base font-bold text-zinc-900">
          {isEditing ? 'Ubah Retur Penitip' : 'Catat Retur Penitip'}
        </h2>
        <p className="text-xs text-zinc-500">
          Pengembalian barang titipan yang tidak laku atau ditarik kembali oleh mitra penitip.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info note */}
        <div className="rounded-lg bg-orange-50/60 p-3 text-[11px] text-zinc-600 border border-orange-100/80 leading-relaxed">
          <span className="font-semibold text-[#D97757]">Aturan Pure Opname:</span> Retur mengurangi stok fisik yang diharapkan (expected stock) saat opname mingguan tanpa memotong saldo kas atau kewajiban pembayaran penitip.
        </div>

        {/* Product Select */}
        <div className="space-y-1.5">
          <Label htmlFor={productSelectId} className="text-xs font-semibold text-zinc-700">
            Produk Titipan <span className="text-red-500">*</span>
          </Label>
          {consignorProducts.length === 0 ? (
            <p className="text-xs text-red-600">
              Tidak ada produk titipan yang terdaftar. Tambahkan produk titipan terlebih dahulu di Master Produk.
            </p>
          ) : (
            <select
              id={productSelectId}
              disabled={isEditing}
              value={productId ?? ''}
              onChange={(e) => setProductId(Number(e.target.value))}
              className="w-full h-10 sm:h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#D97757]/40 disabled:bg-zinc-100"
            >
              {consignorProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.consignorName ? `(Mitra: ${p.consignorName})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Quantity */}
          <div className="space-y-1.5">
            <Label htmlFor={qtyId} className="text-xs font-semibold text-zinc-700">
              Jumlah Retur (Pcs) <span className="text-red-500">*</span>
            </Label>
            <Input
              id={qtyId}
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={qtyPcs}
              onChange={(e) => setQtyPcs(e.target.value)}
              placeholder="1"
              className="h-10 sm:h-9 text-xs font-mono"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor={dateId} className="text-xs font-semibold text-zinc-700">
              Tanggal Retur <span className="text-red-500">*</span>
            </Label>
            <Input
              id={dateId}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 sm:h-9 text-xs font-mono"
            />
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
            placeholder="Contoh: Ditarik karena tidak laku, kemasan sobek"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-10 sm:h-9 text-xs"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="h-10 sm:h-8 text-xs px-3"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={submitting || consignorProducts.length === 0}
            className="h-10 sm:h-8 text-xs px-4 bg-[#D97757] hover:bg-[#c26243] text-white font-medium shadow-xs"
          >
            {submitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Catat Retur'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function StockReturnDialog({
  open,
  onClose,
  onSaved,
  initialData,
  products,
}: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs"
    >
      <StockReturnFormContent
        key={initialData ? `return-${initialData.id}` : 'return-create'}
        initialData={initialData}
        products={products}
        onClose={onClose}
        onSaved={onSaved}
      />
    </div>
  );
}
