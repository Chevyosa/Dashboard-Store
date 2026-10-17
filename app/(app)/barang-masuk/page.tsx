'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getStockIns,
  getStockIn,
  getStockReturns,
  getProducts,
  getOpenPeriodStockInSummary,
  deleteStockIn,
  deleteStockReturn,
  type StockIn,
  type StockReturn,
  type Product,
  type StockInSummary,
} from '@/lib/api';
import { StockInDialog } from '@/components/barang-masuk/stock-in-dialog';
import { StockReturnDialog } from '@/components/barang-masuk/stock-return-dialog';
import { StockInTable } from '@/components/barang-masuk/stock-in-table';
import { StockInCard } from '@/components/barang-masuk/stock-in-card';
import { StockReturnTable } from '@/components/barang-masuk/stock-return-table';
import { DeleteConfirmDialog } from '@/components/barang-masuk/delete-confirm-dialog';

type ActiveTab = 'stock_in' | 'returns';
type TypeFilter = 'all' | 'purchase' | 'consignment_in' | 'initial';
type PeriodFilter = 'open' | 'all';

function formatRupiah(amountStr: string): string {
  const num = parseFloat(amountStr);
  if (isNaN(num)) return 'Rp 0';
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
}

export default function BarangMasukPage() {
  const [stockIns, setStockIns] = useState<StockIn[]>([]);
  const [returns, setReturns] = useState<StockReturn[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<StockInSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<ActiveTab>('stock_in');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('open');

  // Dialog states
  const [stockInDialogOpen, setStockInDialogOpen] = useState(false);
  const [selectedStockIn, setSelectedStockIn] = useState<StockIn | null>(null);

  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<StockReturn | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'stock_in' | 'return';
    item: StockIn | StockReturn;
  } | null>(null);

  async function loadData() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [siRes, retRes, prodRes, sumRes] = await Promise.all([
        getStockIns({ limit: 100 }),
        getStockReturns({ limit: 100 }),
        getProducts({ limit: 100 }),
        getOpenPeriodStockInSummary(),
      ]);

      setStockIns(siRes.data);
      setReturns(retRes.data);
      setProducts(prodRes.data);
      setSummary(sumRes.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Gagal memuat data barang masuk dan retur.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function initialFetch() {
      try {
        const [siRes, retRes, prodRes, sumRes] = await Promise.all([
          getStockIns({ limit: 100 }),
          getStockReturns({ limit: 100 }),
          getProducts({ limit: 100 }),
          getOpenPeriodStockInSummary(),
        ]);
        if (!ignore) {
          setStockIns(siRes.data);
          setReturns(retRes.data);
          setProducts(prodRes.data);
          setSummary(sumRes.data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof Error) {
            setErrorMessage(err.message);
          } else {
            setErrorMessage('Gagal memuat data barang masuk.');
          }
          setLoading(false);
        }
      }
    }

    void initialFetch();

    return () => {
      ignore = true;
    };
  }, []);

  // Filtered stock ins
  const filteredStockIns = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return stockIns.filter((item) => {
      if (periodFilter === 'open' && item.opnameId !== null) return false;
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;

      if (q) {
        const matchDate = item.date.includes(q);
        const matchNote = item.note?.toLowerCase().includes(q) ?? false;
        const matchProduct = item.lines?.some((l) => l.productName.toLowerCase().includes(q)) ?? false;
        if (!matchDate && !matchNote && !matchProduct) return false;
      }

      return true;
    });
  }, [stockIns, periodFilter, typeFilter, searchQuery]);

  // Filtered returns
  const filteredReturns = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return returns.filter((item) => {
      if (periodFilter === 'open' && item.opnameId !== null) return false;

      if (q) {
        const matchDate = item.date.includes(q);
        const matchProduct = item.productName.toLowerCase().includes(q);
        const matchConsignor = item.consignorName?.toLowerCase().includes(q) ?? false;
        const matchNote = item.note?.toLowerCase().includes(q) ?? false;
        if (!matchDate && !matchProduct && !matchConsignor && !matchNote) return false;
      }

      return true;
    });
  }, [returns, periodFilter, searchQuery]);

  // Handlers for Stock In
  function handleOpenCreateStockIn() {
    setSelectedStockIn(null);
    setStockInDialogOpen(true);
  }

  async function handleOpenEditStockIn(item: StockIn) {
    if (item.lines && item.lines.length > 0) {
      setSelectedStockIn(item);
      setStockInDialogOpen(true);
      return;
    }

    try {
      const res = await getStockIn(item.id);
      setSelectedStockIn(res.data);
      setStockInDialogOpen(true);
    } catch {
      setSelectedStockIn(item);
      setStockInDialogOpen(true);
    }
  }

  function handleStockInSaved(saved: StockIn) {
    setStockIns((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    void loadData(); // refresh summary
  }

  // Handlers for Returns
  function handleOpenCreateReturn() {
    setSelectedReturn(null);
    setReturnDialogOpen(true);
  }

  function handleOpenEditReturn(item: StockReturn) {
    setSelectedReturn(item);
    setReturnDialogOpen(true);
  }

  function handleReturnSaved(saved: StockReturn) {
    setReturns((prev) => {
      const idx = prev.findIndex((r) => r.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    void loadData(); // refresh summary
  }

  // Delete execution
  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'stock_in') {
      await deleteStockIn(deleteTarget.item.id);
      setStockIns((prev) => prev.filter((s) => s.id !== deleteTarget.item.id));
    } else {
      await deleteStockReturn(deleteTarget.item.id);
      setReturns((prev) => prev.filter((r) => r.id !== deleteTarget.item.id));
    }

    void loadData();
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">
            Barang Masuk & Retur
          </h1>
          <p className="text-xs text-zinc-500">
            Pencatatan pasokan belanja warung, setoran mitra titipan, dan pengembalian sisa titipan.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleOpenCreateReturn}
            className="text-xs h-9 px-3 border-zinc-200 hover:bg-zinc-50 text-zinc-700 min-h-[36px]"
          >
            + Retur Penitip
          </Button>
          <Button
            type="button"
            onClick={handleOpenCreateStockIn}
            className="bg-[#D97757] hover:bg-[#c26243] text-white font-medium text-xs h-9 px-4 shadow-xs min-h-[36px]"
          >
            <span className="text-sm mr-1 leading-none">+</span> Catat Barang Masuk
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-zinc-500">
            Modal Belanja Periode Ini
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-zinc-900">
            {summary ? formatRupiah(summary.totalPurchaseCost) : 'Rp 0'}
          </div>
          <div className="mt-0.5 text-[10px] text-zinc-400">
            {summary?.totalTransactions ?? 0} transaksi belanja own
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-zinc-600 flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-zinc-500" />
            Masuk (Own)
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-zinc-900">
            {summary?.totalOwnPcs ?? 0} pcs
          </div>
          <div className="mt-0.5 text-[10px] text-zinc-400">Barang milik sendiri</div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-[#D97757] flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-[#D97757]" />
            Setoran Titipan
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-[#D97757]">
            {summary?.totalConsignorPcs ?? 0} pcs
          </div>
          <div className="mt-0.5 text-[10px] text-zinc-400">Modal owner Rp 0</div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-amber-700 flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Retur Penitip
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-amber-700">
            {summary?.openReturnedPcs ?? 0} pcs
          </div>
          <div className="mt-0.5 text-[10px] text-zinc-400">
            {summary?.openReturnsCount ?? 0} transaksi ditarik
          </div>
        </div>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="space-y-3 bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
        {/* Main Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('stock_in')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'stock_in'
                  ? 'bg-zinc-900 text-white font-semibold'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              Barang Masuk ({filteredStockIns.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('returns')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'returns'
                  ? 'bg-zinc-900 text-white font-semibold'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              Retur Penitip ({filteredReturns.length})
            </button>
          </div>

          {/* Period Filter (Open vs All) */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] text-zinc-400 hidden sm:inline">Periode:</span>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
              className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#D97757]"
            >
              <option value="open">Periode Berjalan (Terbuka)</option>
              <option value="all">Semua Riwayat</option>
            </select>
          </div>
        </div>

        {/* Sub-Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1">
            <Input
              type="search"
              placeholder={
                activeTab === 'stock_in'
                  ? 'Cari tanggal, produk, atau catatan barang masuk...'
                  : 'Cari tanggal, nama produk, atau mitra penitip...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs pl-8 border-zinc-200"
            />
            <span className="absolute left-2.5 top-2 text-zinc-400 text-xs">🔍</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {activeTab === 'stock_in' && (
            <div className="flex items-center gap-1.5 text-xs shrink-0 overflow-x-auto">
              <span className="text-[11px] text-zinc-400 hidden sm:inline">Tipe:</span>
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-zinc-800 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('purchase')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  typeFilter === 'purchase'
                    ? 'bg-zinc-800 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Belanja Own
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('consignment_in')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  typeFilter === 'consignment_in'
                    ? 'bg-zinc-800 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Setoran Penitip
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('initial')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  typeFilter === 'initial'
                    ? 'bg-zinc-800 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Stok Awal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-500 shadow-xs">
          Memuat data mutasi stok...
        </div>
      ) : activeTab === 'stock_in' ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <StockInTable
              stockIns={filteredStockIns}
              onEdit={handleOpenEditStockIn}
              onDelete={(item) => setDeleteTarget({ type: 'stock_in', item })}
            />
          </div>

          {/* Mobile Card List View */}
          <div className="sm:hidden space-y-3">
            {filteredStockIns.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-xs text-zinc-500">
                Tidak ada data barang masuk.
              </div>
            ) : (
              filteredStockIns.map((item) => (
                <StockInCard
                  key={item.id}
                  stockIn={item}
                  onEdit={handleOpenEditStockIn}
                  onDelete={(item) => setDeleteTarget({ type: 'stock_in', item })}
                />
              ))
            )}
          </div>
        </>
      ) : (
        <StockReturnTable
          returns={filteredReturns}
          onEdit={handleOpenEditReturn}
          onDelete={(item) => setDeleteTarget({ type: 'return', item })}
        />
      )}

      {/* Stock In Dialog */}
      <StockInDialog
        open={stockInDialogOpen}
        onClose={() => setStockInDialogOpen(false)}
        onSaved={handleStockInSaved}
        initialData={selectedStockIn}
        products={products}
      />

      {/* Stock Return Dialog */}
      <StockReturnDialog
        open={returnDialogOpen}
        onClose={() => setReturnDialogOpen(false)}
        onSaved={handleReturnSaved}
        initialData={selectedReturn}
        products={products}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        title={
          deleteTarget?.type === 'stock_in'
            ? 'Hapus Data Barang Masuk?'
            : 'Hapus Data Retur Penitip?'
        }
        description={
          deleteTarget?.type === 'stock_in'
            ? 'Data transaksi barang masuk dan seluruh rincian item di dalamnya akan dihapus permanen. Tindakan ini hanya dapat dilakukan pada periode yang belum di-opname.'
            : 'Data pengembalian barang titipan ini akan dihapus permanen dari riwayat periode terbuka.'
        }
        confirmLabel="Hapus Permanen"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
