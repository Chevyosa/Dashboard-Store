import React from 'react';
import type { AuditLogItem } from '@/lib/api';
import { AuditActionBadge } from './audit-action-badge';
import { AuditCard } from './audit-card';

interface AuditTableProps {
  logs: AuditLogItem[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (newPage: number) => void;
  onSelectLog: (log: AuditLogItem) => void;
}

export function AuditTable({
  logs,
  isLoading,
  page,
  totalPages,
  total,
  onPageChange,
  onSelectLog,
}: AuditTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-xs space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-zinc-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center shadow-xs space-y-2">
        <p className="text-sm font-semibold text-zinc-700">Tidak ada catatan aktivitas yang cocok.</p>
        <p className="text-xs text-zinc-500">Cobalah mengubah atau mereset filter di atas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-semibold text-zinc-600">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Pengguna</th>
                <th className="px-4 py-3">Tindakan</th>
                <th className="px-4 py-3">Entitas</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono text-zinc-600 whitespace-nowrap">
                    {log.createdAt}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900 whitespace-nowrap">
                    {log.username ?? '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <AuditActionBadge action={log.action} />
                  </td>
                  <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                    {log.entityType ? (
                      <span className="font-mono">
                        {log.entityType} {log.entityId ? `(#${log.entityId})` : ''}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-500 whitespace-nowrap">
                    {log.ip ?? '127.0.0.1'}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => onSelectLog(log)}
                      className="rounded border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 shadow-2xs"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-2.5">
        {logs.map((log) => (
          <AuditCard key={log.id} log={log} onSelect={onSelectLog} />
        ))}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border border-zinc-200 rounded-lg bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
        <div>
          Menampilkan <span className="font-semibold text-zinc-900">{logs.length}</span> dari{' '}
          <span className="font-semibold text-zinc-900">{total}</span> aktivitas
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <span className="text-xs font-mono text-zinc-600">
            Hal. {page} dari {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 disabled:opacity-40"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}
