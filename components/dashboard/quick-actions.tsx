import React from 'react';
import Link from 'next/link';

export function QuickActions() {
  const actions = [
    {
      title: 'Tutup Periode / Opname',
      desc: 'Hitung stok fisik & finalisasi omset toko',
      href: '/opname',
      badge: 'Rekomendasi Rutin',
      color: 'border-l-[#D97757]',
    },
    {
      title: 'Catat Barang Masuk',
      desc: 'Kulakan barang sendiri atau titipan baru',
      href: '/barang-masuk',
      color: 'border-l-blue-500',
    },
    {
      title: 'Catat Kerugian / Loss',
      desc: 'Barang basi, expired, rusak, atau hilang',
      href: '/loss',
      color: 'border-l-amber-500',
    },
    {
      title: 'Buku Kas & Bayar Penitip',
      desc: 'Setor bagi hasil & catat bukti pelunasan',
      href: '/payout',
      color: 'border-l-emerald-500',
    },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-zinc-600">
        Aksi Cepat Operasional
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((act) => (
          <Link
            key={act.href}
            href={act.href}
            className={`group rounded-lg border border-zinc-200 border-l-4 ${act.color} bg-white p-4 shadow-2xs hover:shadow-xs hover:border-zinc-300 transition-all block`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 group-hover:text-[#D97757] transition-colors">
                {act.title}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">{act.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
