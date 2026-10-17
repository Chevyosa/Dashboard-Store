'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getDashboardSummary,
  getTakeProfitOverview,
  type DashboardSummaryResponse,
} from '@/lib/api';
import { formatDateIndo, formatRupiah } from '@/lib/format';
import { DashboardKPICards } from '@/components/dashboard/dashboard-kpi-cards';
import { ReconciliationCard } from '@/components/dashboard/reconciliation-card';
import { TurnoverBreakdownCard } from '@/components/dashboard/turnover-breakdown-card';
import { TopProductsCard } from '@/components/dashboard/top-products-card';
import { PendingPayoutsCard } from '@/components/dashboard/pending-payouts-card';
import { QuickActions } from '@/components/dashboard/quick-actions';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryRes, takeProfitRes] = await Promise.all([
        getDashboardSummary(),
        getTakeProfitOverview().catch(() => null),
      ]);
      setData({
        ...summaryRes.data,
        takeProfit: summaryRes.data.takeProfit ?? takeProfitRes?.data ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat ringkasan dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-6 w-36 bg-zinc-200 animate-pulse rounded" />
          <div className="h-4 w-64 bg-zinc-100 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-lg border border-zinc-200 bg-white p-5 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-lg border border-zinc-200 bg-white p-6 animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center space-y-3">
        <h2 className="text-sm font-semibold text-red-800">Gagal Memuat Data Dashboard</h2>
        <p className="text-xs text-red-600">{error ?? 'Terjadi kesalahan saat mengambil data.'}</p>
        <button
          onClick={fetchSummary}
          className="rounded bg-[#D97757] px-4 py-2 text-xs font-medium text-white hover:bg-[#c66a4c]"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const { overview, turnoverBreakdown, topProducts, pendingPayoutConsignors, recentOpnames, opnameOptions, latestReconciliation } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">
            Dashboard Toko
          </h1>
          <p className="text-xs text-zinc-500">
            Pusat pantauan performa finansial, stok barang, dan rekonsiliasi kasir fisik.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
            {overview.activeProductsCount} Produk Aktif
          </span>
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
            {overview.activeConsignorsCount} Penitip Aktif
          </span>
        </div>
      </div>

      {/* Active Draft Alert */}
      {overview.hasActiveDraft && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-amber-600 font-bold text-sm">⚠</span>
            <span className="text-xs font-medium text-amber-900">
              Terdapat draft opname tanggal{' '}
              <strong className="font-semibold">{overview.activeDraftDate}</strong> yang belum difinalisasi.
            </span>
          </div>
          <Link
            href="/opname"
            className="rounded bg-amber-700 px-3 py-1 text-xs font-medium text-white hover:bg-amber-800 transition-colors"
          >
            Lanjutkan Opname
          </Link>
        </div>
      )}

      {/* Quick Action Shortcuts */}
      <QuickActions />

      {/* KPI Cards */}
      <DashboardKPICards
        overview={overview}
        latestReconciliation={latestReconciliation}
        takeProfit={data.takeProfit}
      />

      {/* Dual Profit & Real Cash Reconciliation Panel */}
      <ReconciliationCard
        initialReconciliation={latestReconciliation}
        opnameOptions={opnameOptions}
      />

      {/* Grid: Turnover Breakdown & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TurnoverBreakdownCard breakdown={turnoverBreakdown} />
        <TopProductsCard products={topProducts} />
      </div>

      {/* Grid: Pending Payouts & Recent Opnames */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingPayoutsCard consignors={pendingPayoutConsignors} />

        {/* Recent Opnames */}
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-semibold text-zinc-900">
              Riwayat Opname Terakhir
            </h3>
            <Link href="/opname" className="text-xs font-medium text-[#D97757] hover:underline">
              Lihat Semua
            </Link>
          </div>

          {!recentOpnames.length ? (
            <div className="py-6 text-center text-xs text-zinc-400">
              Belum ada riwayat opname.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {recentOpnames.map((op) => (
                <div key={op.id} className="flex items-center justify-between py-2.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-zinc-900">
                        {formatDateIndo(op.opnameDate)}
                      </span>
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-semibold ${
                          op.status === 'final'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {op.status === 'final' ? 'Final' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      {op.totalSoldQty} terjual · {op.totalLossQty} loss
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-zinc-900 font-sans">
                      {formatRupiah(op.totalTurnover)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
