import React from 'react';
import Link from 'next/link';
import {
  RiFileList3Line,
  RiInboxArchiveLine,
  RiErrorWarningLine,
  RiHandCoinLine,
} from '@remixicon/react';

export function QuickActions() {
  const actions = [
    {
      title: 'Tutup Periode / Opname',
      href: '/opname',
      icon: RiFileList3Line,
      iconColor: 'text-[#D97757]',
      bgColor: 'bg-orange-50 group-hover:bg-[#D97757]/15',
      borderColor: 'border-orange-100/80',
    },
    {
      title: 'Catat Barang Masuk',
      href: '/barang-masuk',
      icon: RiInboxArchiveLine,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50 group-hover:bg-blue-100/60',
      borderColor: 'border-blue-100/80',
    },
    {
      title: 'Catat Kerugian / Loss',
      href: '/loss',
      icon: RiErrorWarningLine,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50 group-hover:bg-amber-100/60',
      borderColor: 'border-amber-100/80',
    },
    {
      title: 'Buku Kas & Bayar Penitip',
      href: '/payout',
      icon: RiHandCoinLine,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50 group-hover:bg-emerald-100/60',
      borderColor: 'border-emerald-100/80',
    },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-zinc-600">
        Aksi Cepat Operasional
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.href}
              href={act.href}
              className="group flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-xl border border-zinc-200 bg-white hover:border-[#D97757]/40 hover:shadow-xs transition-all active:scale-[0.98] min-h-[96px] shadow-2xs"
            >
              <div
                className={`size-10 sm:size-11 rounded-xl flex items-center justify-center ${act.bgColor} ${act.iconColor} ${act.borderColor} border mb-2 group-hover:scale-105 transition-transform shrink-0`}
              >
                <Icon className="size-5 sm:size-6" />
              </div>
              <span className="text-xs font-bold text-zinc-800 group-hover:text-[#D97757] transition-colors leading-tight">
                {act.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
