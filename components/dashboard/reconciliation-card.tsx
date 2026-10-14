'use client';

import React, { useState } from 'react';
import { formatRupiah } from '@/lib/format';
import { calculateDashboardReconciliation, type DashboardOpnameOption, type DashboardReconciliationResult } from '@/lib/api';

interface ReconciliationCardProps {
  initialReconciliation: DashboardReconciliationResult | null;
  opnameOptions: DashboardOpnameOption[];
}

export function ReconciliationCard({
  initialReconciliation,
  opnameOptions,
}: ReconciliationCardProps) {
  const [selectedOpnameId, setSelectedOpnameId] = useState<number | undefined>(
    initialReconciliation?.opnameId ?? (opnameOptions[0] ? opnameOptions[0].id : undefined)
  );
  const [cashAmount, setCashAmount] = useState<string>(
    initialReconciliation?.cashAmount ? String(parseInt(initialReconciliation.cashAmount, 10)) : '0'
  );
  const [qrisAmount, setQrisAmount] = useState<string>(
    initialReconciliation?.qrisAmount ? String(parseInt(initialReconciliation.qrisAmount, 10)) : '0'
  );
  const [reconciliation, setReconciliation] = useState<DashboardReconciliationResult | null>(
    initialReconciliation
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedOpnameId) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await calculateDashboardReconciliation({
        opnameId: selectedOpnameId,
        cashAmount: cashAmount.trim() || '0',
        qrisAmount: qrisAmount.trim() || '0',
      });
      setReconciliation(res.data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menghitung rekonsiliasi kas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpnameChange = async (newId: number) => {
    setSelectedOpnameId(newId);
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await calculateDashboardReconciliation({
        opnameId: newId,
        cashAmount: cashAmount.trim() || '0',
        qrisAmount: qrisAmount.trim() || '0',
      });
      setReconciliation(res.data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat rekonsiliasi periode tersebut.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!opnameOptions.length) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-zinc-900">Rekonsiliasi Kas & Dual Profit (§5.8)</span>
        </div>
        <div className="rounded border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
          <p className="text-xs text-zinc-500">
            Belum ada periode opname final untuk direkonsiliasi. Lakukan opname fisik terlebih dahulu di menu{' '}
            <a href="/opname" className="font-semibold text-[#D97757] hover:underline">
              Opname Stok
            </a>.
          </p>
        </div>
      </div>
    );
  }

  const cashDiffNum = reconciliation ? Number(reconciliation.cashDifference) : 0;
  const isDiffZero = cashDiffNum === 0;
  const isSurplus = cashDiffNum > 0;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-xs space-y-6">
      {/* Header & Opname Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Rekonsiliasi Kas & Verifikasi Laba Dua Sisi
          </h2>
          <p className="text-xs text-zinc-500">
            Mengecek kecocokan fisik kasir ($R$) dengan omset teoritis ($T$) serta verifikasi Invariant I3.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label htmlFor="opname-select" className="text-xs font-medium text-zinc-600 whitespace-nowrap">
            Periode Opname:
          </label>
          <select
            id="opname-select"
            value={selectedOpnameId}
            onChange={(e) => handleOpnameChange(Number(e.target.value))}
            className="rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-800 shadow-2xs focus:border-[#D97757] focus:outline-hidden"
          >
            {opnameOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.opnameDate}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* Form Input Kas Fisik Kasir */}
      <form onSubmit={handleCalculate} className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
        <div className="space-y-1.5">
          <label htmlFor="cash-input" className="block text-xs font-semibold text-zinc-700">
            Uang Tunai di Laci Kasir (Cash)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-zinc-400 font-sans">
              Rp
            </span>
            <input
              id="cash-input"
              type="number"
              min="0"
              step="1"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-md border border-zinc-300 bg-white py-1.5 pl-9 pr-3 text-xs text-zinc-900 focus:border-[#D97757] focus:outline-hidden"
            />
          </div>
          <p className="text-[11px] text-zinc-400">Total uang kertas & koin fisik</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="qris-input" className="block text-xs font-semibold text-zinc-700">
            Penerimaan QRIS Masuk
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-zinc-400 font-sans">
              Rp
            </span>
            <input
              id="qris-input"
              type="number"
              min="0"
              step="1"
              value={qrisAmount}
              onChange={(e) => setQrisAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-md border border-zinc-300 bg-white py-1.5 pl-9 pr-3 text-xs text-zinc-900 focus:border-[#D97757] focus:outline-hidden"
            />
          </div>
          <p className="text-[11px] text-zinc-400">Total mutasi rekening QRIS toko</p>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-[#D97757] px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-[#c66a4c] disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Menghitung...' : 'Perbarui Rekonsiliasi'}
          </button>
        </div>
      </form>

      {/* Hasil Rekonsiliasi Kas */}
      {reconciliation && (
        <div className="space-y-4">
          {/* Status Selisih Kasir */}
          <div
            className={`rounded-lg p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDiffZero
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : isSurplus
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold">
                  {isDiffZero
                    ? '✓ Uang Riil Cocok dengan Sistem (Pas)'
                    : isSurplus
                    ? '▲ Kelebihan Uang Fisik (Surplus Kas)'
                    : '▼ Kekurangan Uang Fisik (Defisit Kas)'}
                </span>
                <span className="font-mono text-xs font-bold">
                  ({formatRupiah(reconciliation.cashDifference)})
                </span>
              </div>
              <p className="text-xs opacity-90">{reconciliation.cashDifferenceHint}</p>
            </div>

            <div className="text-right whitespace-nowrap">
              <div className="text-[11px] opacity-75">Kas Riil ($R$) vs Omset ($T$)</div>
              <div className="text-xs font-semibold">
                {formatRupiah(reconciliation.realCash)} / {formatRupiah(reconciliation.theoreticalTurnover)}
              </div>
            </div>
          </div>

          {/* Dual Profit Views Comparison (§5.8) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Profit A */}
            <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Profit A (Basis Barang)
                </span>
                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-mono">
                  Pergerakan Fisik
                </span>
              </div>
              <div className="text-xl font-bold text-zinc-900 font-sans">
                {formatRupiah(reconciliation.profitA)}
              </div>
              <div className="text-[11px] text-zinc-500 space-y-1 border-t border-zinc-100 pt-2">
                <div className="flex justify-between">
                  <span>Omset Barang Sendiri:</span>
                  <span className="font-mono">{formatRupiah(reconciliation.turnoverOwn)}</span>
                </div>
                <div className="flex justify-between">
                  <span>HPP (COGS):</span>
                  <span className="font-mono">-{formatRupiah(reconciliation.totalCogs)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Loss Toko:</span>
                  <span className="font-mono">-{formatRupiah(reconciliation.totalOwnLossCost)}</span>
                </div>
              </div>
            </div>

            {/* Profit B */}
            <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Profit B (Basis Kas Riil)
                </span>
                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-mono">
                  Arus Uang Riil
                </span>
              </div>
              <div className="text-xl font-bold text-zinc-900 font-sans">
                {formatRupiah(reconciliation.profitB)}
              </div>
              <div className="text-[11px] text-zinc-500 space-y-1 border-t border-zinc-100 pt-2">
                <div className="flex justify-between">
                  <span>Total Kas Masuk ($R$):</span>
                  <span className="font-mono">{formatRupiah(reconciliation.realCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kewajiban Setoran Penitip:</span>
                  <span className="font-mono">-{formatRupiah(reconciliation.totalPayoutDue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Modal Belanja Kulakan:</span>
                  <span className="font-mono">-{formatRupiah(reconciliation.modalBelanjaOwn)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invariant I3 Proof Banner */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                ✓
              </span>
              <span className="text-zinc-700 font-medium">
                Verifikasi Matematika Integritas (Invariant I3):
              </span>
              <span className="font-mono text-zinc-600 text-[11px]">
                Profit B - Profit A = (R - T) + ΔPersediaan
              </span>
            </div>

            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
              {reconciliation.invariantI3Satisfied ? 'Terverifikasi Valid 100%' : 'Selisih Anomali Terdeteksi'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
