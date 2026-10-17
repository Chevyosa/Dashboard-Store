'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  getConsignorLedger,
  deleteConsignorPayment,
  type ConsignorLedgerDetail,
} from '@/lib/api';
import { formatDateIndo, formatRupiah } from '@/lib/format';
import { PayoutStatusBadge } from './payout-status-badge';

interface Props {
  open: boolean;
  consignorId: number | null;
  onClose: () => void;
  onPayClicked: (consignorId: number) => void;
}

export function PayoutDetailDialog({
  open,
  consignorId,
  onClose,
  onPayClicked,
}: Props) {
  const [detail, setDetail] = useState<ConsignorLedgerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'accruals' | 'payments'>('accruals');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !consignorId) {
      setDetail(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setErrorMessage(null);

    getConsignorLedger(consignorId)
      .then((res) => {
        if (isMounted) setDetail(res.data);
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : 'Gagal memuat buku kas.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, consignorId]);

  async function handleDeletePayment(paymentId: number) {
    if (!confirm('Yakin ingin membatalkan/menghapus bukti pembayaran ini?')) return;
    setDeletingId(paymentId);
    try {
      await deleteConsignorPayment(paymentId);
      if (consignorId) {
        const refreshed = await getConsignorLedger(consignorId);
        setDetail(refreshed.data);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal membatalkan pembayaran.');
    } finally {
      setDeletingId(null);
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs"
    >
      <div className="w-full max-w-2xl rounded-t-2xl sm:rounded-2xl bg-white p-4 sm:p-6 shadow-xl border border-zinc-200 max-h-[92dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900">
                {detail?.consignor.name ?? 'Buku Kas Penitip'}
              </h2>
              {detail && <PayoutStatusBadge status={detail.summary.status} />}
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              Kontak: {detail?.consignor.phone || '—'}
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

        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            Memuat buku kas penitip...
          </div>
        ) : errorMessage ? (
          <div className="py-8 text-center text-xs text-red-600 bg-red-50 rounded-lg my-4">
            {errorMessage}
          </div>
        ) : detail ? (
          <div className="flex-1 overflow-y-auto space-y-4 py-3">
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-lg bg-zinc-50 border border-zinc-200/80 p-2.5">
                <p className="text-[10px] uppercase font-semibold text-zinc-500">
                  Total Hak (Akrual)
                </p>
                <p className="mt-1 font-mono text-sm font-bold text-zinc-900">
                  {formatRupiah(detail.summary.totalAccrual)}
                </p>
              </div>

              <div className="rounded-lg bg-emerald-50/50 border border-emerald-200/60 p-2.5">
                <p className="text-[10px] uppercase font-semibold text-emerald-800">
                  Telah Dibayar
                </p>
                <p className="mt-1 font-mono text-sm font-bold text-emerald-700">
                  {formatRupiah(detail.summary.totalPayment)}
                </p>
              </div>

              <div className="rounded-lg bg-orange-50/50 border border-orange-200/60 p-2.5">
                <p className="text-[10px] uppercase font-semibold text-[#D97757]">
                  Sisa Saldo
                </p>
                <p className="mt-1 font-mono text-sm font-bold text-[#D97757]">
                  {formatRupiah(detail.summary.balance)}
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-200 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('accruals')}
                className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'accruals'
                    ? 'border-[#D97757] text-[#D97757]'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Riwayat Hak Opname ({detail.accruals.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'payments'
                    ? 'border-[#D97757] text-[#D97757]'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Riwayat Pembayaran Kas ({detail.payments.length})
              </button>
            </div>

            {/* Content Tab 1: Accruals */}
            {activeTab === 'accruals' && (
              <div>
                {detail.accruals.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-6">
                    Belum ada akrual hak penitip dari opname final.
                  </p>
                ) : (
                  <div className="rounded-lg border border-zinc-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                          <tr>
                            <th className="py-2 px-3">Tgl Opname</th>
                            <th className="py-2 px-3 text-right">Bagi Hasil Jual</th>
                            <th className="py-2 px-3 text-right">Kompensasi Hilang</th>
                            <th className="py-2 px-3 text-right">Total Hak</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-mono">
                          {detail.accruals.map((acc) => (
                            <tr key={acc.id} className="hover:bg-zinc-50/60">
                              <td className="py-2 px-3 text-zinc-800">
                                {formatDateIndo(acc.opnameDate)}
                              </td>
                              <td className="py-2 px-3 text-right text-zinc-700">
                                {formatRupiah(acc.soldShare)}
                              </td>
                              <td className="py-2 px-3 text-right text-zinc-700">
                                {formatRupiah(acc.lossCompensation)}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-zinc-900">
                                {formatRupiah(acc.payoutDue)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Content Tab 2: Payments */}
            {activeTab === 'payments' && (
              <div>
                {detail.payments.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-6">
                    Belum ada bukti pembayaran kas yang tercatat.
                  </p>
                ) : (
                  <div className="rounded-lg border border-zinc-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                          <tr>
                            <th className="py-2 px-3">Tgl Bayar</th>
                            <th className="py-2 px-3">Metode</th>
                            <th className="py-2 px-3 text-right">Nominal</th>
                            <th className="py-2 px-3">Catatan</th>
                            <th className="py-2 px-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {detail.payments.map((pay) => (
                            <tr key={pay.id} className="hover:bg-zinc-50/60">
                              <td className="py-2 px-3 font-mono text-zinc-800">
                                {formatDateIndo(pay.paymentDate)}
                              </td>
                              <td className="py-2 px-3 capitalize">
                                <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700">
                                  {pay.paymentMethod === 'cash'
                                    ? 'Tunai'
                                    : pay.paymentMethod === 'qris'
                                    ? 'QRIS'
                                    : 'Transfer'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                                {formatRupiah(pay.amount)}
                              </td>
                              <td className="py-2 px-3 text-zinc-500 truncate max-w-[150px]">
                                {pay.note || '—'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  disabled={deletingId === pay.id}
                                  onClick={() => handleDeletePayment(pay.id)}
                                  className="text-red-600 hover:text-red-800 text-[11px] font-medium"
                                >
                                  {deletingId === pay.id ? '...' : 'Hapus'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-8 text-xs px-3"
          >
            Tutup
          </Button>

          {consignorId && (
            <Button
              type="button"
              onClick={() => {
                onClose();
                onPayClicked(consignorId);
              }}
              className="h-8 text-xs px-4 bg-[#D97757] hover:bg-[#c26243] text-white font-medium shadow-xs"
            >
              Catat Pembayaran Baru
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
