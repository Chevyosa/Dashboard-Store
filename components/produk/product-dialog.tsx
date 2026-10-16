'use client';

import { useState, useEffect, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createProduct,
  updateProduct,
  getConsignors,
  previewProductMargin,
  type Product,
  type Consignor,
  type CreateProductPayload,
  type ProductMarginInfo,
} from '@/lib/api';
import { ProductMarginPreview } from './product-margin-preview';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (product: Product) => void;
  initialData?: Product | null;
}

interface FormContentProps {
  initialData?: Product | null;
  consignors: Consignor[];
  onClose: () => void;
  onSaved: (product: Product) => void;
}

function ProductFormContent({ initialData, consignors, onClose, onSaved }: FormContentProps) {
  const isEditing = Boolean(initialData);

  // Form State
  const [name, setName] = useState(initialData?.name ?? '');
  const [ownerType, setOwnerType] = useState<'own' | 'consignor'>(
    initialData?.ownerType ?? 'own'
  );
  const [consignorId, setConsignorId] = useState<number | null>(
    initialData?.consignorId ?? (consignors[0]?.id ?? null)
  );
  const [sellPrice, setSellPrice] = useState(initialData?.sellPrice ?? '');
  const [marginType, setMarginType] = useState<'nominal' | 'percent'>(
    initialData?.marginType ?? 'nominal'
  );
  const [marginValue, setMarginValue] = useState(initialData?.marginValue ?? '');

  // For consignment nominal convenience: Setor vs Jual input mode
  const [nominalMode, setNominalMode] = useState<'sell_and_margin' | 'setor_and_margin'>(
    'sell_and_margin'
  );
  const [setorPrice, setSetorPrice] = useState('');

  // Live preview & UI state
  const [marginPreview, setMarginPreview] = useState<ProductMarginInfo | null>(
    initialData?.marginInfo ?? null
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Unique IDs for accessibility
  const nameId = useId();
  const ownerTypeId = useId();
  const consignorSelectId = useId();
  const sellPriceId = useId();
  const setorPriceId = useId();
  const marginValId = useId();

  function handleSwitchOwnerType(newType: 'own' | 'consignor') {
    setOwnerType(newType);
    if (newType === 'consignor') {
      const targetId = consignorId ?? consignors[0]?.id ?? null;
      if (targetId) {
        setConsignorId(targetId);
        const found = consignors.find((c) => c.id === targetId);
        if (found && found.defaultMarginType && found.defaultMarginValue) {
          setMarginType(found.defaultMarginType);
          setMarginValue(found.defaultMarginValue);
        }
      }
    }
  }

  // Consignor selection change -> prefill default margin scheme if available
  function handleSelectConsignor(selectedId: number) {
    setConsignorId(selectedId);
    const found = consignors.find((c) => c.id === selectedId);
    if (found && found.defaultMarginType && found.defaultMarginValue) {
      setMarginType(found.defaultMarginType);
      setMarginValue(found.defaultMarginValue);
    }
  }

  // Update margin preview whenever relevant fields change
  useEffect(() => {
    let ignore = false;

    async function updatePreview() {
      if (ownerType === 'own') {
        setMarginPreview({
          ownerMarginPerPcs: null,
          ownerMarginPerPack: null,
          consignorSharePerPcs: null,
          consignorSharePerPack: null,
        });
        return;
      }

      if (ownerType === 'consignor') {
        const trimmedSell = sellPrice.trim();
        const trimmedMargin = marginValue.trim();

        if (!trimmedSell || !trimmedMargin) {
          setMarginPreview(null);
          return;
        }

        try {
          const res = await previewProductMargin({
            ownerType: 'consignor',
            pcsPerPack: 1,
            sellPrice: trimmedSell,
            marginType,
            marginValue: trimmedMargin,
          });
          if (!ignore) {
            setMarginPreview(res.data);
          }
        } catch {
          if (!ignore) {
            setMarginPreview(null);
          }
        }
      }
    }

    const timer = setTimeout(() => {
      void updatePreview();
    }, 150);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [ownerType, sellPrice, marginType, marginValue]);

  // Handle Setor price calculation for convenience mode
  function handleSetorChange(val: string) {
    setSetorPrice(val);
    const setorNum = parseFloat(val);
    const marginNum = parseFloat(marginValue);
    if (!isNaN(setorNum) && !isNaN(marginNum)) {
      setSellPrice(String(setorNum + marginNum));
    }
  }

  function handleNominalMarginChange(val: string) {
    setMarginValue(val);
    if (nominalMode === 'setor_and_margin') {
      const setorNum = parseFloat(setorPrice);
      const marginNum = parseFloat(val);
      if (!isNaN(setorNum) && !isNaN(marginNum)) {
        setSellPrice(String(setorNum + marginNum));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Nama produk wajib diisi.');
      return;
    }

    const trimmedSell = sellPrice.trim();
    if (!trimmedSell) {
      setErrorMessage('Harga jual wajib diisi.');
      return;
    }

    const sellNum = parseFloat(trimmedSell);
    if (isNaN(sellNum) || sellNum <= 0) {
      setErrorMessage('Harga jual harus lebih besar dari Rp 0.');
      return;
    }

    if (ownerType === 'consignor') {
      if (!consignorId) {
        setErrorMessage('Penitip wajib dipilih untuk produk titipan.');
        return;
      }

      const trimmedMargin = marginValue.trim();
      if (!trimmedMargin) {
        setErrorMessage('Nilai margin wajib diisi untuk produk titipan.');
        return;
      }

      const marginNum = parseFloat(trimmedMargin);
      if (marginType === 'nominal') {
        if (isNaN(marginNum) || marginNum < 0) {
          setErrorMessage('Margin nominal tidak boleh negatif.');
          return;
        }
        if (marginNum >= sellNum) {
          setErrorMessage('Margin nominal harus lebih kecil dari harga jual.');
          return;
        }
      } else if (marginType === 'percent') {
        if (isNaN(marginNum) || marginNum <= 0 || marginNum >= 100) {
          setErrorMessage('Persentase margin harus lebih besar dari 0% dan kurang dari 100%.');
          return;
        }
      }
    }

    const payload: CreateProductPayload = {
      name: trimmedName,
      ownerType,
      consignorId: ownerType === 'consignor' ? consignorId : null,
      pcsPerPack: 1,
      sellPrice: trimmedSell,
      marginType: ownerType === 'consignor' ? marginType : null,
      marginValue: ownerType === 'consignor' ? marginValue.trim() : null,
    };

    setLoading(true);
    try {
      if (isEditing && initialData) {
        const res = await updateProduct(initialData.id, payload);
        onSaved(res.data);
      } else {
        const res = await createProduct(payload);
        onSaved(res.data);
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Terjadi kesalahan saat menyimpan produk.');
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
            {isEditing ? 'Ubah Data Produk' : 'Tambah Produk Baru'}
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

      <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        {errorMessage && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Ownership Type Selection */}
        <div className="space-y-1.5">
          <Label id={ownerTypeId} className="text-xs font-semibold text-zinc-700">
            Jenis Kepemilikan <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby={ownerTypeId}>
            <button
              type="button"
              onClick={() => handleSwitchOwnerType('own')}
              className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-colors ${
                ownerType === 'own'
                  ? 'border-zinc-900 bg-zinc-900 text-white font-semibold'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              Milik Sendiri (Own)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchOwnerType('consignor')}
              className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-colors ${
                ownerType === 'consignor'
                  ? 'border-[#D97757] bg-[#D97757] text-white font-semibold'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              Titipan Konsinyasi
            </button>
          </div>
        </div>

        {/* Consignor Selection (if consignor) */}
        {ownerType === 'consignor' && (
          <div className="space-y-1.5 p-3 rounded-lg bg-orange-50/30 border border-orange-100">
            <Label htmlFor={consignorSelectId} className="text-xs font-semibold text-zinc-800">
              Pilih Penitip <span className="text-red-500">*</span>
            </Label>
            {consignors.length === 0 ? (
              <p className="text-xs text-red-600">
                Belum ada mitra penitip aktif. Silakan tambahkan penitip di menu Penitip terlebih dahulu.
              </p>
            ) : (
              <select
                id={consignorSelectId}
                value={consignorId ?? ''}
                onChange={(e) => handleSelectConsignor(Number(e.target.value))}
                className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#D97757]/40"
              >
                {consignors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.defaultMarginType ? `(Default: ${c.defaultMarginType})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Product Name */}
        <div className="space-y-1.5">
          <Label htmlFor={nameId} className="text-xs font-semibold text-zinc-700">
            Nama Produk <span className="text-red-500">*</span>
          </Label>
          <Input
            id={nameId}
            type="text"
            autoFocus
            placeholder="Contoh: Gery Salut Malkist, Risoles Mayo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        {/* Sell Price */}
        <div className="space-y-1.5">
          <Label htmlFor={sellPriceId} className="text-xs font-semibold text-zinc-700">
            Harga Jual per Pcs <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-mono text-zinc-400">Rp</span>
            <Input
              id={sellPriceId}
              type="text"
              placeholder="1500"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              className="h-9 pl-9 text-xs font-mono"
            />
          </div>
          <p className="text-[10px] text-zinc-400">Harga eceran jual ke pembeli (per bungkus / pcs).</p>
        </div>

        {/* Margin Scheme Settings for Consignment */}
        {ownerType === 'consignor' && (
          <div className="space-y-3 pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-zinc-800">
                Skema Margin Penitip <span className="text-red-500">*</span>
              </Label>
              <span className="text-[10px] text-zinc-400">Bagian keuntungan pemilik</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMarginType('nominal')}
                className={`py-1.5 px-2 rounded-md text-xs font-medium border text-center transition-colors ${
                  marginType === 'nominal'
                    ? 'border-[#D97757] bg-orange-50 text-[#D97757] font-semibold'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                Nominal (Rupiah/pcs)
              </button>
              <button
                type="button"
                onClick={() => setMarginType('percent')}
                className={`py-1.5 px-2 rounded-md text-xs font-medium border text-center transition-colors ${
                  marginType === 'percent'
                    ? 'border-[#D97757] bg-orange-50 text-[#D97757] font-semibold'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                Persentase (%)
              </button>
            </div>

            {marginType === 'nominal' && (
              <div className="space-y-3">
                {/* Convenience Mode toggle */}
                <div className="flex items-center gap-4 text-[11px] text-zinc-500 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="nominalMode"
                      checked={nominalMode === 'sell_and_margin'}
                      onChange={() => setNominalMode('sell_and_margin')}
                    />
                    <span>Input Harga Jual + Margin</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="nominalMode"
                      checked={nominalMode === 'setor_and_margin'}
                      onChange={() => setNominalMode('setor_and_margin')}
                    />
                    <span>Input Harga Setor + Margin</span>
                  </label>
                </div>

                {nominalMode === 'setor_and_margin' && (
                  <div className="space-y-1">
                    <Label htmlFor={setorPriceId} className="text-[11px] text-zinc-600">
                      Harga Setor Penitip per Pcs
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-mono text-zinc-400">Rp</span>
                      <Input
                        id={setorPriceId}
                        type="text"
                        placeholder="Contoh: 6000"
                        value={setorPrice}
                        onChange={(e) => handleSetorChange(e.target.value)}
                        className="h-8 pl-9 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor={marginValId} className="text-[11px] text-zinc-600">
                    Margin Pemilik per Pcs (Rupiah)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono text-zinc-400">Rp</span>
                    <Input
                      id={marginValId}
                      type="text"
                      placeholder="1000"
                      value={marginValue}
                      onChange={(e) => handleNominalMarginChange(e.target.value)}
                      className="h-8 pl-9 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {marginType === 'percent' && (
              <div className="space-y-1">
                <Label htmlFor={marginValId} className="text-[11px] text-zinc-600">
                  Persentase Margin Pemilik (%)
                </Label>
                <div className="relative">
                  <Input
                    id={marginValId}
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
        )}

        {/* Real-time Margin Breakdown Preview */}
        <div className="pt-2">
          <Label className="text-[11px] font-semibold text-zinc-700 block mb-1.5">
            Ringkasan Keuntungan & Hak Penitip:
          </Label>
          <ProductMarginPreview
            ownerType={ownerType}
            pcsPerPack={1}
            marginInfo={marginPreview}
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100">
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
            type="submit"
            size="sm"
            disabled={loading}
            className="bg-[#D97757] hover:bg-[#c26243] text-white text-xs font-medium"
          >
            {loading ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah Produk'}
          </Button>
        </div>
      </form>
    </>
  );
}

export function ProductDialog({ open, onClose, onSaved, initialData }: Props) {
  const [consignors, setConsignors] = useState<Consignor[]>([]);

  useEffect(() => {
    let ignore = false;
    async function fetchConsignors() {
      try {
        const res = await getConsignors({ status: 'active', limit: 100 });
        if (!ignore) {
          setConsignors(res.data);
        }
      } catch {
        // silent fallback
      }
    }

    if (open) {
      void fetchConsignors();
    }

    return () => {
      ignore = true;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        key={initialData ? `edit-${initialData.id}` : 'create'}
        className="w-full max-w-md rounded-xl bg-white border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <ProductFormContent
          initialData={initialData}
          consignors={consignors}
          onClose={onClose}
          onSaved={onSaved}
        />
      </div>
    </div>
  );
}
