'use client';

import { Button } from '@/components/ui/button';
import type { Consignor } from '@/lib/api';
import { ConsignorStatusBadge } from './consignor-status-badge';
import { ConsignorMarginBadge } from './consignor-margin-badge';

interface Props {
  consignors: Consignor[];
  onEdit: (consignor: Consignor) => void;
  onToggleStatus: (consignor: Consignor) => void;
}

export function ConsignorTable({ consignors, onEdit, onToggleStatus }: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">Nama Penitip</th>
              <th className="py-3.5 px-4">Kontak / Telepon</th>
              <th className="py-3.5 px-4">Margin Default</th>
              <th className="py-3.5 px-4">Catatan</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {consignors.map((c) => {
              const rawPhone = c.phone?.replace(/[^0-9]/g, '') ?? '';
              const waNumber = rawPhone.startsWith('0') ? `62${rawPhone.slice(1)}` : rawPhone;

              return (
                <tr key={c.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-zinc-900">
                    {c.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-600">
                    {c.phone ? (
                      <div className="flex items-center gap-2">
                        <span>{c.phone}</span>
                        {rawPhone && (
                          <a
                            href={`https://wa.me/${waNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-600 hover:underline font-sans"
                            title="Chat via WhatsApp"
                          >
                            WA ↗
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-400 font-mono">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <ConsignorMarginBadge
                      type={c.defaultMarginType}
                      value={c.defaultMarginValue}
                    />
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-zinc-500" title={c.note ?? ''}>
                    {c.note || <span className="text-zinc-300 font-mono">—</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <ConsignorStatusBadge isActive={c.isActive} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(c)}
                        className="h-7 px-2.5 text-xs text-zinc-700 hover:text-zinc-900 border-zinc-200"
                      >
                        Ubah
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleStatus(c)}
                        className={`h-7 px-2.5 text-xs ${
                          c.isActive
                            ? 'text-zinc-400 hover:text-red-600 hover:bg-red-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {c.isActive ? 'Nonaktifkan' : 'Aktifkan'}
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
