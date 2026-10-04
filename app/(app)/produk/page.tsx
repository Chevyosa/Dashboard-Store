'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getProducts, getConsignors, type Product, type Consignor } from '@/lib/api';
import { ProductDialog } from '@/components/produk/product-dialog';
import { ProductStatusDialog } from '@/components/produk/product-status-dialog';
import { ProductTable } from '@/components/produk/product-table';
import { ProductCard } from '@/components/produk/product-card';

type OwnerFilter = 'all' | 'own' | 'consignor';
type StatusFilter = 'all' | 'active' | 'inactive';

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [consignors, setConsignors] = useState<Consignor[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [selectedConsignorFilter, setSelectedConsignorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusTargetProduct, setStatusTargetProduct] = useState<Product | null>(null);

  async function loadData() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [prodRes, consRes] = await Promise.all([
        getProducts({ limit: 100 }),
        getConsignors({ limit: 100 }),
      ]);
      setProducts(prodRes.data);
      setConsignors(consRes.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Gagal memuat daftar produk.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function initialFetch() {
      try {
        const [prodRes, consRes] = await Promise.all([
          getProducts({ limit: 100 }),
          getConsignors({ limit: 100 }),
        ]);
        if (!ignore) {
          setProducts(prodRes.data);
          setConsignors(consRes.data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof Error) {
            setErrorMessage(err.message);
          } else {
            setErrorMessage('Gagal memuat daftar produk.');
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

  // Filtered products calculation
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return products.filter((p) => {
      // Filter by ownerType
      if (ownerFilter !== 'all' && p.ownerType !== ownerFilter) {
        return false;
      }

      // Filter by consignor ID
      if (selectedConsignorFilter !== 'all') {
        const cId = parseInt(selectedConsignorFilter, 10);
        if (p.consignorId !== cId) return false;
      }

      // Filter by status
      if (statusFilter === 'active' && !p.isActive) return false;
      if (statusFilter === 'inactive' && p.isActive) return false;

      // Filter by search query
      if (q) {
        const matchName = p.name.toLowerCase().includes(q);
        const matchConsignor = p.consignorName?.toLowerCase().includes(q) ?? false;
        if (!matchName && !matchConsignor) return false;
      }

      return true;
    });
  }, [products, ownerFilter, selectedConsignorFilter, statusFilter, searchQuery]);

  // Counts for KPIs
  const totalCount = products.length;
  const ownCount = products.filter((p) => p.ownerType === 'own').length;
  const consignorCount = products.filter((p) => p.ownerType === 'consignor').length;
  const inactiveCount = products.filter((p) => !p.isActive).length;

  function handleOpenCreate() {
    setSelectedProduct(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(product: Product) {
    setSelectedProduct(product);
    setDialogOpen(true);
  }

  function handleOpenStatusToggle(product: Product) {
    setStatusTargetProduct(product);
    setStatusDialogOpen(true);
  }

  function handleSaved(saved: Product) {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  }

  function handleStatusChanged(updated: Product) {
    setProducts((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">
            Master Produk
          </h1>
          <p className="text-xs text-zinc-500">
            Katalog barang dagangan warung: produk milik sendiri dan titipan konsinyasi.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreate}
          className="bg-[#D97757] hover:bg-[#c26243] text-white font-medium text-xs h-9 px-4 shrink-0 shadow-xs"
        >
          <span className="text-sm mr-1 leading-none">+</span> Tambah Produk
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Total Produk
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-zinc-900">
            {totalCount}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-zinc-500" />
            Milik Sendiri
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-zinc-900">
            {ownCount}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-[#D97757] uppercase tracking-wider flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-[#D97757]" />
            Titipan
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-[#D97757]">
            {consignorCount}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-zinc-300" />
            Nonaktif
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-zinc-500">
            {inactiveCount}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3 bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Input
              type="search"
              placeholder="Cari nama produk atau nama mitra penitip..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-xs pl-8 border-zinc-200"
            />
            <span className="absolute left-2.5 top-2.5 text-zinc-400 text-xs">🔍</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Consignor Filter Dropdown if applicable */}
          {consignors.length > 0 && (
            <div className="shrink-0">
              <select
                aria-label="Filter Penitip"
                value={selectedConsignorFilter}
                onChange={(e) => setSelectedConsignorFilter(e.target.value)}
                className="h-9 rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#D97757]/40"
              >
                <option value="all">Semua Penitip</option>
                {consignors.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100">
          {/* Ownership Filter */}
          <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs">
            <button
              type="button"
              onClick={() => setOwnerFilter('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                ownerFilter === 'all'
                  ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Semua Jenis ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setOwnerFilter('own')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                ownerFilter === 'own'
                  ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Milik Sendiri ({ownCount})
            </button>
            <button
              type="button"
              onClick={() => setOwnerFilter('consignor')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                ownerFilter === 'consignor'
                  ? 'bg-white text-[#D97757] shadow-xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Titipan ({consignorCount})
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Semua Status
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Aktif
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-white text-zinc-800 shadow-xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Nonaktif
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center justify-between">
          <span>{errorMessage}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadData}
            className="h-7 text-xs bg-white"
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-400 space-y-2">
          <div className="inline-block animate-spin text-lg">⏳</div>
          <p>Memuat daftar produk...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-12 text-center space-y-3">
          <div className="inline-flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 font-mono text-sm">
            📦
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-800">
              {searchQuery || ownerFilter !== 'all' || statusFilter !== 'all'
                ? 'Tidak ada produk yang cocok'
                : 'Belum ada produk terdaftar'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {searchQuery || ownerFilter !== 'all' || statusFilter !== 'all'
                ? 'Coba ubah kata kunci pencarian atau sesuaikan pilihan filter di atas.'
                : 'Mulai dengan menambahkan produk pertama warung Anda untuk persiapan opname dan pencatatan barang masuk.'}
            </p>
          </div>
          {!searchQuery && ownerFilter === 'all' && statusFilter === 'all' && (
            <Button
              type="button"
              onClick={handleOpenCreate}
              size="sm"
              className="bg-[#D97757] hover:bg-[#c26243] text-white text-xs mt-2"
            >
              + Tambah Produk Sekarang
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <ProductTable
              products={filteredProducts}
              onEdit={handleOpenEdit}
              onToggleStatus={handleOpenStatusToggle}
            />
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onEdit={handleOpenEdit}
                onToggleStatus={handleOpenStatusToggle}
              />
            ))}
          </div>
        </>
      )}

      {/* Dialogs */}
      <ProductDialog
        open={dialogOpen}
        initialData={selectedProduct}
        onClose={() => setDialogOpen(false)}
        onSaved={handleSaved}
      />

      <ProductStatusDialog
        open={statusDialogOpen}
        product={statusTargetProduct}
        onClose={() => setStatusDialogOpen(false)}
        onStatusChanged={handleStatusChanged}
      />
    </div>
  );
}
