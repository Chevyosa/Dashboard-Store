import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '@/lib/api';
import LossPage from '@/app/(app)/loss/page';
import { LossDialog } from '@/components/loss/loss-dialog';

const mockProducts: apiModule.Product[] = [
  {
    id: 1,
    name: 'Gery Salut',
    ownerType: 'own',
    consignorId: null,
    consignorName: null,
    pcsPerPack: 10,
    sellPrice: '1500.0000',
    marginType: null,
    marginValue: null,
    isActive: true,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    marginInfo: {
      ownerMarginPerPcs: null,
      ownerMarginPerPack: null,
      consignorSharePerPcs: null,
      consignorSharePerPack: null,
    },
  },
  {
    id: 2,
    name: 'Lemper Ayam Pak Sani',
    ownerType: 'consignor',
    consignorId: 10,
    consignorName: 'Pak Sani',
    pcsPerPack: 1,
    sellPrice: '7000.0000',
    marginType: 'nominal',
    marginValue: '1000.0000',
    isActive: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    marginInfo: {
      ownerMarginPerPcs: '1000.0000',
      ownerMarginPerPack: '1000.0000',
      consignorSharePerPcs: '6000.0000',
      consignorSharePerPack: '6000.0000',
    },
  },
];

const mockLosses: apiModule.LossRecord[] = [
  {
    id: 101,
    productId: 1,
    productName: 'Gery Salut',
    ownerType: 'own',
    consignorId: null,
    consignorName: null,
    sellPrice: '1500.0000',
    marginType: null,
    marginValue: null,
    qtyPcs: 1,
    reason: 'lost',
    borneBy: 'owner',
    date: '2026-10-04',
    note: 'Hilang di rak',
    opnameId: null,
    createdAt: '2026-10-04T00:00:00.000Z',
    updatedAt: '2026-10-04T00:00:00.000Z',
  },
  {
    id: 102,
    productId: 2,
    productName: 'Lemper Ayam Pak Sani',
    ownerType: 'consignor',
    consignorId: 10,
    consignorName: 'Pak Sani',
    sellPrice: '7000.0000',
    marginType: 'nominal',
    marginValue: '1000.0000',
    qtyPcs: 2,
    reason: 'expired',
    borneBy: 'consignor',
    date: '2026-10-04',
    note: 'Kadaluwarsa',
    opnameId: null,
    createdAt: '2026-10-04T00:00:00.000Z',
    updatedAt: '2026-10-04T00:00:00.000Z',
  },
];

const mockSummary: apiModule.LossSummary = {
  totalPcs: 3,
  totalRecords: 2,
  totalOwnerBornePcs: 1,
  totalConsignorBornePcs: 2,
  breakdownByReason: {
    expired: 2,
    damaged_on_display: 0,
    damaged_before_display: 0,
    lost: 1,
    other: 0,
  },
};

describe('Loss Frontend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(apiModule, 'getLosses').mockResolvedValue({
      data: mockLosses,
      pagination: { page: 1, limit: 100, total: 2, totalPages: 1 },
    });
    vi.spyOn(apiModule, 'getProducts').mockResolvedValue({
      data: mockProducts,
      pagination: { page: 1, limit: 100, total: 2, totalPages: 1 },
    });
    vi.spyOn(apiModule, 'getOpenPeriodLossSummary').mockResolvedValue({
      data: mockSummary,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('LossPage', () => {
    it('renders KPI summary cards and table rows', async () => {
      render(<LossPage />);

      await waitFor(() => {
        expect(screen.getByText('Barang Rusak & Hilang (Loss)')).toBeInTheDocument();
      });

      // Verify KPIs
      expect(screen.getAllByText('3 pcs').length).toBeGreaterThan(0);
      expect(screen.getAllByText('1 pcs').length).toBeGreaterThan(0);
      expect(screen.getAllByText('2 pcs').length).toBeGreaterThan(0);

      // Verify Table Rows
      expect(screen.getAllByText('Gery Salut').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Lemper Ayam Pak Sani').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Ditanggung: Aku (Owner)').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Ditanggung: Penitip/i).length).toBeGreaterThan(0);
    });

    it('opens create dialog when clicking + Catat Loss Baru button', async () => {
      const user = userEvent.setup();
      render(<LossPage />);

      await waitFor(() => {
        expect(screen.getByText('Barang Rusak & Hilang (Loss)')).toBeInTheDocument();
      });

      const addBtn = screen.getByRole('button', { name: /\+ Catat Loss Baru/i });
      await user.click(addBtn);

      expect(screen.getByText('Catat Barang Rusak / Hilang (Loss)')).toBeInTheDocument();
    });
  });

  describe('LossDialog', () => {
    it('locks borneBy to owner when product is Own', () => {
      const onClose = vi.fn();
      const onSaved = vi.fn();

      render(
        <LossDialog
          open={true}
          onClose={onClose}
          onSaved={onSaved}
          products={mockProducts}
        />,
      );

      // Product #1 is Gery Salut (Own)
      expect(screen.getByText(/Terkunci: Produk milik sendiri ditanggung Owner/i)).toBeInTheDocument();

      // Consignor button should be disabled
      const consignorBtn = screen.getByRole('button', { name: /Penitip/i });
      expect(consignorBtn).toBeDisabled();
    });

    it('applies default §5.6 and allows override when product is Consignor', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onSaved = vi.fn();

      render(
        <LossDialog
          open={true}
          onClose={onClose}
          onSaved={onSaved}
          products={mockProducts}
        />,
      );

      // Select Lemper Ayam Pak Sani (consignor)
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '2');

      // Default reason is expired -> borne_by is consignor
      expect(screen.getByText(/Ditanggung oleh Pak Sani\. Stok barang dihapus tanpa ganti rugi uang dari Owner \(Rp 0\)\./i)).toBeInTheDocument();

      // Click "Rusak di Etalase" -> auto-switches to Aku (Owner)
      const damagedOnDisplayBtn = screen.getByRole('button', { name: /Rusak di Etalase/i });
      await user.click(damagedOnDisplayBtn);

      expect(screen.getByText(/Owner mengganti hak penitip \(Pak Sani\): Rp 6\.000/i)).toBeInTheDocument();

      // Manual override back to Penitip
      const penitipBtn = screen.getByRole('button', { name: /Penitip \(Pak Sani\)/i });
      await user.click(penitipBtn);

      expect(screen.getByText(/Ditanggung oleh Pak Sani\. Stok barang dihapus tanpa ganti rugi uang dari Owner \(Rp 0\)\./i)).toBeInTheDocument();
    });
  });
});
