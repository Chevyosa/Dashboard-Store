'use client';

import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/format';
import type { Product } from '@/lib/api';
import { ProductOwnerBadge } from './product-owner-badge';
import { ConsignorStatusBadge } from '@/components/penitip/consignor-status-badge';

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
}

export function ProductTable({ products, onEdit, onToggleStatus }: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">Nama Produk</th>
              <th className="py-3.5 px-4">Kepemilikan</th>
              <th className="py-3.5 px-4 text-right">Harga Jual / pcs</th>
              <th className="py-3.5 px-4 text-right">Untung Pemilik</th>
              <th className="py-3.5 px-4 text-right">Hak Penitip</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {products.map((p) => {
              const isConsignor = p.ownerType === 'consignor';

              return (
                <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                  {/* Name */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-zinc-900">{p.name}</div>
                  </td>

                  {/* Ownership Badge */}
                  <td className="py-3.5 px-4">
                    <ProductOwnerBadge
                      ownerType={p.ownerType}
                      consignorName={p.consignorName}
                    />
                  </td>

                  {/* Sell Price */}
                  <td className="py-3.5 px-4 text-right font-mono font-medium text-zinc-900">
                    {formatRupiah(p.sellPrice)}
                  </td>

                  {/* Owner Margin */}
                  <td className="py-3.5 px-4 text-right">
                    {isConsignor ? (
                      <span className="font-mono font-semibold text-[#D97757]">
                        {formatRupiah(p.marginInfo.ownerMarginPerPcs)}
                      </span>
                    ) : (
                      <span className="text-zinc-400 italic text-[11px]">—</span>
                    )}
                  </td>

                  {/* Consignor Share */}
                  <td className="py-3.5 px-4 text-right">
                    {isConsignor ? (
                      <span className="font-mono font-medium text-zinc-700">
                        {formatRupiah(p.marginInfo.consignorSharePerPcs)}
                      </span>
                    ) : (
                      <span className="text-zinc-400 italic text-[11px]">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    <ConsignorStatusBadge isActive={p.isActive} />
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(p)}
                        className="h-7 px-2.5 text-xs text-zinc-700 hover:text-zinc-900 border-zinc-200"
                      >
                        Ubah
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleStatus(p)}
                        className={`h-7 px-2.5 text-xs ${
                          p.isActive
                            ? 'text-zinc-400 hover:text-red-600 hover:bg-red-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {p.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
