'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/produk', label: 'Produk' },
  { href: '/penitip', label: 'Penitip' },
  { href: '/barang-masuk', label: 'Barang Masuk' },
  { href: '/loss', label: 'Loss' },
  { href: '/opname', label: 'Opname' },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 sm:gap-4 text-xs">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-2 py-1 rounded transition-colors ${
              isActive
                ? 'font-semibold text-[#D97757] bg-orange-50/60'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
