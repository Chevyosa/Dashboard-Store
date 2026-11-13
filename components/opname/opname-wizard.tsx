'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  calculateOpname,
  finalizeOpname,
  prepareOpname,
  saveDraftOpname,
  type CalculateOpnameResponse,
  type OpnameRecord,
  type PreparedSheetProduct,
} from '@/lib/api';
import { formatDateIndo, formatRupiah } from '@/lib/format';

interface Props {
  initialDate?: string;
  onSuccess: (opname: OpnameRecord) => void;
  onCancel: () => void;
}

function getTodayJakarta(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0] ?? '';
  }
}

export function OpnameWizard({ initialDate, onSuccess, onCancel }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialDate ? 2 : 1);
  const [opnameDate, setOpnameDate] = useState<string>(initialDate || getTodayJakarta());
  const [note, setNote] = useState<string>('');
  const [cashAmount, setCashAmount] = useState<string>('0');
  const [qrisAmount, setQrisAmount] = useState<string>('0');

  const [loadingSheet, setLoadingSheet] = useState(false);
  const [sheetProducts, setSheetProducts] = useState<PreparedSheetProduct[]>([]);
  const [physicalCounts, setPhysicalCounts] = useState<Record<number, number>>({});

  // Calculation result on step 4
  const [calcResult, setCalcResult] = useState<CalculateOpnameResponse['data'] | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search filter in step 2
  const [searchFilter, setSearchFilter] = useState('');

  const noteId = useId();
  const cashInputId = useId();
  const qrisInputId = useId();

  // Load sheet for the date
  async function loadSheet(dateToLoad: string) {
    try {
      setLoadingSheet(true);
      setErrorMessage(null);
      const res = await prepareOpname(dateToLoad);
      const prods = res.data.products;
      setSheetProducts(prods);

      if (res.data.existingOpname) {
        if (res.data.existingOpname.note) setNote(res.data.existingOpname.note);
        if (res.data.existingOpname.cashAmount) {
          setCashAmount(String(parseInt(res.data.existingOpname.cashAmount, 10) || 0));
        }
        if (res.data.existingOpname.qrisAmount) {
          setQrisAmount(String(parseInt(res.data.existingOpname.qrisAmount, 10) || 0));
        }
      }

      // Initialize counts: if draft exists use draftPhysicalQty, else default to expectedQty
      const initialCounts: Record<number, number> = {};
      for (const p of prods) {
        if (p.draftPhysicalQty !== null && p.draftPhysicalQty !== undefined) {
          initialCounts[p.productId] = p.draftPhysicalQty;
        } else {
          initialCounts[p.productId] = p.expectedQty;
        }
      }
      setPhysicalCounts(initialCounts);
      setStep(2);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal menyiapkan lembar opname.',
      );
    } finally {
      setLoadingSheet(false);
    }
  }

  // Auto-load if initialDate provided
  useEffect(() => {
    if (!initialDate) return;

    let ignore = false;
    async function fetchInitialSheet() {
      try {
        const res = await prepareOpname(initialDate!);
        if (!ignore) {
          const prods = res.data.products;
          setSheetProducts(prods);

          if (res.data.existingOpname) {
            if (res.data.existingOpname.note) setNote(res.data.existingOpname.note);
            if (res.data.existingOpname.cashAmount) {
              setCashAmount(String(parseInt(res.data.existingOpname.cashAmount, 10) || 0));
            }
            if (res.data.existingOpname.qrisAmount) {
              setQrisAmount(String(parseInt(res.data.existingOpname.qrisAmount, 10) || 0));
            }
          }

          const initialCounts: Record<number, number> = {};
          for (const p of prods) {
            if (p.draftPhysicalQty !== null && p.draftPhysicalQty !== undefined) {
              initialCounts[p.productId] = p.draftPhysicalQty;
            } else {
              initialCounts[p.productId] = p.expectedQty;
            }
          }
          setPhysicalCounts(initialCounts);
          setStep(2);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Gagal menyiapkan lembar opname.',
          );
        }
      }
    }

    void fetchInitialSheet();
    return () => {
      ignore = true;
    };
  }, [initialDate]);

  // Handle counter adjustments
  function setQuantity(productId: number, val: number) {
    setPhysicalCounts((prev) => ({
      ...prev,
      [productId]: Math.max(0, Math.floor(val)),
    }));
  }

  function handleQuickSetSame(productId: number, expectedQty: number) {
    setQuantity(productId, expectedQty);
  }

  function handleSetAllSame() {
    const updated: Record<number, number> = {};
    for (const p of sheetProducts) {
      updated[p.productId] = p.expectedQty;
    }
    setPhysicalCounts(updated);
  }

  // Filter products for Step 2
  const filteredProducts = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return sheetProducts;
    return sheetProducts.filter(
      (p) =>
        p.productName.toLowerCase().includes(q) ||
        (p.consignorName && p.consignorName.toLowerCase().includes(q)),
    );
  }, [sheetProducts, searchFilter]);

  // Validation checks
  const negativeDiffProducts = useMemo(() => {
    return sheetProducts.filter((p) => {
      const physical = physicalCounts[p.productId] ?? 0;
      return physical > p.expectedQty;
    });
  }, [sheetProducts, physicalCounts]);

  const lossExceedsDiffProducts = useMemo(() => {
    return sheetProducts.filter((p) => {
      const physical = physicalCounts[p.productId] ?? 0;
      const diff = p.expectedQty - physical;
      return p.lossQty > diff && diff >= 0;
    });
  }, [sheetProducts, physicalCounts]);

  // Products with diff > 0 for Step 3 review
  const diffProducts = useMemo(() => {
    return sheetProducts.filter((p) => {
      const physical = physicalCounts[p.productId] ?? 0;
      return p.expectedQty - physical > 0 || p.lossQty > 0;
    });
  }, [sheetProducts, physicalCounts]);

  const { realCash, cashDiff } = useMemo(() => {
    const numCash = parseFloat(cashAmount) || 0;
    const numQris = parseFloat(qrisAmount) || 0;
    const r = numCash + numQris;
    const t = calcResult ? parseFloat(calcResult.totals.totalTurnover) || 0 : 0;
    return { realCash: r, cashDiff: r - t };
  }, [cashAmount, qrisAmount, calcResult]);

  // Proceed to Step 4 with server calculation
  async function proceedToStep4() {
    try {
      setCalculating(true);
      setErrorMessage(null);

      const items = sheetProducts.map((p) => ({
        productId: p.productId,
        physicalQty: physicalCounts[p.productId] ?? 0,
      }));

      const res = await calculateOpname({
        opnameDate,
        items,
        cashAmount: cashAmount.trim() || '0',
        qrisAmount: qrisAmount.trim() || '0',
      });

      setCalcResult(res.data);
      setStep(4);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal menghitung hasil opname.',
      );
    } finally {
      setCalculating(false);
    }
  }

  // Recalculate reconciliation on Step 4 when cash or qris changes
  useEffect(() => {
    if (step !== 4) return;
    const timer = setTimeout(async () => {
      try {
        const items = sheetProducts.map((p) => ({
          productId: p.productId,
          physicalQty: physicalCounts[p.productId] ?? 0,
        }));

        const res = await calculateOpname({
          opnameDate,
          items,
          cashAmount: cashAmount.trim() || '0',
          qrisAmount: qrisAmount.trim() || '0',
        });

        setCalcResult(res.data);
      } catch {
        // silent fail during typing
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [step, cashAmount, qrisAmount, opnameDate, sheetProducts, physicalCounts]);

  // Save Draft
  async function handleSaveDraft() {
    try {
      setSubmitting(true);
      setErrorMessage(null);

      const items = sheetProducts.map((p) => ({
        productId: p.productId,
        physicalQty: physicalCounts[p.productId] ?? 0,
      }));

      const res = await saveDraftOpname({
        opnameDate,
        note: note.trim() || null,
        items,
        cashAmount: cashAmount.trim() || '0',
        qrisAmount: qrisAmount.trim() || '0',
      });

      onSuccess(res.data);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal menyimpan draf opname.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Finalize
  async function handleFinalize() {
    try {
      setSubmitting(true);
      setErrorMessage(null);

      const items = sheetProducts.map((p) => ({
        productId: p.productId,
        physicalQty: physicalCounts[p.productId] ?? 0,
      }));

      const res = await finalizeOpname({
        opnameDate,
        note: note.trim() || null,
        items,
        cashAmount: cashAmount.trim() || '0',
        qrisAmount: qrisAmount.trim() || '0',
      });

      onSuccess(res.data);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal memfinalisasi opname.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-xs space-y-6">
      {/* Wizard Progress Stepper */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <div>
          <span className="text-[11px] font-semibold text-[#D97757] uppercase tracking-wider">
            Langkah {step} dari 4
          </span>
          <h2 className="text-base font-bold text-zinc-900 mt-0.5">
            {step === 1 && 'Pilih Tanggal Opname'}
            {step === 2 && 'Hitung Stok Fisik (Counter)'}
            {step === 3 && 'Review Selisih & Alokasi Loss'}
            {step === 4 && 'Ringkasan & Finalisasi Periode'}
          </h2>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-xs text-zinc-500 hover:text-zinc-900"
        >
          Batalkan
        </Button>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      {/* STEP 1: Date & Preparation */}
      {step === 1 && (
        <div className="space-y-4 max-w-md">
          <p className="text-xs text-zinc-600">
            Pilih tanggal akhir periode opname (biasanya hari Jumat). Sistem akan
            mengumpulkan semua mutasi barang masuk, retur, dan loss yang terjadi pada periode ini.
          </p>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-700">Tanggal Opname</Label>
            <Input
              type="date"
              value={opnameDate}
              onChange={(e) => setOpnameDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="pt-2">
            <Button
              type="button"
              disabled={loadingSheet || !opnameDate}
              onClick={() => void loadSheet(opnameDate)}
              className="h-9 px-4 text-xs font-medium bg-[#D97757] hover:bg-[#c26243] text-white"
            >
              {loadingSheet ? 'Menyiapkan Lembar...' : 'Mulai Penghitungan Fisik →'}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Fast Counter */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Top Actions & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/80 p-3 rounded-xl border border-zinc-200">
            <div className="relative flex-1 max-w-sm">
              <Input
                type="text"
                placeholder="Cari produk yang sedang dihitung..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="h-8 text-xs bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSetAllSame}
                className="h-8 text-xs font-medium bg-white hover:bg-zinc-100"
              >
                Samakan Semua Fisik = Stok Teoritis
              </Button>
            </div>
          </div>

          {/* Validation Warnings if any */}
          {negativeDiffProducts.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <span className="font-bold">Peringatan:</span> Ada {negativeDiffProducts.length} produk
              yang stok fisiknya melebihi stok teoritis (mis. {negativeDiffProducts[0]?.productName}).
              Harap periksa kembali barang masuk yang belum tercatat.
            </div>
          )}

          {/* Products Counter List */}
          <div className="space-y-2.5 max-h-[58vh] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const currentPhysical = physicalCounts[p.productId] ?? 0;
              const diff = p.expectedQty - currentPhysical;
              const isInvalidNegativeDiff = currentPhysical > p.expectedQty;

              return (
                <div
                  key={p.productId}
                  className={`p-3 rounded-xl border transition-all ${
                    isInvalidNegativeDiff
                      ? 'border-red-300 bg-red-50/40'
                      : diff !== 0
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-zinc-200 bg-white'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Product Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 text-sm">
                          {p.productName}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">
                          {p.ownerType === 'own' ? 'Own' : `Titipan: ${p.consignorName ?? 'Mitra'}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                        <span>Teoritis: <strong className="text-zinc-800">{p.expectedQty} pcs</strong></span>
                        <span className="text-zinc-300">•</span>
                        <span>Harga: {formatRupiah(p.sellPrice)}</span>
                      </div>
                    </div>

                    {/* Counter Controls */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickSetSame(p.productId, p.expectedQty)}
                        className="h-8 text-[11px] px-2 text-zinc-600 bg-zinc-50 hover:bg-zinc-100"
                      >
                        Samakan
                      </Button>

                      <div className="flex items-center rounded-lg border border-zinc-200 bg-white shadow-xs">
                        <button
                          type="button"
                          onClick={() => setQuantity(p.productId, currentPhysical - 1)}
                          className="size-10 sm:size-8 flex items-center justify-center text-base sm:text-sm font-bold text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200 rounded-l-lg transition-colors"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={currentPhysical}
                          onChange={(e) => setQuantity(p.productId, Number(e.target.value))}
                          className="w-14 h-10 sm:h-8 text-center font-mono font-bold text-sm text-zinc-900 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setQuantity(p.productId, currentPhysical + 1)}
                          className="size-10 sm:size-8 flex items-center justify-center text-base sm:text-sm font-bold text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200 rounded-r-lg transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Diff Pill */}
                      <div className="w-24 text-right">
                        {isInvalidNegativeDiff ? (
                          <span className="inline-block text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                            +{currentPhysical - p.expectedQty} lebih
                          </span>
                        ) : diff > 0 ? (
                          <span className="inline-block text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            −{diff} pcs
                          </span>
                        ) : (
                          <span className="inline-block text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            Pas (0)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              className="text-xs"
            >
              ← Kembali ke Tanggal
            </Button>

            <Button
              type="button"
              disabled={negativeDiffProducts.length > 0}
              onClick={() => setStep(3)}
              className="h-9 px-4 text-xs font-medium bg-[#D97757] hover:bg-[#c26243] text-white disabled:opacity-50"
            >
              Lanjut ke Review Selisih →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Diff Review & Loss Allocation */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-xs text-zinc-600">
            Periksa selisih fisik yang berkurang. Selisih dikurangi loss yang telah dicatat akan
            otomatis dianggap sebagai barang terjual.
          </p>

          {lossExceedsDiffProducts.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <span className="font-bold">Error Aturan Bisnis (§5.5):</span> Ada produk dengan
              total loss melebihi selisih stok (mis. {lossExceedsDiffProducts[0]?.productName}).
              Jumlah terjual tidak boleh negatif.
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden sm:block rounded-xl border border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Produk</th>
                    <th className="py-2.5 px-2 text-right">Teoritis</th>
                    <th className="py-2.5 px-2 text-right">Fisik</th>
                    <th className="py-2.5 px-2 text-right">Selisih</th>
                    <th className="py-2.5 px-2 text-right">Loss Tercatat</th>
                    <th className="py-2.5 px-3 text-right font-bold text-zinc-900">Otomatis Terjual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {diffProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-zinc-400">
                        Semua stok fisik sama persis dengan stok teoritis (tidak ada selisih).
                      </td>
                    </tr>
                  ) : (
                    diffProducts.map((p) => {
                      const physical = physicalCounts[p.productId] ?? 0;
                      const diff = p.expectedQty - physical;
                      const sold = diff - p.lossQty;
                      const isError = sold < 0;

                      return (
                        <tr key={p.productId} className={isError ? 'bg-red-50/50' : ''}>
                          <td className="py-2.5 px-3 font-medium text-zinc-900">
                            {p.productName}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-zinc-600">
                            {p.expectedQty}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-zinc-900 font-semibold">
                            {physical}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-semibold text-amber-800">
                            {diff} pcs
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-zinc-600">
                            {p.lossQty > 0 ? `${p.lossQty} pcs` : '0'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">
                            {isError ? (
                              <span className="text-red-600 font-bold">{sold} (Error)</span>
                            ) : (
                              `${sold} pcs`
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View */}
          <div className="sm:hidden space-y-2.5">
            {diffProducts.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-xs text-zinc-500">
                Semua stok fisik sama persis dengan stok teoritis (tidak ada selisih).
              </div>
            ) : (
              diffProducts.map((p) => {
                const physical = physicalCounts[p.productId] ?? 0;
                const diff = p.expectedQty - physical;
                const sold = diff - p.lossQty;
                const isError = sold < 0;

                return (
                  <div
                    key={p.productId}
                    className={`p-3.5 rounded-xl border space-y-2 ${
                      isError ? 'border-red-300 bg-red-50/50' : 'border-zinc-200 bg-white shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-zinc-900">{p.productName}</span>
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                          isError ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-900'
                        }`}
                      >
                        {isError ? `${sold} (Error)` : `${sold} pcs terjual`}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-[11px] bg-zinc-50 p-2 rounded-lg text-center">
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Teoritis</span>
                        <span className="font-mono font-medium text-zinc-700">{p.expectedQty}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Fisik</span>
                        <span className="font-mono font-bold text-zinc-900">{physical}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Selisih</span>
                        <span className="font-mono font-semibold text-amber-800">−{diff}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Loss</span>
                        <span className="font-mono text-zinc-600">{p.lossQty}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(2)}
              className="text-xs"
            >
              ← Kembali ke Hitung Fisik
            </Button>

            <Button
              type="button"
              disabled={calculating || lossExceedsDiffProducts.length > 0}
              onClick={() => void proceedToStep4()}
              className="h-9 px-4 text-xs font-medium bg-[#D97757] hover:bg-[#c26243] text-white disabled:opacity-50"
            >
              {calculating ? 'Memverifikasi Angka...' : 'Lanjut ke Ringkasan Akhir →'}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Summary & Confirmation */}
      {step === 4 && calcResult && (
        <div className="space-y-4">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Total Omset (T)
              </span>
              <span className="font-mono text-base font-bold text-zinc-900 mt-1 block">
                {formatRupiah(calcResult.totals.totalTurnover)}
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                {calcResult.totals.totalSoldQty} pcs terjual
              </span>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Modal Own (COGS)
              </span>
              <span className="font-mono text-base font-bold text-zinc-900 mt-1 block">
                {formatRupiah(calcResult.totals.totalCogs)}
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                Harga pokok penjualan
              </span>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3">
              <span className="text-[10px] font-semibold text-orange-700 uppercase tracking-wider block">
                Hak Penitip (Payout)
              </span>
              <span className="font-mono text-base font-bold text-orange-950 mt-1 block">
                {formatRupiah(calcResult.totals.totalPayoutDue)}
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                Kewajiban bayar mitra
              </span>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Total Loss
              </span>
              <span className="font-mono text-base font-bold text-zinc-900 mt-1 block">
                {calcResult.totals.totalLossQty} pcs
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                Barang berkurang non-jual
              </span>
            </div>
          </div>

          {/* Uang Kas Masuk & Rekonsiliasi Riil */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                  <span>💵</span> Input Uang Masuk Mingguan (Kas Riil)
                </h3>
                <p className="text-xs text-zinc-500">
                  Catat uang fisik yang terkumpul di kasir dan pembayaran digital minggu ini.
                </p>
              </div>
              <div className="text-xs font-mono text-zinc-600 bg-zinc-50 px-2.5 py-1 rounded-md border border-zinc-200 self-start sm:self-auto">
                Omset Sistem (T): <strong className="text-zinc-900">{formatRupiah(calcResult.totals.totalTurnover)}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={cashInputId} className="text-xs font-semibold text-zinc-700">
                  Uang Tunai Fisik (Cash Kasir)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-semibold text-zinc-400">Rp</span>
                  <Input
                    id={cashInputId}
                    type="number"
                    min="0"
                    step="any"
                    inputMode="numeric"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="pl-9 h-9 text-xs font-mono font-medium"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={qrisInputId} className="text-xs font-semibold text-zinc-700">
                  Non-Tunai (QRIS / Transfer Bank)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-semibold text-zinc-400">Rp</span>
                  <Input
                    id={qrisInputId}
                    type="number"
                    min="0"
                    step="any"
                    inputMode="numeric"
                    value={qrisAmount}
                    onChange={(e) => setQrisAmount(e.target.value)}
                    className="pl-9 h-9 text-xs font-mono font-medium"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Selisih & Status Kas Riil Banner */}
            <div
              className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                cashDiff === 0
                  ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
                  : cashDiff < 0
                  ? 'border-red-200 bg-red-50/60 text-red-900'
                  : 'border-blue-200 bg-blue-50/60 text-blue-900'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">
                    {cashDiff === 0
                      ? '✅ Uang Kas Pas (Cocok dengan Omset)'
                      : cashDiff < 0
                      ? '⚠️ Kasir Minus / Kurang Setor'
                      : 'ℹ️ Kelebihan Uang Riil'}
                  </span>
                  <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/90 border border-current">
                    Selisih: {cashDiff >= 0 ? `+${formatRupiah(cashDiff.toFixed(4))}` : `-${formatRupiah(Math.abs(cashDiff).toFixed(4))}`}
                  </span>
                </div>
                <p className="text-[11px] opacity-85 leading-relaxed">
                  {cashDiff === 0
                    ? 'Total kas riil masuk sama persis dengan kalkulasi omset barang terjual.'
                    : cashDiff < 0
                    ? 'Uang fisik di kasir lebih sedikit dari omset barang keluar. Cek apakah ada barang belum terdata, salah hitung fisik, atau kehilangan uang.'
                    : 'Uang fisik di kasir lebih banyak dari omset barang keluar. Kemungkinan ada uang modal tercampur atau pembeli tidak mengambil kembalian.'}
                </p>
              </div>

              <div className="text-left sm:text-right w-full sm:w-auto shrink-0 font-mono pt-2 sm:pt-0 border-t sm:border-t-0 border-current/20">
                <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                  Total Uang Riil (R)
                </span>
                <span className="text-sm font-bold text-zinc-900">{formatRupiah(realCash.toFixed(4))}</span>
              </div>
            </div>

            {/* Dual Profit Snapshot if calcResult has reconciliation */}
            {calcResult.reconciliation && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-zinc-100">
                <div className="rounded-lg bg-zinc-50 p-2.5 border border-zinc-200">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase block">
                    Profit A (Basis Barang / Akrual)
                  </span>
                  <span className="font-mono text-xs font-bold text-zinc-900">
                    {formatRupiah(calcResult.reconciliation.profitA)}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    Margin kotor penjualan own + fee titipan - rugi barang
                  </span>
                </div>
                <div className="rounded-lg bg-zinc-50 p-2.5 border border-zinc-200">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase block">
                    Profit B (Basis Kas Riil)
                  </span>
                  <span className="font-mono text-xs font-bold text-zinc-900">
                    {formatRupiah(calcResult.reconciliation.profitB)}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    Kas riil (R) - kewajiban mitra penitip - modal belanja
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Consignor Payout Breakdown if any */}
          {calcResult.calculatedPayouts.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-700 block">
                Rincian Kewajiban Mitra Penitip:
              </span>
              <div className="rounded-lg border border-zinc-200 divide-y divide-zinc-100 overflow-hidden text-xs">
                {calcResult.calculatedPayouts.map((p) => {
                  const consignorProduct = sheetProducts.find(
                    (sp) => sp.consignorId === p.consignorId,
                  );
                  return (
                    <div
                      key={p.consignorId}
                      className="p-2.5 flex items-center justify-between bg-white"
                    >
                      <span className="font-medium text-zinc-900">
                        {consignorProduct?.consignorName || `Penitip #${p.consignorId}`}
                      </span>
                      <div className="flex items-center gap-4 text-right font-mono">
                        <span className="text-zinc-500">
                          Jual: {formatRupiah(p.soldShare)}
                        </span>
                        {p.lossCompensation !== '0.0000' && (
                          <span className="text-amber-800">
                            Ganti rugi: {formatRupiah(p.lossCompensation)}
                          </span>
                        )}
                        <span className="font-bold text-orange-950">
                          Total: {formatRupiah(p.payoutDue)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Note Input */}
          <div className="space-y-1.5 pt-2">
            <Label htmlFor={noteId} className="text-xs font-semibold text-zinc-700">
              Catatan Penutupan Periode (Opsional)
            </Label>
            <Input
              id={noteId}
              type="text"
              placeholder="Contoh: Opname rutin Jumat ke-1 Oktober..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Informational notice */}
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900 leading-relaxed">
            <span className="font-bold">Informasi:</span> Memfinalisasi opname akan membekukan snapshot
            harga dan stok, serta otomatis menautkan semua barang masuk, retur, dan loss terbuka hingga
            tanggal <strong>{formatDateIndo(opnameDate)}</strong>. Anda tetap dapat menyimpan sebagai draf
            jika belum ingin menutup periode.
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(3)}
              className="text-xs w-full sm:w-auto h-9"
            >
              Kembali ke Review
            </Button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => void handleSaveDraft()}
                className="h-9 text-xs px-3 font-semibold border-amber-300 text-amber-800 hover:bg-amber-50 w-full sm:w-auto"
              >
                {submitting ? 'Menyimpan...' : 'Simpan sebagai Draf'}
              </Button>

              <Button
                type="button"
                disabled={submitting}
                onClick={() => void handleFinalize()}
                className="h-9 px-4 text-xs font-bold bg-[#D97757] hover:bg-[#c26243] text-white shadow-xs w-full sm:w-auto"
              >
                {submitting ? 'Memproses...' : 'Finalisasi & Tutup Periode'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
