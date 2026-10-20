'use client';

import { useId, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createLoss,
  updateLoss,
  type CreateLossPayload,
  type LossBorneBy,
  type LossReason,
  type LossRecord,
  type Product,
  type UpdateLossPayload,
} from '@/lib/api';
import { LOSS_REASON_LABELS } from './loss-reason-badge';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (loss: LossRecord) => void;
  initialData?: LossRecord | null;
  products: Product[];
}

function getTodayJakarta(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0] ?? '';
  }
}

function getDefaultLossBorneBy(ownerType: 'own' | 'consignor', reason: LossReason): LossBorneBy {
  if (ownerType === 'own') return 'owner';
  switch (reason) {
    case 'expired':
    case 'damaged_before_display':
      return 'consignor';
    case 'damaged_on_display':
    case 'lost':
    case 'other':
    default:
      return 'owner';
  }
}

function formatRupiah(num: number): string {
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
}

const REASONS: LossReason[] = [
  'expired',
  'damaged_on_display',
  'damaged_before_display',
  'lost',
  'other',
];

interface FormContentProps {
  onClose: () => void;
  onSaved: (loss: LossRecord) => void;
  initialData?: LossRecord | null;
  products: Product[];
}

function LossFormContent({ onClose, onSaved, initialData, products }: FormContentProps) {
  const isEditing = Boolean(initialData);

  const availableProducts = useMemo(() => {
    return products.filter((p) => (initialData ? true : p.isActive));
  }, [products, initialData]);

  const [productId, setProductId] = useState<number>(() => {
    if (initialData) return initialData.productId;
    return availableProducts[0]?.id ?? 0;
  });

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === productId);
  }, [products, productId]);

  const [qtyPcs, setQtyPcs] = useState<string>(
    initialData ? String(initialData.qtyPcs) : '1'
  );

  const [reason, setReason] = useState<LossReason>(
    initialData?.reason ?? 'expired'
  );

  const [borneBy, setBorneBy] = useState<LossBorneBy>(() => {
    if (initialData) return initialData.borneBy;
    const initialProd = availableProducts[0];
    return getDefaultLossBorneBy(initialProd?.ownerType ?? 'own', 'expired');
  });

  const [date, setDate] = useState<string>(
    initialData?.date ?? getTodayJakarta()
  );
  const [note, setNote] = useState<string>(initialData?.note ?? '');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dateId = useId();
  const noteId = useId();
  const qtyId = useId();

  // Handle product change
  function handleProductChange(newProdId: number) {
    setProductId(newProdId);
    const prod = products.find((p) => p.id === newProdId);
    if (!prod) return;

    if (prod.ownerType === 'own') {
      setBorneBy('owner');
    } else {
      // Auto-prefill default borne_by for consignor based on current reason
      setBorneBy(getDefaultLossBorneBy('consignor', reason));
    }
  }

  // Handle reason change
  function handleReasonChange(newReason: LossReason) {
    setReason(newReason);
    if (!selectedProduct || selectedProduct.ownerType === 'own') {
      setBorneBy('owner');
    } else {
      // Auto-prefill default borne_by
      setBorneBy(getDefaultLossBorneBy('consignor', newReason));
    }
  }

  // Calculate live financial impact
  const financialImpact = useMemo(() => {
    const qty = parseInt(qtyPcs, 10);
    const validQty = Number.isInteger(qty) && qty > 0 ? qty : 0;

    if (!selectedProduct) {
      return { type: 'unknown', description: 'Pilih produk untuk melihat dampak finansial.' };
    }

    if (selectedProduct.ownerType === 'own') {
      return {
        type: 'own',
        amount: null,
        description: 'Biaya loss mengurangi Profit A (basis barang) sebesar modal beli saat opname.',
      };
    }

    // Consignor product
    const sellPrice = parseFloat(selectedProduct.sellPrice) || 0;
    let consignorShare = 0;

    if (selectedProduct.marginType === 'nominal') {
      const marginVal = parseFloat(selectedProduct.marginValue ?? '0') || 0;
      consignorShare = Math.max(0, sellPrice - marginVal);
    } else if (selectedProduct.marginType === 'percent') {
      const pct = parseFloat(selectedProduct.marginValue ?? '0') || 0;
      const ownerMargin = (sellPrice * pct) / 100;
      consignorShare = Math.max(0, sellPrice - ownerMargin);
    } else {
      consignorShare = sellPrice;
    }

    if (borneBy === 'owner') {
      const totalCompensation = validQty * consignorShare;
      return {
        type: 'consignor_owner',
        amount: totalCompensation,
        sharePerPcs: consignorShare,
        description: `Owner mengganti hak penitip (${selectedProduct.consignorName ?? 'Mitra'}): ${formatRupiah(totalCompensation)} (${formatRupiah(consignorShare)}/pcs × ${validQty} pcs). Ini ditambahkan ke tagihan payout penitip dan mengurangi Profit A.`,
      };
    }

    return {
      type: 'consignor_consignor',
      amount: 0,
      description: `Ditanggung oleh ${selectedProduct.consignorName ?? 'Penitip'}. Stok barang dihapus tanpa ganti rugi uang dari Owner (Rp 0).`,
    };
  }, [selectedProduct, borneBy, qtyPcs]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const parsedQty = parseInt(qtyPcs, 10);
    if (!Number.isInteger(parsedQty) || parsedQty < 1) {
      setErrorMessage('Jumlah pcs minimal 1.');
      return;
    }

    if (!date) {
      setErrorMessage('Tanggal kejadian wajib diisi.');
      return;
    }

    if (!productId) {
      setErrorMessage('Silakan pilih produk.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing && initialData) {
        const payload: UpdateLossPayload = {
          productId,
          qtyPcs: parsedQty,
          reason,
          borneBy,
          date,
          note: note.trim() || null,
        };
        const res = await updateLoss(initialData.id, payload);
        onSaved(res.data);
      } else {
        const payload: CreateLossPayload = {
          productId,
          qtyPcs: parsedQty,
          reason,
          borneBy,
          date,
          note: note.trim() || null,
        };
        const res = await createLoss(payload);
        onSaved(res.data);
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Gagal menyimpan data barang rusak/hilang.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isOwn = selectedProduct?.ownerType === 'own';

  return (
    <div className="w-full max-w-xl rounded-t-2xl sm:rounded-xl bg-white p-4 sm:p-6 shadow-xl border border-zinc-200 max-h-[92dvh] flex flex-col overflow-hidden">
      <div className="space-y-1 pb-2 border-b border-zinc-100 shrink-0">
        <h2 className="text-base font-bold text-zinc-900">
          {isEditing ? 'Ubah Catatan Loss' : 'Catat Barang Rusak / Hilang (Loss)'}
        </h2>
        <p className="text-xs text-zinc-500">
          Pencatatan barang berkurang bukan karena penjualan untuk dialokasikan saat opname.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
        {errorMessage && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Product Selection */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-zinc-700">
            Pilih Produk <span className="text-red-500">*</span>
          </Label>
          <select
            value={productId}
            onChange={(e) => handleProductChange(Number(e.target.value))}
            className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#D97757]"
          >
            {availableProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.ownerType === 'own' ? 'Milik Sendiri (Own)' : `Titipan (${p.consignorName ?? 'Mitra'})`}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={qtyId} className="text-xs font-semibold text-zinc-700">
              Jumlah Rusak / Hilang (Pcs) <span className="text-red-500">*</span>
            </Label>
            <Input
              id={qtyId}
              type="number"
              min="1"
              value={qtyPcs}
              onChange={(e) => setQtyPcs(e.target.value)}
              className="h-9 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={dateId} className="text-xs font-semibold text-zinc-700">
              Tanggal Kejadian <span className="text-red-500">*</span>
            </Label>
            <Input
              id={dateId}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-xs font-mono"
            />
          </div>
        </div>

        {/* Reason Selection */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-zinc-700">
            Alasan Kerusakan / Kehilangan <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {REASONS.map((r) => {
              const active = reason === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleReasonChange(r)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition-colors ${
                    active
                      ? 'border-[#D97757] bg-orange-50/70 text-[#c26243] font-semibold'
                      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {LOSS_REASON_LABELS[r]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Borne By Selection (Aku vs Penitip) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-zinc-700">
              Penanggung Kerugian <span className="text-red-500">*</span>
            </Label>
            {isOwn && (
              <span className="text-[10px] text-zinc-500 italic">
                (Terkunci: Produk milik sendiri ditanggung Owner)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBorneBy('owner')}
              className={`py-2 px-3 rounded-lg text-xs font-medium border text-left flex items-center justify-between transition-colors ${
                borneBy === 'owner'
                  ? 'border-zinc-800 bg-zinc-800 text-white font-semibold'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              <span>Aku (Owner)</span>
              {borneBy === 'owner' && <span className="text-xs">✓</span>}
            </button>

            <button
              type="button"
              disabled={isOwn}
              onClick={() => setBorneBy('consignor')}
              className={`py-2 px-3 rounded-lg text-xs font-medium border text-left flex items-center justify-between transition-colors ${
                borneBy === 'consignor'
                  ? 'border-orange-600 bg-orange-600 text-white font-semibold'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <span>Penitip {selectedProduct?.consignorName ? `(${selectedProduct.consignorName})` : ''}</span>
              {borneBy === 'consignor' && <span className="text-xs">✓</span>}
            </button>
          </div>
        </div>

        {/* Real-Time Financial Impact Box */}
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-700 text-[11px] uppercase tracking-wider">
              Dampak Finansial:
            </span>
            {typeof financialImpact.amount === 'number' && (
              <span className="font-mono font-bold text-zinc-900">
                {formatRupiah(financialImpact.amount)}
              </span>
            )}
          </div>
          <p className="text-zinc-600 leading-relaxed text-[11px]">
            {financialImpact.description}
          </p>
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <Label htmlFor={noteId} className="text-xs font-semibold text-zinc-700">
            Catatan Tambahan (Opsional)
          </Label>
          <Input
            id={noteId}
            type="text"
            placeholder="Contoh: Jatuh saat ditata, kadaluwarsa per tanggal..."
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
            disabled={submitting || availableProducts.length === 0}
            className="h-9 text-xs px-4 bg-[#D97757] hover:bg-[#c26243] text-white font-medium shadow-xs"
          >
            {submitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Catat Loss'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function LossDialog({ open, onClose, onSaved, initialData, products }: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto"
    >
      <LossFormContent
        key={initialData ? `loss-${initialData.id}` : 'loss-create'}
        initialData={initialData}
        products={products}
        onClose={onClose}
        onSaved={onSaved}
      />
    </div>
  );
}
