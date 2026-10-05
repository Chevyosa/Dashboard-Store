'use client';

import type { OpnameRecord } from '@/lib/api';

interface Props {
  status: OpnameRecord['status'];
}

export function OpnameStatusBadge({ status }: Props) {
  if (status === 'draft') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
        Draf
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
      <span className="size-1.5 rounded-full bg-emerald-600" />
      Final
    </span>
  );
}
