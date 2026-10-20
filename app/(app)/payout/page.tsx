'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getConsignorLedgers,
  type ConsignorLedgersOverview,
  type ConsignorLedgerItem,
  type ConsignorPayment,
} from '@/lib/api';
import { PayoutSummaryCards } from '@/components/payout/payout-summary-cards';
import { PayoutTable } from '@/components/payout/payout-table';
import { PaymentDialog } from '@/components/payout/payment-dialog';
import { PayoutDetailDialog } from '@/components/payout/payout-detail-dialog';

export default function PayoutPage() {
  const [overview, setOverview] = useState<ConsignorLedgersOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'settled' | 'overpaid'>('all');

  // Dialogs
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedConsignorForPay, setSelectedConsignorForPay] = useState<number | null>(null);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedConsignorForDetail, setSelectedConsignorForDetail] = useState<number | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const res = await getConsignorLedgers({
        status: statusFilter,
        search: searchQuery.trim() || undefined,
      });
      setOverview(res.data);
      setErrorMessage(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data buku kas penitip.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadData();
  }

  function handleOpenPay(ledger?: ConsignorLedgerItem) {
    setSelectedConsignorForPay(ledger ? ledger.consignorId : null);
    setPaymentDialogOpen(true);
  }

  function handleViewLedger(ledger: ConsignorLedgerItem) {
    setSelectedConsignorForDetail(ledger.consignorId);
    setDetailDialogOpen(true);
  }

  function handlePaymentSaved(payment: ConsignorPayment) {
    setPaymentDialogOpen(false);
    setSuccessMessage(`Pembayaran Rp ${Number(payment.amount).toLocaleString('id-ID')} kepada ${payment.consignorName} berhasil dicatat.`);
    loadData();
    setTimeout(() => setSuccessMessage(null), 5000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">
            Payout & Buku Kas Penitip
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Penyaluran hak bagi hasil penjualan barang titipan dan pemantauan saldo hutang konsinyasi.
          </p>
        </div>

        <Button
          onClick={() => handleOpenPay()}
          className="bg-[#D97757] hover:bg-[#c26243] text-white text-xs h-9 px-4 font-medium shadow-xs shrink-0 self-start sm:self-auto"
        >
          + Catat Pembayaran
        </Button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800">
          {errorMessage}
        </div>
      )}

      {/* Summary Cards */}
      {overview && <PayoutSummaryCards totals={overview.totals} />}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { key: 'all', label: 'Semua Status' },
              { key: 'unpaid', label: 'Belum Lunas' },
              { key: 'settled', label: 'Lunas' },
              { key: 'overpaid', label: 'Lebih Bayar' },
            ] as const
          ).map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
          <Input
            type="text"
            placeholder="Cari nama penitip / telepon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs bg-white"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="h-8 text-xs px-3 shrink-0"
          >
            Cari
          </Button>
        </form>
      </div>

      {/* Table */}
      {loading && !overview ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-500 shadow-xs">
          Memuat buku kas penitip...
        </div>
      ) : overview ? (
        <PayoutTable
          ledgers={overview.ledgers}
          onPay={handleOpenPay}
          onViewLedger={handleViewLedger}
        />
      ) : null}

      {/* Payment Dialog */}
      {overview && (
        <PaymentDialog
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          onSaved={handlePaymentSaved}
          consignors={overview.ledgers}
          selectedConsignorId={selectedConsignorForPay}
        />
      )}

      {/* Detail Ledger Dialog */}
      <PayoutDetailDialog
        open={detailDialogOpen}
        consignorId={selectedConsignorForDetail}
        onClose={() => {
          setDetailDialogOpen(false);
          loadData();
        }}
        onPayClicked={(cId) => {
          setSelectedConsignorForPay(cId);
          setPaymentDialogOpen(true);
        }}
      />
    </div>
  );
}
