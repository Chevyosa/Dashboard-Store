'use client';

import React from 'react';
import type { AuditLogItem } from '@/lib/api';
import { AuditActionBadge } from './audit-action-badge';

interface AuditCardProps {
  log: AuditLogItem;
  onSelect: (log: AuditLogItem) => void;
}

export function AuditCard({ log, onSelect }: AuditCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs space-y-2.5">
      {/* Top row: Timestamp & Action Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-zinc-500">
          {log.createdAt}
        </span>
        <AuditActionBadge action={log.action} />
      </div>

      {/* Middle row: User & Entity */}
      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] text-zinc-400 block">Pengguna</span>
          <span className="font-medium text-zinc-900 font-mono">
            {log.username || 'System'}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-zinc-400 block">Entitas</span>
          <span className="font-mono font-medium text-zinc-700">
            {log.entityType ? `${log.entityType} #${log.entityId || ''}` : '—'}
          </span>
        </div>
      </div>

      {/* Footer: IP & Detail Button */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-[11px] text-zinc-500">
        <span className="font-mono">IP: {log.ip || '127.0.0.1'}</span>

        <button
          type="button"
          onClick={() => onSelect(log)}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 transition-colors"
        >
          Lihat Rincian
        </button>
      </div>
    </div>
  );
}
