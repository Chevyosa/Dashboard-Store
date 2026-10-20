'use client';

import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/format';
import type { Product } from '@/lib/api';
import { ProductOwnerBadge } from './product-owner-badge';
import { ConsignorStatusBadge } from '@/components/penitip/consignor-status-badge';

interface Props {
  product: Product;
  onEdit: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
}

export function ProductCard({ product, onEdit, onToggleStatus }: Props) {
  const isConsignor = product.ownerType === 'consignor';

  return (
    <div className="rounded-xl bg-white border border-zinc-200 p-4 shadow-xs space-y-3">
      {/* Header: Name, Ownership, Status */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm text-zinc-900 leading-snug">{product.name}</h3>
          <ConsignorStatusBadge isActive={product.isActive} />
        </div>
        <div className="flex items-center gap-2">
          <ProductOwnerBadge
            ownerType={product.ownerType}
            consignorName={product.consignorName}
          />
        </div>
      </div>

      {/* Pricing & Margin Details */}
      <div className="pt-2 border-t border-zinc-100 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Harga Jual:</span>
          <span className="font-mono font-bold text-zinc-900 text-sm">
            {formatRupiah(product.sellPrice)} <span className="font-sans text-[11px] font-normal text-zinc-400">/ pcs</span>
          </span>
        </div>

        {isConsignor ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Untung Pemilik:</span>
              <span className="font-mono font-semibold text-[#D97757]">
                {formatRupiah(product.marginInfo.ownerMarginPerPcs)}{' '}
                <span className="font-sans text-[10px] text-zinc-400">/ pcs</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Hak Penitip:</span>
              <span className="font-mono font-semibold text-zinc-800">
                {formatRupiah(product.marginInfo.consignorSharePerPcs)}{' '}
                <span className="font-sans text-[10px] text-zinc-400">/ pcs</span>
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between text-zinc-400 italic text-[11px]">
            <span>Untung (Margin):</span>
            <span>Dihitung saat opname</span>
          </div>
        )}
      </div>

      {/* Mobile Action Buttons (Min 44px height) */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100">
        <Button
          type="button"
          variant="outline"
          onClick={() => onEdit(product)}
          className="h-11 text-xs font-medium text-zinc-700 hover:text-zinc-900 border-zinc-200"
        >
          Ubah Data
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onToggleStatus(product)}
          className={`h-11 text-xs font-medium ${
            product.isActive
              ? 'text-zinc-500 hover:text-red-600 hover:bg-red-50'
              : 'text-emerald-600 hover:bg-emerald-50'
          }`}
        >
          {product.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        </Button>
      </div>
    </div>
  );
}
