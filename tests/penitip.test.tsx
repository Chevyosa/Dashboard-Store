import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '@/lib/api';
import { formatRupiah, formatPercent } from '@/lib/format';
import { ConsignorStatusBadge } from '@/components/penitip/consignor-status-badge';
import { ConsignorMarginBadge } from '@/components/penitip/consignor-margin-badge';
import { ConsignorDialog } from '@/components/penitip/consignor-dialog';
import { ConsignorStatusDialog } from '@/components/penitip/consignor-status-dialog';
import PenitipPage from '@/app/(app)/penitip/page';

const mockConsignors: apiModule.Consignor[] = [
  {
    id: 1,
    name: 'Pak Sani',
    phone: '08123456789',
    note: 'Jadwal setor tiap Senin pagi',
    defaultMarginType: 'nominal',
    defaultMarginValue: '1000.0000',
    isActive: true,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Kak Peja',
    phone: null,
    note: null,
    defaultMarginType: 'percent',
    defaultMarginValue: '3.6500',
    isActive: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
  },
  {
    id: 3,
    name: 'Bu Dewi (Pensiun)',
    phone: '08987654321',
    note: 'Sudah tidak setor lagi',
    defaultMarginType: null,
    defaultMarginValue: null,
    isActive: false,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-20T00:00:00.000Z',
  },
];

describe('Penitip Format Utilities', () => {
  it('formats rupiah correctly without trailing zeroes', () => {
    expect(formatRupiah('1000.0000')).toBe('Rp 1.000');
    expect(formatRupiah('1500.5000')).toBe('Rp 1.500,5');
    expect(formatRupiah(null)).toBe('—');
  });

  it('formats percent correctly without trailing zeroes', () => {
    expect(formatPercent('3.6500')).toBe('3,65%');
    expect(formatPercent('10.0000')).toBe('10%');
    expect(formatPercent(null)).toBe('—');
  });
});

