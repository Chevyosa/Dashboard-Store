import { formatRupiah } from '@/lib/format';
import type { ProductMarginInfo } from '@/lib/api';

interface Props {
  ownerType: 'own' | 'consignor';
  pcsPerPack?: number;
  marginInfo: ProductMarginInfo | null;
}

export function ProductMarginPreview({ ownerType, pcsPerPack = 1, marginInfo }: Props) {
  if (ownerType === 'own') {
    if (marginInfo && marginInfo.ownerMarginPerPcs) {
      return (
        <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 font-medium">Margin Pemilik:</span>
            <span className="font-mono font-semibold text-zinc-900">
              {formatRupiah(marginInfo.ownerMarginPerPcs)} <span className="font-sans text-[10px] text-zinc-500">/ pcs</span>
            </span>
          </div>
          {pcsPerPack > 1 && marginInfo.ownerMarginPerPack && (
            <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 text-[11px]">
              <span className="text-zinc-400">Per Pack ({pcsPerPack} pcs):</span>
              <span className="font-mono text-zinc-700">
                {formatRupiah(marginInfo.ownerMarginPerPack)}
              </span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="rounded-lg bg-zinc-50/75 border border-dashed border-zinc-200 p-3 text-xs text-zinc-500">
        <p className="leading-relaxed">
          Modal beli & untung produk milik sendiri dihitung otomatis secara periodik (*weighted average*) dari transaksi belanja saat opname mingguan.
        </p>
      </div>
    );
  }

  // Consignor product
  if (!marginInfo || !marginInfo.ownerMarginPerPcs) {
    return (
      <div className="rounded-lg bg-zinc-50 border border-dashed border-zinc-200 p-3 text-xs text-zinc-400 text-center">
        Pilih skema margin dan isi nominal/persen untuk melihat rincian bagi hasil.
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-orange-50/40 border border-orange-200/80 p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-zinc-600 font-medium">Untung Pemilik (Margin):</span>
        <span className="font-mono font-bold text-[#D97757]">
          {formatRupiah(marginInfo.ownerMarginPerPcs)}{' '}
          <span className="font-sans font-normal text-[10px] text-zinc-500">/ pcs</span>
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-zinc-600 font-medium">Hak Penitip (Harga Setor):</span>
        <span className="font-mono font-bold text-zinc-900">
          {formatRupiah(marginInfo.consignorSharePerPcs)}{' '}
          <span className="font-sans font-normal text-[10px] text-zinc-500">/ pcs</span>
        </span>
      </div>

      {pcsPerPack > 1 && marginInfo.ownerMarginPerPack && (
        <div className="pt-1.5 border-t border-orange-200/50 flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">Margin Per Pack ({pcsPerPack} pcs):</span>
          <span className="font-mono text-[#D97757] font-semibold">
            {formatRupiah(marginInfo.ownerMarginPerPack)}
          </span>
        </div>
      )}
    </div>
  );
}
