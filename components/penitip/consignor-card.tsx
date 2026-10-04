'use client';

import { Button } from '@/components/ui/button';
import type { Consignor } from '@/lib/api';
import { ConsignorStatusBadge } from './consignor-status-badge';
import { ConsignorMarginBadge } from './consignor-margin-badge';

interface Props {
  consignor: Consignor;
  onEdit: (consignor: Consignor) => void;
  onToggleStatus: (consignor: Consignor) => void;
}

export function ConsignorCard({ consignor, onEdit, onToggleStatus }: Props) {
  // Clean phone number for WhatsApp link
  const rawPhone = consignor.phone?.replace(/[^0-9]/g, '') ?? '';
  const waNumber = rawPhone.startsWith('0') ? `62${rawPhone.slice(1)}` : rawPhone;

  return (
    <div className="rounded-xl bg-white border border-zinc-200 p-4 shadow-xs space-y-3">
      {/* Header: Name and Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sm text-zinc-900 truncate">{consignor.name}</h3>
          {consignor.phone && (
            <div className="mt-1 flex items-center gap-2">
              <a
                href={`tel:${consignor.phone}`}
                className="text-xs font-mono text-zinc-600 hover:text-zinc-900 flex items-center gap-1 min-h-[32px] py-1"
              >
                <span>📞</span>
                <span>{consignor.phone}</span>
              </a>
              {rawPhone && (
                <a
                  href={`https://wa.me/${waNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-medium text-emerald-600 hover:underline min-h-[32px] flex items-center px-1"
                >
                  WhatsApp ↗
                </a>
              )}
            </div>
          )}
        </div>
        <ConsignorStatusBadge isActive={consignor.isActive} />
      </div>

      {/* Details: Margin Default & Note */}
      <div className="grid grid-cols-1 gap-2 pt-2 border-t border-zinc-100 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Margin Default:</span>
          <ConsignorMarginBadge
            type={consignor.defaultMarginType}
            value={consignor.defaultMarginValue}
          />
        </div>

        {consignor.note && (
          <div className="pt-1">
            <span className="text-zinc-400 text-[11px] block">Catatan:</span>
            <p className="text-zinc-600 text-xs italic bg-zinc-50 p-2 rounded border border-zinc-100 mt-0.5">
              {consignor.note}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons: Min 44px height for mobile ergonomics */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100">
        <Button
          type="button"
          variant="outline"
          onClick={() => onEdit(consignor)}
          className="h-11 text-xs font-medium text-zinc-700 hover:text-zinc-900 border-zinc-200"
        >
          Ubah Data
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onToggleStatus(consignor)}
          className={`h-11 text-xs font-medium ${
            consignor.isActive
              ? 'text-zinc-500 hover:text-red-600 hover:bg-red-50'
              : 'text-emerald-600 hover:bg-emerald-50'
          }`}
        >
          {consignor.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        </Button>
      </div>
    </div>
  );
}
