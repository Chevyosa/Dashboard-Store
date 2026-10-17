import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '@/lib/api';
import { AuditActionBadge } from '@/components/audit/audit-action-badge';
import { AuditTable } from '@/components/audit/audit-table';
import { AuditDetailDialog } from '@/components/audit/audit-detail-dialog';
import AuditPage from '@/app/(app)/audit/page';

const mockLogs: apiModule.AuditLogItem[] = [
  {
    id: 1,
    userId: 1,
    username: 'owner',
    action: 'product.created',
    entityType: 'product',
    entityId: '10',
    before: null,
    after: { name: 'Gery Salut', sellPrice: '1500.0000' },
    ip: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    createdAt: '2026-10-02 10:30:00',
  },
  {
    id: 2,
    userId: 1,
    username: 'owner',
    action: 'opname.finalized',
    entityType: 'opname',
    entityId: '1',
    before: null,
    after: { opnameDate: '2026-10-02', status: 'final' },
    ip: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    createdAt: '2026-10-02 17:00:00',
  },
];

describe('AuditActionBadge', () => {
  it('renders human-readable labels for audit actions', () => {
    const { rerender } = render(<AuditActionBadge action="product.created" />);
    expect(screen.getByText('Tambah Produk')).toBeInTheDocument();

    rerender(<AuditActionBadge action="opname.finalized" />);
    expect(screen.getByText('Finalisasi Opname')).toBeInTheDocument();

    rerender(<AuditActionBadge action="loss.created" />);
    expect(screen.getByText('Catat Kerugian / Loss')).toBeInTheDocument();
  });
});

describe('AuditTable', () => {
  it('renders log rows with user, action, and timestamp', () => {
    const onSelect = vi.fn();
    render(
      <AuditTable
        logs={mockLogs}
        isLoading={false}
        page={1}
        totalPages={1}
        total={2}
        onPageChange={vi.fn()}
        onSelectLog={onSelect}
      />
    );

    expect(screen.getAllByText('Tambah Produk').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Finalisasi Opname').length).toBeGreaterThan(0);
    expect(screen.getAllByText('owner').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('2026-10-02 10:30:00').length).toBeGreaterThan(0);
  });

  it('handles empty log state gracefully', () => {
    render(
      <AuditTable
        logs={[]}
        isLoading={false}
        page={1}
        totalPages={1}
        total={0}
        onPageChange={vi.fn()}
        onSelectLog={vi.fn()}
      />
    );

    expect(screen.getByText('Tidak ada catatan aktivitas yang cocok.')).toBeInTheDocument();
  });
});

describe('AuditDetailDialog', () => {
  it('renders snapshot diff and closes upon clicking close button', async () => {
    const onClose = vi.fn();
    render(
      <AuditDetailDialog
        log={mockLogs[0] ?? null}
        isOpen={true}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Riwayat Aktivitas #1')).toBeInTheDocument();
    expect(screen.getByText('Perbandingan Data (Snapshot)')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('"Gery Salut"')).toBeInTheDocument();

    const closeBtn = screen.getByText('✕');
    await userEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('AuditPage', () => {
  beforeEach(() => {
    vi.spyOn(apiModule, 'getAuditLogs').mockResolvedValue({
      data: mockLogs,
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      },
    });

    vi.spyOn(apiModule, 'getAuditLogFilters').mockResolvedValue({
      data: {
        actions: ['product.created', 'opname.finalized'],
        entityTypes: ['product', 'opname'],
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and renders the audit page with filters and table', async () => {
    render(<AuditPage />);

    await waitFor(() => {
      expect(screen.getByText('Riwayat Aktivitas Toko')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Tambah Produk').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Finalisasi Opname').length).toBeGreaterThanOrEqual(1);
  });
});
