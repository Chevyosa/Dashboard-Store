import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '@/lib/api';
import BarangMasukPage from '@/app/(app)/barang-masuk/page';
import { StockInDialog } from '@/components/barang-masuk/stock-in-dialog';
import { StockReturnDialog } from '@/components/barang-masuk/stock-return-dialog';

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

const mockStockIns: apiModule.StockIn[] = [
  {
    id: 101,
    type: 'purchase',
    date: '2026-10-04',
    note: 'Belanja di Agen',
    opnameId: null,
    totalCost: '35000.0000',
    totalQtyPcs: 20,
    linesCount: 1,
    lines: [
      {
        id: 1,
        stockInId: 101,
        productId: 1,
        productName: 'Gery Salut',
        ownerType: 'own',
        consignorName: null,
        inputMode: 'pack',
        qtyPack: 2,
        pcsPerPackSnapshot: 10,
        qtyPcs: 20,
        totalCost: '35000.0000',
        createdAt: '2026-10-04T00:00:00.000Z',
        updatedAt: '2026-10-04T00:00:00.000Z',
      },
    ],
    createdAt: '2026-10-04T00:00:00.000Z',
    updatedAt: '2026-10-04T00:00:00.000Z',
  },
];

const mockReturns: apiModule.StockReturn[] = [
  {
    id: 201,
    productId: 2,
    productName: 'Lemper Ayam Pak Sani',
    consignorId: 10,
    consignorName: 'Pak Sani',
    qtyPcs: 3,
    date: '2026-10-04',
    note: 'Sisa ditarik',
    opnameId: null,
    createdAt: '2026-10-04T00:00:00.000Z',
    updatedAt: '2026-10-04T00:00:00.000Z',
  },
];

const mockSummary: apiModule.StockInSummary = {
  totalPurchaseCost: '35000.0000',
  totalLines: 1,
  totalOwnPcs: 20,
  totalConsignorPcs: 0,
  totalTransactions: 1,
  openReturnsCount: 1,
  openReturnedPcs: 3,
};

describe('Barang Masuk & Retur Frontend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(apiModule, 'getStockIns').mockResolvedValue({
      data: mockStockIns,
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    vi.spyOn(apiModule, 'getStockReturns').mockResolvedValue({
      data: mockReturns,
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    vi.spyOn(apiModule, 'getProducts').mockResolvedValue({
      data: mockProducts,
      pagination: { page: 1, limit: 100, total: 2, totalPages: 1 },
    });
    vi.spyOn(apiModule, 'getOpenPeriodStockInSummary').mockResolvedValue({
      data: mockSummary,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('BarangMasukPage', () => {
    it('renders KPI summary cards and stock in table', async () => {
      render(<BarangMasukPage />);

      await waitFor(() => {
        expect(screen.getByText('Barang Masuk & Retur')).toBeInTheDocument();
      });

      // Verify KPIs
      expect(screen.getAllByText('Rp 35.000').length).toBeGreaterThan(0);
      expect(screen.getAllByText('20 pcs').length).toBeGreaterThan(0);
      expect(screen.getAllByText('3 pcs').length).toBeGreaterThan(0);

      // Verify table row
      expect(screen.getAllByText('2026-10-04').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Belanja Own').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Belanja di Agen').length).toBeGreaterThan(0);
    });

    it('switches to Retur Penitip tab and shows return records', async () => {
      const user = userEvent.setup();
      render(<BarangMasukPage />);

      await waitFor(() => {
        expect(screen.getByText('Barang Masuk & Retur')).toBeInTheDocument();
      });

      const returTab = screen.getByRole('button', { name: /^Retur Penitip \(\d+\)$/i });
      await user.click(returTab);

      // Verify return record is displayed
      await waitFor(() => {
        expect(screen.getAllByText('Lemper Ayam Pak Sani').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Pak Sani').length).toBeGreaterThan(0);
        expect(screen.getAllByText('3 pcs').length).toBeGreaterThan(0);
      });
    });
  });

  describe('StockInDialog', () => {
    it('disables cost input for consignor products and shows Rp 0', async () => {
      const onSaved = vi.fn();
      const onClose = vi.fn();

      render(
        <StockInDialog
          open={true}
          onClose={onClose}
          onSaved={onSaved}
          products={mockProducts}
        />,
      );

      const user = userEvent.setup();
      // Switch type to "Setoran Penitip"
      const titipanBtn = screen.getByRole('button', { name: /Setoran Penitip/i });
      await user.click(titipanBtn);

      // In titipan mode, the cost input is disabled with "Rp 0"
      const costInput = screen.getByDisplayValue('Rp 0');
      expect(costInput).toBeDisabled();
      expect(screen.getByText('Modal titipan Rp 0')).toBeInTheDocument();
    });
  });

  describe('StockReturnDialog', () => {
    it('only lists consignor products in select dropdown', () => {
      const onSaved = vi.fn();
      const onClose = vi.fn();

      render(
        <StockReturnDialog
          open={true}
          onClose={onClose}
          onSaved={onSaved}
          products={mockProducts}
        />,
      );

      expect(screen.getByText(/Lemper Ayam Pak Sani/i)).toBeInTheDocument();
      expect(screen.queryByText(/Gery Salut/i)).not.toBeInTheDocument();
    });
  });
});
