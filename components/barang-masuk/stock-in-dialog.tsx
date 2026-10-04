'use client';

import { useState, useId, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createStockIn,
  updateStockIn,
  type StockIn,
  type Product,
  type StockInLinePayload,
} from '@/lib/api';

interface LineFormState {
  productId: number;
  inputMode: 'pack' | 'pcs';
  qtyPack: string;
  qtyPcs: string;
  totalCost: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (stockIn: StockIn) => void;
  initialData?: StockIn | null;
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
  onSaved: (stockIn: StockIn) => void;
  initialData?: StockIn | null;
  products: Product[];
}

function StockInFormContent({
  onClose,
  onSaved,
  initialData,
  products,
}: FormContentProps) {
  const isEditing = Boolean(initialData);

  const [type, setType] = useState<'purchase' | 'consignment_in' | 'initial'>(
    initialData?.type ?? 'purchase'
  );
  const [date, setDate] = useState<string>(
    initialData?.date ?? getTodayJakarta()
  );
  const [note, setNote] = useState<string>(initialData?.note ?? '');

  // Filtered available products based on transaction type
  const availableProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive && !initialData) return false;
      if (type === 'purchase') return p.ownerType === 'own';
      if (type === 'consignment_in') return p.ownerType === 'consignor';
      return true; // initial allows all
    });
  }, [products, type, initialData]);

  // Initial line builder
  function buildDefaultLine(defaultProdId?: number): LineFormState {
    const prod = defaultProdId
      ? products.find((p) => p.id === defaultProdId)
      : availableProducts[0];
    const initialProdId = prod?.id ?? (products[0]?.id ?? 0);
    const hasPack = (prod?.pcsPerPack ?? 1) > 1;

    return {
      productId: initialProdId,
      inputMode: hasPack ? 'pack' : 'pcs',
      qtyPack: '1',
      qtyPcs: hasPack ? String(prod?.pcsPerPack ?? 1) : '1',
      totalCost: prod?.ownerType === 'own' ? '' : '0',
    };
  }

  const [lines, setLines] = useState<LineFormState[]>(() => {
    if (initialData?.lines && initialData.lines.length > 0) {
      return initialData.lines.map((l) => ({
        productId: l.productId,
        inputMode: l.inputMode,
        qtyPack: l.qtyPack ? String(l.qtyPack) : '1',
        qtyPcs: String(l.qtyPcs),
        totalCost: l.ownerType === 'own' ? l.totalCost.replace(/\.0000$/, '') : '0',
      }));
    }
    const firstProd = products.find((p) => (initialData ? true : p.ownerType === 'own'));
    const firstId = firstProd?.id ?? (products[0]?.id ?? 0);
    const hasPack = (firstProd?.pcsPerPack ?? 1) > 1;
    return [
      {
        productId: firstId,
        inputMode: hasPack ? 'pack' : 'pcs',
        qtyPack: '1',
        qtyPcs: hasPack ? String(firstProd?.pcsPerPack ?? 1) : '1',
        totalCost: firstProd?.ownerType === 'own' ? '' : '0',
      },
    ];
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dateId = useId();
  const noteId = useId();

  // When type changes, ensure line products conform to filter
  function handleTypeChange(newType: 'purchase' | 'consignment_in' | 'initial') {
    if (isEditing) return;
    setType(newType);

    const validProducts = products.filter((p) => {
      if (newType === 'purchase') return p.ownerType === 'own';
      if (newType === 'consignment_in') return p.ownerType === 'consignor';
      return true;
    });

    const firstValid = validProducts[0];
    setLines([
      {
        productId: firstValid?.id ?? 0,
        inputMode: (firstValid?.pcsPerPack ?? 1) > 1 ? 'pack' : 'pcs',
        qtyPack: '1',
        qtyPcs: (firstValid?.pcsPerPack ?? 1) > 1 ? String(firstValid?.pcsPerPack ?? 1) : '1',
        totalCost: firstValid?.ownerType === 'own' ? '' : '0',
      },
    ]);
  }

  function handleLineProductChange(index: number, newProductId: number) {
    const prod = products.find((p) => p.id === newProductId);
    const hasPack = (prod?.pcsPerPack ?? 1) > 1;

    setLines((prev) => {
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;
      next[index] = {
        ...target,
        productId: newProductId,
        inputMode: hasPack ? 'pack' : 'pcs',
        qtyPack: '1',
        qtyPcs: hasPack ? String(prod?.pcsPerPack ?? 1) : '1',
        totalCost: prod?.ownerType === 'own' ? (target.totalCost === '0' ? '' : target.totalCost) : '0',
      };
      return next;
    });
  }

  function handleLineInputModeChange(index: number, mode: 'pack' | 'pcs') {
    setLines((prev) => {
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;
      const prod = products.find((p) => p.id === target.productId);
      const packMultiplier = prod?.pcsPerPack ?? 1;

      if (mode === 'pack') {
        const pQty = parseInt(target.qtyPack, 10) || 1;
        next[index] = {
          ...target,
          inputMode: 'pack',
          qtyPcs: String(pQty * packMultiplier),
        };
      } else {
        next[index] = {
          ...target,
          inputMode: 'pcs',
        };
      }
      return next;
    });
  }

  function handleLineQtyPackChange(index: number, val: string) {
    setLines((prev) => {
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;
      const prod = products.find((p) => p.id === target.productId);
      const packMultiplier = prod?.pcsPerPack ?? 1;
      const parsed = parseInt(val, 10) || 0;

      next[index] = {
        ...target,
        qtyPack: val,
        qtyPcs: String(parsed * packMultiplier),
      };
      return next;
    });
  }

  function handleLineQtyPcsChange(index: number, val: string) {
    setLines((prev) => {
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;
      next[index] = {
        ...target,
        qtyPcs: val,
      };
      return next;
    });
  }

  function handleLineCostChange(index: number, val: string) {
    setLines((prev) => {
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;
      next[index] = {
        ...target,
        totalCost: val,
      };
      return next;
    });
  }

  function handleAddLine() {
    setLines((prev) => [...prev, buildDefaultLine()]);
  }

  function handleRemoveLine(index: number) {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  // Live Summary Calculation
  const totalSummary = useMemo(() => {
    let pcs = 0;
    let cost = 0;

    for (const line of lines) {
      const prod = products.find((p) => p.id === line.productId);
      const linePcs = parseInt(line.qtyPcs, 10) || 0;
      pcs += linePcs;

      if (prod?.ownerType === 'own') {
        const lineCost = parseFloat(line.totalCost) || 0;
        cost += lineCost;
      }
    }

    return { totalPcs: pcs, totalCost: cost };
  }, [lines, products]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!date) {
      setErrorMessage('Tanggal barang masuk wajib diisi.');
      return;
    }

    if (lines.length === 0) {
      setErrorMessage('Minimal satu baris produk wajib dimasukkan.');
      return;
    }

    const payloadLines: StockInLinePayload[] = [];

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]!;
      const prod = products.find((p) => p.id === l.productId);
      if (!prod) {
        setErrorMessage(`Baris ${i + 1}: Produk belum dipilih.`);
        return;
      }

      if (l.inputMode === 'pack') {
        const pQty = parseInt(l.qtyPack, 10);
        if (!Number.isInteger(pQty) || pQty < 1) {
          setErrorMessage(`Baris ${i + 1} (${prod.name}): Jumlah pack minimal 1.`);
          return;
        }
      } else {
        const pcsQty = parseInt(l.qtyPcs, 10);
        if (!Number.isInteger(pcsQty) || pcsQty < 1) {
          setErrorMessage(`Baris ${i + 1} (${prod.name}): Jumlah pcs minimal 1.`);
          return;
        }
      }

      let costStr = '0.0000';
      if (prod.ownerType === 'own') {
        const parsedCost = parseFloat(l.totalCost);
        if (isNaN(parsedCost) || parsedCost < 0) {
          setErrorMessage(`Baris ${i + 1} (${prod.name}): Biaya belanja harus diisi dan tidak boleh negatif.`);
          return;
        }
        costStr = parsedCost.toFixed(4);
      }

      payloadLines.push({
        productId: l.productId,
        inputMode: l.inputMode,
        qtyPack: l.inputMode === 'pack' ? parseInt(l.qtyPack, 10) : null,
        qtyPcs: l.inputMode === 'pcs' ? parseInt(l.qtyPcs, 10) : null,
        totalCost: costStr,
      });
    }

    setSubmitting(true);
    try {
      if (isEditing && initialData) {
        const res = await updateStockIn(initialData.id, {
          date,
          note: note.trim() || null,
          lines: payloadLines,
        });
        onSaved(res.data);
      } else {
        const res = await createStockIn({
          type,
          date,
          note: note.trim() || null,
          lines: payloadLines,
        });
        onSaved(res.data);
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Gagal menyimpan data barang masuk.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-2xl my-auto rounded-xl bg-white p-4 sm:p-6 shadow-xl border border-zinc-200 space-y-4 max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-base font-bold text-zinc-900">
          {isEditing ? 'Ubah Barang Masuk' : 'Catat Barang Masuk'}
        </h2>
        <p className="text-xs text-zinc-500">
          Pencatatan pasokan belanja own, setoran mitra titipan, atau stok awal toko.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* Transaction Type Segmented Toggle */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-zinc-700">
            Jenis Barang Masuk <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={isEditing}
              onClick={() => handleTypeChange('purchase')}
              className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition-colors ${
                type === 'purchase'
                  ? 'border-zinc-900 bg-zinc-900 text-white font-semibold'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              } disabled:opacity-60`}
            >
              Belanja Sendiri (Own)
            </button>
            <button
              type="button"
              disabled={isEditing}
              onClick={() => handleTypeChange('consignment_in')}
              className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition-colors ${
                type === 'consignment_in'
                  ? 'border-[#D97757] bg-[#D97757] text-white font-semibold'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              } disabled:opacity-60`}
            >
              Setoran Penitip
            </button>
            <button
              type="button"
              disabled={isEditing}
              onClick={() => handleTypeChange('initial')}
              className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition-colors ${
                type === 'initial'
                  ? 'border-sky-800 bg-sky-800 text-white font-semibold'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              } disabled:opacity-60`}
            >
              Stok Awal (Initial)
            </button>
          </div>
        </div>

        {/* Date & Note */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor={dateId} className="text-xs font-semibold text-zinc-700">
              Tanggal Masuk <span className="text-red-500">*</span>
            </Label>
            <Input
              id={dateId}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-xs font-mono"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={noteId} className="text-xs font-semibold text-zinc-700">
              Catatan Transaksi (Opsional)
            </Label>
            <Input
              id={noteId}
              type="text"
              placeholder="Contoh: Belanja di Agen Jaya, Setoran pagi Pak Sani"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* Multi-Item Line Editor */}
        <div className="space-y-2 pt-2 border-t border-zinc-100">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Daftar Barang ({lines.length} Item)
            </Label>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddLine}
              className="h-7 text-[11px] px-2 text-[#D97757] border-orange-200 hover:bg-orange-50"
            >
              + Tambah Item
            </Button>
          </div>

          {availableProducts.length === 0 ? (
            <div className="p-4 rounded-lg bg-amber-50 text-xs text-amber-800 border border-amber-200">
              Tidak ada produk yang sesuai dengan jenis transaksi ini. Pastikan Anda sudah membuat produk terkait di menu Master Produk.
            </div>
          ) : (
            <div className="space-y-3">
              {lines.map((line, idx) => {
                const prod = products.find((p) => p.id === line.productId);
                const isOwn = prod?.ownerType === 'own';
                const pcsPerPack = prod?.pcsPerPack ?? 1;
                const hasPackSupport = pcsPerPack > 1;

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/60 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold text-zinc-400">
                        #{idx + 1}
                      </span>
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-xs text-zinc-400 hover:text-red-600 transition-colors"
                          title="Hapus baris ini"
                        >
                          ✕ Hapus
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      {/* Product selection */}
                      <div className="sm:col-span-6 space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600">Produk</label>
                        <select
                          value={line.productId}
                          onChange={(e) => handleLineProductChange(idx, Number(e.target.value))}
                          className="w-full h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#D97757]"
                        >
                          {availableProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.ownerType === 'own' ? 'Own' : p.consignorName ?? 'Titipan'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Unit Mode & Quantity */}
                      <div className="sm:col-span-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-medium text-zinc-600">Kuantitas</label>
                          {hasPackSupport && (
                            <div className="flex items-center gap-1 text-[10px]">
                              <button
                                type="button"
                                onClick={() => handleLineInputModeChange(idx, 'pack')}
                                className={`px-1.5 py-0.5 rounded transition-colors ${
                                  line.inputMode === 'pack'
                                    ? 'bg-zinc-800 text-white font-bold'
                                    : 'text-zinc-500 hover:bg-zinc-200'
                                }`}
                              >
                                Pack
                              </button>
                              <button
                                type="button"
                                onClick={() => handleLineInputModeChange(idx, 'pcs')}
                                className={`px-1.5 py-0.5 rounded transition-colors ${
                                  line.inputMode === 'pcs'
                                    ? 'bg-zinc-800 text-white font-bold'
                                    : 'text-zinc-500 hover:bg-zinc-200'
                                }`}
                              >
                                Pcs
                              </button>
                            </div>
                          )}
                        </div>

                        {line.inputMode === 'pack' ? (
                          <div className="space-y-0.5">
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              inputMode="numeric"
                              value={line.qtyPack}
                              onChange={(e) => handleLineQtyPackChange(idx, e.target.value)}
                              placeholder="1"
                              className="h-8 text-xs font-mono"
                            />
                            <p className="text-[10px] text-zinc-500 font-mono">
                              × {pcsPerPack} = {line.qtyPcs} pcs
                            </p>
                          </div>
                        ) : (
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            inputMode="numeric"
                            value={line.qtyPcs}
                            onChange={(e) => handleLineQtyPcsChange(idx, e.target.value)}
                            placeholder="1"
                            className="h-8 text-xs font-mono"
                          />
                        )}
                      </div>

                      {/* Total Cost */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600">
                          {isOwn ? 'Total Biaya Belanja' : 'Biaya Modal'}
                        </label>
                        {isOwn ? (
                          <div className="space-y-0.5">
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-[11px] text-zinc-400 font-mono">
                                Rp
                              </span>
                              <Input
                                type="number"
                                min="0"
                                step="any"
                                inputMode="decimal"
                                value={line.totalCost}
                                onChange={(e) => handleLineCostChange(idx, e.target.value)}
                                placeholder="0"
                                className="h-8 text-xs font-mono pl-7"
                              />
                            </div>
                            {parseFloat(line.totalCost) > 0 && parseInt(line.qtyPcs, 10) > 0 && (
                              <p className="text-[10px] text-zinc-500 font-mono">
                                ~Rp {Math.round(parseFloat(line.totalCost) / parseInt(line.qtyPcs, 10)).toLocaleString('id-ID')}/pcs
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <Input
                              type="text"
                              disabled
                              value="Rp 0"
                              className="h-8 text-xs font-mono bg-zinc-100 text-zinc-500"
                            />
                            <p className="text-[10px] text-zinc-400">Modal titipan Rp 0</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Form Running Total Banner */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-900 text-white p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">
              Total Kuantitas Masuk
            </span>
            <span className="text-base font-bold font-mono text-zinc-100">
              {totalSummary.totalPcs} pcs
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">
              Total Modal Belanja (Own)
            </span>
            <span className="text-base font-bold font-mono text-[#D97757]">
              Rp {totalSummary.totalCost.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Actions */}
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
            type="submit"
            disabled={submitting || availableProducts.length === 0}
            className="h-8 text-xs px-4 bg-[#D97757] hover:bg-[#c26243] text-white font-medium shadow-xs"
          >
            {submitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Catat Barang Masuk'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function StockInDialog({
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto"
    >
      <StockInFormContent
        key={initialData ? `stockin-${initialData.id}` : 'stockin-create'}
        initialData={initialData}
        products={products}
        onClose={onClose}
        onSaved={onSaved}
      />
    </div>
  );
}