describe('Consignor Badges', () => {
  it('renders active and inactive status badges', () => {
    const { rerender } = render(<ConsignorStatusBadge isActive={true} />);
    expect(screen.getByText('Aktif')).toBeInTheDocument();

    rerender(<ConsignorStatusBadge isActive={false} />);
    expect(screen.getByText('Nonaktif')).toBeInTheDocument();
  });

  it('renders nominal margin badge with / pcs', () => {
    render(<ConsignorMarginBadge type="nominal" value="1000.0000" />);
    expect(screen.getByText('Rp 1.000')).toBeInTheDocument();
    expect(screen.getByText('/ pcs')).toBeInTheDocument();
  });

  it('renders percent margin badge', () => {
    render(<ConsignorMarginBadge type="percent" value="3.6500" />);
    expect(screen.getByText('3,65%')).toBeInTheDocument();
  });

  it('renders dash when no margin is configured', () => {
    render(<ConsignorMarginBadge type={null} value={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('ConsignorDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation error when submitting empty name', async () => {
    const user = userEvent.setup();
    render(
      <ConsignorDialog
        open={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        initialData={null}
      />
    );

    const submitBtn = screen.getByRole('button', { name: 'Tambah Penitip' });
    await user.click(submitBtn);

    expect(await screen.findByText('Nama penitip wajib diisi.')).toBeInTheDocument();
  });

  it('creates consignor with nominal margin', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const onClose = vi.fn();

    const createdData: apiModule.Consignor = {
      id: 4,
      name: 'Pak Budi',
      phone: '0811111111',
      note: 'Donat kentang',
      defaultMarginType: 'nominal',
      defaultMarginValue: '1500.0000',
      isActive: true,
      createdAt: '2026-10-04T00:00:00.000Z',
      updatedAt: '2026-10-04T00:00:00.000Z',
    };

    const spyCreate = vi.spyOn(apiModule, 'createConsignor').mockResolvedValue({
      data: createdData,
    });

    render(
      <ConsignorDialog
        open={true}
        onClose={onClose}
        onSaved={onSaved}
        initialData={null}
      />
    );

    await user.type(screen.getByLabelText(/Nama Penitip/i), 'Pak Budi');
    await user.type(screen.getByLabelText(/No. Telepon/i), '0811111111');
    await user.type(screen.getByLabelText(/Catatan/i), 'Donat kentang');

    // Click Nominal
    await user.click(screen.getByRole('button', { name: 'Nominal (Rp)' }));
    await user.type(screen.getByLabelText(/Margin Pemilik per Pcs/i), '1500');

    await user.click(screen.getByRole('button', { name: 'Tambah Penitip' }));

    await waitFor(() => {
      expect(spyCreate).toHaveBeenCalledWith({
        name: 'Pak Budi',
        phone: '0811111111',
        note: 'Donat kentang',
        defaultMarginType: 'nominal',
        defaultMarginValue: '1500',
      });
      expect(onSaved).toHaveBeenCalledWith(createdData);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('updates existing consignor', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const onClose = vi.fn();

    const initial = mockConsignors[0]!;
    const updatedData: apiModule.Consignor = {
      ...initial,
      name: 'Pak Sani (Updated)',
    };

    const spyUpdate = vi.spyOn(apiModule, 'updateConsignor').mockResolvedValue({
      data: updatedData,
    });

    render(
      <ConsignorDialog
        open={true}
        onClose={onClose}
        onSaved={onSaved}
        initialData={initial}
      />
    );

    expect(screen.getByDisplayValue('Pak Sani')).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/Nama Penitip/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Pak Sani (Updated)');

    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }));

    await waitFor(() => {
      expect(spyUpdate).toHaveBeenCalledWith(
        initial.id,
        expect.objectContaining({ name: 'Pak Sani (Updated)' })
      );
      expect(onSaved).toHaveBeenCalledWith(updatedData);
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe('ConsignorStatusDialog', () => {
  it('confirms deactivation and calls API', async () => {
    const user = userEvent.setup();
    const onStatusChanged = vi.fn();
    const onClose = vi.fn();

    const initial = mockConsignors[0]!; // isActive = true
    const updated: apiModule.Consignor = { ...initial, isActive: false };

    const spyStatus = vi.spyOn(apiModule, 'setConsignorStatus').mockResolvedValue({
      data: updated,
    });

    render(
      <ConsignorStatusDialog
        open={true}
        consignor={initial}
        onClose={onClose}
        onStatusChanged={onStatusChanged}
      />
    );

    expect(screen.getByText('Nonaktifkan Penitip?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ya, Nonaktifkan' }));

    await waitFor(() => {
      expect(spyStatus).toHaveBeenCalledWith(initial.id, false);
      expect(onStatusChanged).toHaveBeenCalledWith(updated);
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe('PenitipPage Full Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(apiModule, 'getConsignors').mockResolvedValue({
      data: mockConsignors,
      pagination: { page: 1, limit: 100, total: 3, totalPages: 1 },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders consignors list with KPI cards and table', async () => {
    render(<PenitipPage />);

    // Check KPIs
    expect(await screen.findByText('Total Penitip')).toBeInTheDocument();
    expect((await screen.findAllByText('Pak Sani')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Kak Peja')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Bu Dewi (Pensiun)')).length).toBeGreaterThan(0);
  });

  it('filters by status tabs', async () => {
    const user = userEvent.setup();
    render(<PenitipPage />);

    await screen.findAllByText('Pak Sani');

    // Click "Aktif" filter
    const activeTab = screen.getByRole('button', { name: /Aktif \(2\)/i });
    await user.click(activeTab);

    // Pak Sani and Kak Peja should be visible, Bu Dewi should not
    expect(screen.getAllByText('Pak Sani').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Kak Peja').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Bu Dewi (Pensiun)').length).toBe(0);

    // Click "Nonaktif" filter
    const inactiveTab = screen.getByRole('button', { name: /Nonaktif \(1\)/i });
    await user.click(inactiveTab);

    expect(screen.queryAllByText('Pak Sani').length).toBe(0);
    expect(screen.getAllByText('Bu Dewi (Pensiun)').length).toBeGreaterThan(0);
  });

  it('filters by search input', async () => {
    const user = userEvent.setup();
    render(<PenitipPage />);

    await screen.findAllByText('Pak Sani');

    const searchInput = screen.getByPlaceholderText(/Cari nama, nomor telepon/i);
    await user.type(searchInput, 'Peja');

    expect(screen.queryAllByText('Pak Sani').length).toBe(0);
    expect(screen.getAllByText('Kak Peja').length).toBeGreaterThan(0);
  });
});
