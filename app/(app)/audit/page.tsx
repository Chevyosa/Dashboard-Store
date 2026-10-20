'use client';

import React, { useEffect, useState } from 'react';
import {
  getAuditLogs,
  getAuditLogFilters,
  type AuditLogItem,
} from '@/lib/api';
import { AuditFilters } from '@/components/audit/audit-filters';
import { AuditTable } from '@/components/audit/audit-table';
import { AuditDetailDialog } from '@/components/audit/audit-detail-dialog';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter options
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [availableEntityTypes, setAvailableEntityTypes] = useState<string[]>([]);

  // Filter state
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Detail Modal state
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch filter options once
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await getAuditLogFilters();
        setAvailableActions(res.data.actions);
        setAvailableEntityTypes(res.data.entityTypes);
      } catch {
        // silent fallback if filter loading fails
      }
    };
    fetchFilters();
  }, []);

  // Fetch audit logs on filter or page change
  const fetchLogs = async (targetPage = page) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAuditLogs({
        page: targetPage,
        limit: 20,
        action: selectedAction || undefined,
        entityType: selectedEntityType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchTerm.trim() || undefined,
      });
      setLogs(res.data);
      setPage(res.pagination.page);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat catatan audit.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page, selectedAction, selectedEntityType, startDate, endDate, searchTerm]);

  const handleResetFilters = () => {
    setSelectedAction('');
    setSelectedEntityType('');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setPage(1);
  };

  const handleSelectLog = (log: AuditLogItem) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">
          Riwayat Aktivitas Toko
        </h1>
        <p className="text-xs text-zinc-500">
          Jejak rekam transparan mutasi harga, stok, kerugian (loss), pembayaran penitip, dan opname fisik.
        </p>
      </div>

      {/* Filter Bar */}
      <AuditFilters
        actions={availableActions}
        entityTypes={availableEntityTypes}
        selectedAction={selectedAction}
        selectedEntityType={selectedEntityType}
        startDate={startDate}
        endDate={endDate}
        searchTerm={searchTerm}
        onActionChange={(a) => {
          setSelectedAction(a);
          setPage(1);
        }}
        onEntityTypeChange={(e) => {
          setSelectedEntityType(e);
          setPage(1);
        }}
        onStartDateChange={(d) => {
          setStartDate(d);
          setPage(1);
        }}
        onEndDateChange={(d) => {
          setEndDate(d);
          setPage(1);
        }}
        onSearchChange={(s) => {
          setSearchTerm(s);
          setPage(1);
        }}
        onReset={handleResetFilters}
      />

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Audit Log Table */}
      <AuditTable
        logs={logs}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={(p) => setPage(p)}
        onSelectLog={handleSelectLog}
      />

      {/* Detail Dialog */}
      <AuditDetailDialog
        log={selectedLog}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
