'use client';

import React, { useState } from 'react';
import type { AuditLogItem } from '@/lib/api';
import { AuditActionBadge } from './audit-action-badge';

interface AuditDetailDialogProps {
  log: AuditLogItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AuditDetailDialog({ log, isOpen, onClose }: AuditDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<'diff' | 'raw'>('diff');

  if (!isOpen || !log) return null;

  const beforeObj = log.before && typeof log.before === 'object' ? (log.before as Record<string, unknown>) : null;
  const afterObj = log.after && typeof log.after === 'object' ? (log.after as Record<string, unknown>) : null;

  // Compute union of keys for diffing
  const allKeys = Array.from(
    new Set([...(beforeObj ? Object.keys(beforeObj) : []), ...(afterObj ? Object.keys(afterObj) : [])])
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs">
      <div className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-lg bg-white shadow-xl border border-zinc-200 overflow-hidden max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
        <div className="w-12 h-1 bg-zinc-200 rounded-full mx-auto sm:hidden mt-2 -mb-1" />
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <h3 className="text-sm font-bold text-zinc-900">
              Riwayat Aktivitas #{log.id}
            </h3>
            <AuditActionBadge action={log.action} />
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 text-lg leading-none p-2 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 flex-1">
          {/* Metadata Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-zinc-50 p-3 sm:p-3.5 rounded-lg border border-zinc-200 text-xs">
            <div>
              <span className="block text-[10px] font-semibold text-zinc-500">Waktu</span>
              <span className="font-mono text-zinc-900 text-[11px] sm:text-xs">{log.createdAt}</span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-zinc-500">Pengguna</span>
              <span className="font-medium text-zinc-900">{log.username ?? '—'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-zinc-500">Target Entitas</span>
              <span className="text-zinc-900 font-medium">
                {log.entityType ?? '—'} {log.entityId ? `(#${log.entityId})` : ''}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-zinc-500">Alamat IP</span>
              <span className="font-mono text-zinc-900">{log.ip ?? '127.0.0.1'}</span>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex border-b border-zinc-200">
            <button
              onClick={() => setActiveTab('diff')}
              className={`px-3 sm:px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'diff'
                  ? 'border-[#D97757] text-[#D97757]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Perbandingan Data (Snapshot)
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-3 sm:px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'raw'
                  ? 'border-[#D97757] text-[#D97757]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Payload JSON Asli
            </button>
          </div>

          {/* Tab 1: Diff Comparison */}
          {activeTab === 'diff' && (
            <div className="space-y-4">
              {!allKeys.length ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  Tidak ada payload data snapshot sebelum dan sesudah untuk aksi ini.
                </div>
              ) : (
                <div className="border border-zinc-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-zinc-200 min-w-[420px]">
                    <thead className="bg-zinc-50 text-[11px] font-semibold text-zinc-600">
                      <tr>
                        <th className="px-3 py-2 w-1/3">Field / Kolom</th>
                        <th className="px-3 py-2 w-1/3 bg-rose-50/50 text-rose-900">Sebelum (Before)</th>
                        <th className="px-3 py-2 w-1/3 bg-emerald-50/50 text-emerald-900">Sesudah (After)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-mono text-[11px]">
                      {allKeys.map((key) => {
                        const beforeVal = beforeObj ? beforeObj[key] : undefined;
                        const afterVal = afterObj ? afterObj[key] : undefined;
                        const isChanged = JSON.stringify(beforeVal) !== JSON.stringify(afterVal);

                        return (
                          <tr key={key} className={isChanged ? 'bg-amber-50/30' : ''}>
                            <td className="px-3 py-2 font-sans font-medium text-zinc-700">{key}</td>
                            <td className="px-3 py-2 text-rose-700 bg-rose-50/30 truncate max-w-[140px] sm:max-w-[180px]">
                              {beforeVal !== undefined ? JSON.stringify(beforeVal) : '—'}
                            </td>
                            <td className="px-3 py-2 text-emerald-700 bg-emerald-50/30 truncate max-w-[140px] sm:max-w-[180px]">
                              {afterVal !== undefined ? JSON.stringify(afterVal) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Raw JSON */}
          {activeTab === 'raw' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-700">Before JSON:</span>
                <pre className="rounded bg-zinc-900 p-3 text-[11px] text-zinc-100 font-mono overflow-x-auto max-h-48">
                  {log.before ? JSON.stringify(log.before, null, 2) : 'null'}
                </pre>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-700">After JSON:</span>
                <pre className="rounded bg-zinc-900 p-3 text-[11px] text-zinc-100 font-mono overflow-x-auto max-h-48">
                  {log.after ? JSON.stringify(log.after, null, 2) : 'null'}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 px-4 sm:px-6 py-3 bg-zinc-50 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 sm:py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 shadow-2xs min-h-[36px]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
