import { formatPercent, formatRupiah } from '@/lib/format';

interface Props {
  type: 'nominal' | 'percent' | null;
  value: string | null;
}

export function ConsignorMarginBadge({ type, value }: Props) {
  if (!type || !value) {
    return <span className="text-zinc-400 text-xs font-mono">—</span>;
  }

  if (type === 'nominal') {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
        <span>{formatRupiah(value)}</span>
        <span className="text-[10px] text-zinc-500 font-sans">/ pcs</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center font-mono text-xs font-semibold text-[#D97757] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
      {formatPercent(value)}
    </span>
  );
}
