import React from 'react';
import { formatRupiah } from '@/lib/format';
import type { DashboardTopProduct } from '@/lib/api';

interface TopProductsCardProps {
  products: DashboardTopProduct[];
}

export function TopProductsCard({ products }: TopProductsCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <h3 className="text-sm font-semibold text-zinc-900">
          Produk Paling Laris
        </h3>
        <span className="text-[11px] text-zinc-500">
          Berdasarkan omset periode opname
        </span>
      </div>

      {!products.length ? (
        <div className="py-6 text-center text-xs text-zinc-400">
          Belum ada produk terjual yang tercatat.
        </div>
      ) : (
        <div className="divide-y divide-zinc-100">
          {products.map((p, idx) => (
            <div key={p.productId} className="flex items-center justify-between py-2.5">
              <div className="flex items-center space-x-3">
                <span className="flex size-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600 font-mono">
                  {idx + 1}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-zinc-900">{p.name}</span>
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-semibold ${
                        p.ownerType === 'own'
                          ? 'bg-[#FDF6F3] text-[#D97757]'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {p.ownerType === 'own' ? 'Own' : 'Titipan'}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {p.soldQty} unit terjual
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-zinc-900 font-sans">
                  {formatRupiah(p.turnover)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
