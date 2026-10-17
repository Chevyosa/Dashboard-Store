'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  RiDashboard3Line,
  RiDashboard3Fill,
  RiShoppingBag3Line,
  RiShoppingBag3Fill,
  RiInboxArchiveLine,
  RiInboxArchiveFill,
  RiFileList3Line,
  RiFileList3Fill,
  RiGridLine,
  RiGridFill,
  RiHandCoinLine,
  RiWallet3Line,
  RiTeamLine,
  RiErrorWarningLine,
  RiHistoryLine,
  RiCloseLine,
  RiLogoutBoxRLine,
} from '@remixicon/react';
import { apiFetch } from '@/lib/api';

interface BottomNavProps {
  username?: string;
}

export function BottomNav({ username }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Prevent background scroll when menu sheet is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Handle ESC key to close sheet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // Navigate anyway
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const isDashboardActive = pathname === '/dashboard';
  const isProdukActive = pathname.startsWith('/produk');
  const isMasukActive = pathname.startsWith('/barang-masuk');
  const isOpnameActive = pathname.startsWith('/opname');

  // If on secondary pages, the 5th "Menu" tab shows active indicator
  const isMenuRouteActive =
    pathname.startsWith('/take-profit') ||
    pathname.startsWith('/payout') ||
    pathname.startsWith('/penitip') ||
    pathname.startsWith('/loss') ||
    pathname.startsWith('/audit');

  return (
    <>
      {/* Native App-Style Bottom Navigation Bar */}
      <nav
        aria-label="Navigasi Utama Ponsel"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 lg:hidden shadow-lg pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 h-14 max-w-lg mx-auto">
          {/* 1. Dashboard */}
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all active:scale-95 ${
              isDashboardActive
                ? 'text-[#D97757] font-semibold'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {isDashboardActive ? (
              <RiDashboard3Fill className="size-5" />
            ) : (
              <RiDashboard3Line className="size-5" />
            )}
            <span>Dashboard</span>
          </Link>

          {/* 2. Produk */}
          <Link
            href="/produk"
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all active:scale-95 ${
              isProdukActive
                ? 'text-[#D97757] font-semibold'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {isProdukActive ? (
              <RiShoppingBag3Fill className="size-5" />
            ) : (
              <RiShoppingBag3Line className="size-5" />
            )}
            <span>Produk</span>
          </Link>

          {/* 3. Barang Masuk */}
          <Link
            href="/barang-masuk"
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all active:scale-95 ${
              isMasukActive
                ? 'text-[#D97757] font-semibold'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {isMasukActive ? (
              <RiInboxArchiveFill className="size-5" />
            ) : (
              <RiInboxArchiveLine className="size-5" />
            )}
            <span>Masuk</span>
          </Link>

          {/* 4. Opname */}
          <Link
            href="/opname"
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all active:scale-95 ${
              isOpnameActive
                ? 'text-[#D97757] font-semibold'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {isOpnameActive ? (
              <RiFileList3Fill className="size-5" />
            ) : (
              <RiFileList3Line className="size-5" />
            )}
            <span>Opname</span>
          </Link>

          {/* 5. Menu Lainnya */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className={`relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all active:scale-95 ${
              menuOpen || isMenuRouteActive
                ? 'text-[#D97757] font-semibold'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {isMenuRouteActive && !menuOpen && (
              <span className="absolute top-2 right-4 size-1.5 rounded-full bg-[#D97757]" />
            )}
            {menuOpen || isMenuRouteActive ? (
              <RiGridFill className="size-5" />
            ) : (
              <RiGridLine className="size-5" />
            )}
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {/* Slide-Up Bottom Sheet Drawer */}
      {menuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu Lengkap Toko"
          className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end"
        >
          {/* Backdrop */}
          <div
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Sheet Container */}
          <div className="relative z-10 w-full max-h-[82dvh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl border-t border-zinc-200 space-y-5 animate-in slide-in-from-bottom duration-200">
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-1.5 bg-[#D97757] rounded-full" />
                  <h2 className="text-sm font-bold text-zinc-900">Menu Lengkap Toko</h2>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Akses langsung seluruh fitur finansial dan operasional.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="size-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
                aria-label="Tutup Menu"
              >
                <RiCloseLine className="size-5" />
              </button>
            </div>

            {/* Section: Keuangan */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Keuangan & Laba
              </span>
              <div className="grid grid-cols-1 gap-2">
                <Link
                  href="/take-profit"
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    pathname.startsWith('/take-profit')
                      ? 'border-[#D97757] bg-orange-50/50 text-[#D97757]'
                      : 'border-zinc-200 hover:bg-zinc-50 text-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <RiHandCoinLine className="size-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Take Profit</div>
                      <div className="text-[11px] text-zinc-500">
                        Penarikan laba bersih owner & proteksi modal
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Laba Halal
                  </span>
                </Link>

                <Link
                  href="/payout"
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    pathname.startsWith('/payout')
                      ? 'border-[#D97757] bg-orange-50/50 text-[#D97757]'
                      : 'border-zinc-200 hover:bg-zinc-50 text-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                      <RiWallet3Line className="size-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Payout Penitip</div>
                      <div className="text-[11px] text-zinc-500">
                        Buku kas mitra & pelunasan bagi hasil konsinyasi
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                    Bagi Hasil
                  </span>
                </Link>
              </div>
            </div>

            {/* Section: Operasional Toko */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Operasional Tambahan
              </span>
              <div className="grid grid-cols-1 gap-2">
                <Link
                  href="/penitip"
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    pathname.startsWith('/penitip')
                      ? 'border-[#D97757] bg-orange-50/50 text-[#D97757]'
                      : 'border-zinc-200 hover:bg-zinc-50 text-zinc-800'
                  }`}
                >
                  <div className="size-9 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                    <RiTeamLine className="size-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Master Penitip</div>
                    <div className="text-[11px] text-zinc-500">
                      Daftar mitra konsinyasi dan kontak WhatsApp
                    </div>
                  </div>
                </Link>

                <Link
                  href="/loss"
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    pathname.startsWith('/loss')
                      ? 'border-[#D97757] bg-orange-50/50 text-[#D97757]'
                      : 'border-zinc-200 hover:bg-zinc-50 text-zinc-800'
                  }`}
                >
                  <div className="size-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <RiErrorWarningLine className="size-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Barang Rusak & Hilang (Loss)</div>
                    <div className="text-[11px] text-zinc-500">
                      Pencatatan mutasi loss etalase dan pembagian beban
                    </div>
                  </div>
                </Link>

                <Link
                  href="/audit"
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    pathname.startsWith('/audit')
                      ? 'border-[#D97757] bg-orange-50/50 text-[#D97757]'
                      : 'border-zinc-200 hover:bg-zinc-50 text-zinc-800'
                  }`}
                >
                  <div className="size-9 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                    <RiHistoryLine className="size-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Riwayat Aktivitas Toko</div>
                    <div className="text-[11px] text-zinc-500">
                      Jejak audit seluruh perubahan stok, harga, dan kas
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Section: Sesi & Logout */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono font-medium text-zinc-700">
                  {username || 'Kasir Aktif'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
              >
                <RiLogoutBoxRLine className="size-3.5" />
                <span>{loggingOut ? 'Keluar...' : 'Keluar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
