import type { LossReason } from '@/lib/api';

interface Props {
  reason: LossReason;
  className?: string;
}

export const LOSS_REASON_LABELS: Record<LossReason, string> = {
  expired: 'Kadaluwarsa',
  damaged_on_display: 'Rusak di Etalase',
  damaged_before_display: 'Rusak Sebelum Dipajang',
  lost: 'Hilang',
  other: 'Lainnya',
};

export function LossReasonBadge({ reason, className = '' }: Props) {
  const label = LOSS_REASON_LABELS[reason] ?? reason;

  let colorClasses = 'bg-zinc-100 text-zinc-700 border-zinc-200';

  switch (reason) {
    case 'expired':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
      break;
    case 'damaged_on_display':
      colorClasses = 'bg-rose-50 text-rose-800 border-rose-200';
      break;
    case 'damaged_before_display':
      colorClasses = 'bg-purple-50 text-purple-800 border-purple-200';
      break;
    case 'lost':
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
      break;
    case 'other':
    default:
      colorClasses = 'bg-zinc-100 text-zinc-700 border-zinc-200';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${colorClasses} ${className}`}
    >
      {label}
    </span>
  );
}
