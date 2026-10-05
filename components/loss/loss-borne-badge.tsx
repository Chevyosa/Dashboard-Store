import type { LossBorneBy } from '@/lib/api';

interface Props {
  borneBy: LossBorneBy;
  consignorName?: string | null;
  className?: string;
}

export function LossBorneBadge({ borneBy, consignorName, className = '' }: Props) {
  if (borneBy === 'owner') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-900 border border-zinc-300 ${className}`}
      >
        <span className="size-1.5 rounded-full bg-zinc-600" />
        Ditanggung: Aku (Owner)
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-orange-50 text-[#D97757] border border-orange-200 ${className}`}
    >
      <span className="size-1.5 rounded-full bg-[#D97757]" />
      Ditanggung: Penitip {consignorName ? `(${consignorName})` : ''}
    </span>
  );
}
