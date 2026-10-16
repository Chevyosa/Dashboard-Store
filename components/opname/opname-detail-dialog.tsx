'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getOpname, type OpnameRecord } from '@/lib/api';
import { formatDateIndo, formatRupiah } from '@/lib/format';
import { OpnameStatusBadge } from './opname-status-badge';

interface Props {
  opnameId: number | null;
  onClose: () => void;
}

export function OpnameDetailDialog({ opnameId, onClose }: Props) {
  const [opname, setOpname] = useState<OpnameRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'payouts'>('products');

  useEffect(() => {
    if (!opnameId) return;

    let ignore = false;
    async function fetchDetail() {
      try {
        setLoading(true);
        setErrorMessage(null);
        const res = await getOpname(opnameId!);
        if (!ignore) {
          setOpname(res.data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Gagal memuat rincian opname.',
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void fetchDetail();
    return () => {
      ignore = true;
    };
  }, [opnameId]);

  if (!opnameId) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto"
    >
      <div className="w-full max-w-4xl my-auto rounded-xl bg-white p-4 sm:p-6 shadow-xl border border-zinc-200 space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900">
                Rincian Opname #{opnameId}
              </h2>
              {opname && <OpnameStatusBadge status={opname.status} />}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Tanggal Operasional: {opname ? formatDateIndo(opname.opnameDate) : '...'}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-8 text-xs self-start sm:self-auto"
          >
            Tutup
          </Button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            Memuat rincian data opname...
          </div>
        ) : errorMessage ? (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700">
            {errorMessage}
          </div>
        ) : opname ? (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Total Omset (T)
                </span>
                <span className="font-mono text-base font-bold text-zinc-900 mt-1 block">
                  {formatRupiah(opname.totalTurnover)}
                </span>
                <span className="text-[10px] text-zinc-400 mt-0.5 block">
                  {opname.totalSoldQty} pcs terjual
                </span>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Modal Own (COGS)
                </span>
                <span className="font-mono text-base font-bold text-zinc-900 mt-1 block">
                  {formatRupiah(opname.totalCogs)}
                </span>
                <span className="text-[10px] text-zinc-400 mt-0.5 block">
                  Weighted avg cost
                </span>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3">
                <span className="text-[10px] font-semibold text-orange-700 uppercase tracking-wider block">
                  Hak Penitip (Payout)
                </span>
                <span className="font-mono text-base font-bold text-orange-950 mt-1 block">
                  {formatRupiah(opname.totalPayoutDue)}
                </span>
                <span className="text-[10px] text-zinc-400 mt-0.5 block">
                  Terjual & ganti rugi
                </span>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Total Loss
                </span>
                <span className="font-mono text-base font-bold text-zinc-900 mt-1 block">
                  {opname.totalLossQty} pcs
                </span>
                <span className="text-[10px] text-zinc-400 mt-0.5 block">
                  Rusak / kadaluwarsa
                </span>
              </div>
            </div>

            {/* Rekonsiliasi Kas & Profit Permanen */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2">
                <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <span>💵</span> Rekonsiliasi Kas Masuk Mingguan
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  Status Kasir:{' '}
                  <strong
                    className={
                      Number(opname.cashDifference) === 0
                        ? 'text-emerald-700'
                        : Number(opname.cashDifference) < 0
                        ? 'text-red-700'
                        : 'text-blue-700'
                    }
                  >
                    {Number(opname.cashDifference) === 0
                      ? 'Cocok / Pas (Rp 0)'
                      : Number(opname.cashDifference) < 0
                      ? `Minus ${formatRupiah(String(Math.abs(Number(opname.cashDifference))))}`
                      : `Lebih +${formatRupiah(String(Number(opname.cashDifference)))}`}
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-zinc-200/70">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Uang Tunai (Cash)</span>
                  <span className="font-mono font-bold text-zinc-900 mt-0.5 block">{formatRupiah(opname.cashAmount)}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-zinc-200/70">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Uang QRIS / Transfer</span>
                  <span className="font-mono font-bold text-zinc-900 mt-0.5 block">{formatRupiah(opname.qrisAmount)}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-zinc-200/70">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Total Uang Riil (R)</span>
                  <span className="font-mono font-bold text-zinc-900 mt-0.5 block">{formatRupiah(opname.realCash)}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-zinc-200/70">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Omset Teoritis (T)</span>
                  <span className="font-mono font-bold text-zinc-900 mt-0.5 block">{formatRupiah(opname.totalTurnover)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-zinc-200/60 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-zinc-200/70">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Profit A (Basis Barang / Akrual)</span>
                  <span className="font-mono font-bold text-zinc-900 mt-0.5 block">{formatRupiah(opname.profitA)}</span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Penjualan own & titipan dikurangi biaya barang & kerugian</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-zinc-200/70">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Profit B (Basis Kas Riil)</span>
                  <span className="font-mono font-bold text-zinc-900 mt-0.5 block">{formatRupiah(opname.profitB)}</span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Uang riil (R) dikurangi kewajiban mitra dan modal belanja</span>
                </div>
              </div>
            </div>

            {/* Note if exists */}
            {opname.note && (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs text-zinc-600">
                <span className="font-semibold text-zinc-700">Catatan:</span> {opname.note}
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-200 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`pb-2 px-1 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'products'
                    ? 'border-[#D97757] text-[#D97757]'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Rincian Produk ({opname.items?.length ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payouts')}
                className={`pb-2 px-1 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'payouts'
                    ? 'border-[#D97757] text-[#D97757]'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Hak Penitip ({opname.payouts?.length ?? 0})
              </button>
            </div>

            {/* Tab 1: Products table */}
            {activeTab === 'products' && (
              <div className="overflow-x-auto rounded-lg border border-zinc-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                    <tr>
                      <th className="py-2 px-3">Produk</th>
                      <th className="py-2 px-2 text-right">Awal</th>
                      <th className="py-2 px-2 text-right">Masuk</th>
                      <th className="py-2 px-2 text-right">Retur</th>
                      <th className="py-2 px-2 text-right">Teoritis</th>
                      <th className="py-2 px-2 text-right">Fisik</th>
                      <th className="py-2 px-2 text-right">Loss</th>
                      <th className="py-2 px-2 text-right font-bold text-zinc-900">Terjual</th>
                      <th className="py-2 px-2 text-right">Harga Jual</th>
                      <th className="py-2 px-3 text-right font-bold text-zinc-900">Omset</th>
                      <th className="py-2 px-3 text-right">Beban / Hak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {opname.items && opname.items.length > 0 ? (
                      opname.items.map((it) => (
                        <tr key={it.productId} className="hover:bg-zinc-50/50">
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-zinc-900">
                              {it.productNameSnapshot}
                            </div>
                            <span className="text-[10px] text-zinc-400">
                              {it.ownerType === 'own' ? 'Milik Sendiri' : 'Titipan'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-zinc-600">
                            {it.openingQty}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-zinc-600">
                            {it.inQty}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-zinc-600">
                            {it.returnedQty}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-zinc-700">
                            {it.expectedQty}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-zinc-900 font-semibold">
                            {it.physicalQty}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-amber-700">
                            {it.lossQty > 0 ? `${it.lossQty}` : '0'}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-zinc-900">
                            {it.soldQty}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-zinc-700">
                            {formatRupiah(it.sellPriceSnapshot)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-900">
                            {formatRupiah(it.turnover)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-zinc-600 text-[11px]">
                            {it.ownerType === 'own' ? (
                              <div>
                                <div>COGS: {formatRupiah(it.cogs)}</div>
                                <div className="text-[10px] text-zinc-400">
                                  Avg: {formatRupiah(it.avgCost)}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div>Hak: {formatRupiah(it.payoutDue)}</div>
                                <div className="text-[10px] text-zinc-400">
                                  Margin: {formatRupiah(it.ownerMarginPerPcs)}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={11} className="py-6 text-center text-xs text-zinc-400">
                          Tidak ada rincian produk pada opname ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Consignor Payouts */}
            {activeTab === 'payouts' && (
              <div className="space-y-3">
                {opname.payouts && opname.payouts.length > 0 ? (
                  <div className="rounded-lg border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
                    <div className="bg-zinc-50 p-2.5 grid grid-cols-4 text-[11px] font-semibold text-zinc-500">
                      <div>Mitra Penitip</div>
                      <div className="text-right">Hak Terjual</div>
                      <div className="text-right">Ganti Rugi Loss</div>
                      <div className="text-right font-bold text-zinc-900">Total Hak (Payout)</div>
                    </div>
                    {opname.payouts.map((p) => (
                      <div key={p.consignorId} className="p-3 grid grid-cols-4 text-xs items-center">
                        <div className="font-semibold text-zinc-900">
                          {p.consignorName || `Penitip #${p.consignorId}`}
                        </div>
                        <div className="text-right font-mono text-zinc-700">
                          {formatRupiah(p.soldShare)}
                        </div>
                        <div className="text-right font-mono text-zinc-700">
                          {formatRupiah(p.lossCompensation)}
                        </div>
                        <div className="text-right font-mono font-bold text-orange-950">
                          {formatRupiah(p.payoutDue)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-zinc-400 border rounded-lg border-zinc-200">
                    Tidak ada produk titipan pada periode opname ini.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
