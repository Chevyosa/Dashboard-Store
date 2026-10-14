import React from 'react';
import { formatActionLabel } from './audit-action-badge';

interface AuditFiltersProps {
  actions: string[];
  entityTypes: string[];
  selectedAction: string;
  selectedEntityType: string;
  startDate: string;
  endDate: string;
  searchTerm: string;
  onActionChange: (action: string) => void;
  onEntityTypeChange: (entityType: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onSearchChange: (search: string) => void;
  onReset: () => void;
}

export function AuditFilters({
  actions,
  entityTypes,
  selectedAction,
  selectedEntityType,
  startDate,
  endDate,
  searchTerm,
  onActionChange,
  onEntityTypeChange,
  onStartDateChange,
  onEndDateChange,
  onSearchChange,
  onReset,
}: AuditFiltersProps) {
  const hasActiveFilter =
    selectedAction !== '' ||
    selectedEntityType !== '' ||
    startDate !== '' ||
    endDate !== '' ||
    searchTerm !== '';

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div>
          <label htmlFor="search-input" className="block text-[11px] font-semibold text-zinc-600 mb-1">
            Cari Aktivitas
          </label>
          <input
            id="search-input"
            type="text"
            placeholder="Username, IP, ID..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-[#D97757] focus:outline-hidden"
          />
        </div>

        {/* Action Filter */}
        <div>
          <label htmlFor="action-select" className="block text-[11px] font-semibold text-zinc-600 mb-1">
            Jenis Tindakan
          </label>
          <select
            id="action-select"
            value={selectedAction}
            onChange={(e) => onActionChange(e.target.value)}
            className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-[#D97757] focus:outline-hidden"
          >
            <option value="">Semua Tindakan</option>
            {actions.map((act) => (
              <option key={act} value={act}>
                {formatActionLabel(act)}
              </option>
            ))}
          </select>
        </div>

        {/* Entity Type Filter */}
        <div>
          <label htmlFor="entity-select" className="block text-[11px] font-semibold text-zinc-600 mb-1">
            Tipe Entitas
          </label>
          <select
            id="entity-select"
            value={selectedEntityType}
            onChange={(e) => onEntityTypeChange(e.target.value)}
            className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-[#D97757] focus:outline-hidden"
          >
            <option value="">Semua Entitas</option>
            {entityTypes.map((ent) => (
              <option key={ent} value={ent}>
                {ent.charAt(0).toUpperCase() + ent.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="start-date" className="block text-[11px] font-semibold text-zinc-600 mb-1">
            Dari Tanggal
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-[#D97757] focus:outline-hidden"
          />
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="end-date" className="block text-[11px] font-semibold text-zinc-600 mb-1">
            Sampai Tanggal
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-[#D97757] focus:outline-hidden"
          />
        </div>
      </div>

      {hasActiveFilter && (
        <div className="flex justify-end pt-1">
          <button
            onClick={onReset}
            className="text-xs text-[#D97757] hover:underline font-medium"
          >
            Reset Semua Filter
          </button>
        </div>
      )}
    </div>
  );
}
