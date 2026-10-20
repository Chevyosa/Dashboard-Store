import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '@/lib/api';
import OpnamePage from '@/app/(app)/opname/page';
import { OpnameWizard } from '@/components/opname/opname-wizard';

const mockOpnames: apiModule.OpnameRecord[] = [
  {
    id: 1,
    opnameDate: '2026-10-02',
    status: 'final',
    note: 'Opname Jumat ke-1',
    totalTurnover: '80500.0000',
    totalSoldQty: 17,
    totalLossQty: 1,
    totalCogs: '7000.0000',
    totalPayoutDue: '60000.0000',
    cashAmount: '80500.0000',
    qrisAmount: '0.0000',
    realCash: '80500.0000',
    cashDifference: '0.0000',
    profitA: '13500.0000',
    profitB: '13500.0000',
    createdAt: '2026-10-02T17:00:00.000Z',
    updatedAt: '2026-10-02T17:00:00.000Z',
    items: [],
    payouts: [],
  },
];

const mockPrepareSheet: apiModule.OpnamePrepareSheet = {
  opnameDate: '2026-10-09',
  existingOpname: null,
  products: [
    {
      productId: 1,
      productName: 'Gery Salut',
      ownerType: 'own',
      consignorId: null,
      consignorName: null,
      pcsPerPack: 10,
      sellPrice: '1500.0000',
      marginType: null,
      marginValue: null,
      openingQty: 3,
      openingValue: '3000.0000',
      inQty: 10,
      inCost: '10000.0000',
      returnedQty: 0,
      expectedQty: 13,
      lossQty: 0,
      losses: [],
      draftPhysicalQty: null,
    },
    {
      productId: 2,
      productName: 'Lemper Ayam Pak Sani',
      ownerType: 'consignor',
      consignorId: 10,
      consignorName: 'Pak Sani',
      pcsPerPack: 1,
      sellPrice: '7000.0000',
      marginType: 'nominal',
      marginValue: '1000.0000',
      openingQty: 0,
      openingValue: '0.0000',
      inQty: 10,
      inCost: '0.0000',
      returnedQty: 0,
      expectedQty: 10,
      lossQty: 1,
      losses: [{ qty: 1, reason: 'damaged_on_display', borneBy: 'owner' }],
      draftPhysicalQty: null,
    },
  ],
};

const mockCalculateResponse: apiModule.CalculateOpnameResponse = {
  data: {
    calculatedItems: [
      {
        productId: 1,
        ownerType: 'own',
        consignorId: null,
        productNameSnapshot: 'Gery Salut',
        sellPriceSnapshot: '1500.0000',
        marginTypeSnapshot: null,
        marginValueSnapshot: null,
        pcsPerPackSnapshot: 10,
        openingQty: 3,
        openingValue: '3000.0000',
        inQty: 10,
        inCost: '10000.0000',
        returnedQty: 0,
        expectedQty: 13,
        physicalQty: 5,
        diffQty: 8,
        lossQty: 0,
        soldQty: 8,
        avgCost: '1000.0000',
        cogs: '8000.0000',
        ownLossCost: '0.0000',
        closingValue: '5000.0000',
        turnover: '12000.0000',
        ownerMarginPerPcs: '500.0000',
        consignorSharePerPcs: '0.0000',
        soldShare: '0.0000',
        lossQtyOwnerBorne: 0,
        lossCompensation: '0.0000',
        payoutDue: '0.0000',
      },
    ],
    calculatedPayouts: [
      {
        consignorId: 10,
        soldShare: '42000.0000',
        lossCompensation: '6000.0000',
        payoutDue: '48000.0000',
      },
    ],
    totals: {
      totalTurnover: '61000.0000',
      totalSoldQty: 15,
      totalLossQty: 1,
      totalCogs: '8000.0000',
      totalPayoutDue: '48000.0000',
      cashAmount: '61000.0000',
      qrisAmount: '0.0000',
      realCash: '61000.0000',
      cashDifference: '0.0000',
      profitA: '13000.0000',
      profitB: '13000.0000',
    },
    reconciliation: {
      theoreticalTurnover: '61000.0000',
      realCash: '61000.0000',
      cashDifference: '0.0000',
      cashDifferenceHint: 'Uang riil cocok dengan omset teoritis.',
      profitA: '13000.0000',
      profitB: '13000.0000',
      profitDiff: '0.0000',
      invariantI3Satisfied: true,
    },
  },
};

describe('Opname Frontend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(apiModule, 'getOpnames').mockResolvedValue({
      data: mockOpnames,
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    vi.spyOn(apiModule, 'prepareOpname').mockResolvedValue({
      data: mockPrepareSheet,
    });
    vi.spyOn(apiModule, 'calculateOpname').mockResolvedValue(mockCalculateResponse);
    vi.spyOn(apiModule, 'finalizeOpname').mockResolvedValue({
      data: {
        ...mockOpnames[0]!,
        id: 2,
        opnameDate: '2026-10-09',
        status: 'final',
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('OpnamePage', () => {
    it('renders opname history table and KPI cards', async () => {
      render(<OpnamePage />);

      await waitFor(() => {
        expect(screen.getByText('Opname & Penutupan Periode')).toBeInTheDocument();
      });

      expect(screen.getByText('1 periode')).toBeInTheDocument();
      expect(screen.getAllByText('17 pcs').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Final').length).toBeGreaterThan(0);
      expect(screen.getByText('Opname Jumat ke-1')).toBeInTheDocument();
    });

    it('renders draft warning banner when an active draft exists', async () => {
      vi.spyOn(apiModule, 'getOpnames').mockResolvedValue({
        data: [
          {
            ...mockOpnames[0]!,
            id: 99,
            opnameDate: '2026-10-09',
            status: 'draft',
            note: 'Draf berjalan',
          },
        ],
        pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
      });

      render(<OpnamePage />);

      await waitFor(() => {
        expect(screen.getByText('Ada Draf Opname Belum Difinalisasi')).toBeInTheDocument();
      });

      expect(screen.getAllByRole('button', { name: /Lanjutkan Draf/i }).length).toBeGreaterThan(0);
    });

    it('opens wizard when clicking + Mulai Opname Baru', async () => {
      const user = userEvent.setup();
      render(<OpnamePage />);

      await waitFor(() => {
        expect(screen.getByText('Opname & Penutupan Periode')).toBeInTheDocument();
      });

      const startBtn = screen.getByRole('button', { name: /\+ Mulai Opname Baru/i });
      await user.click(startBtn);

      expect(screen.getByText('Pilih Tanggal Opname')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Mulai Penghitungan Fisik/i })).toBeInTheDocument();
    });
  });

  describe('OpnameWizard', () => {
    it('navigates through steps, counts physical stock, and finalizes', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const onCancel = vi.fn();

      render(<OpnameWizard onSuccess={onSuccess} onCancel={onCancel} />);

      // Step 1: Start
      expect(screen.getByText('Pilih Tanggal Opname')).toBeInTheDocument();
      const nextBtn = screen.getByRole('button', { name: /Mulai Penghitungan Fisik/i });
      await user.click(nextBtn);

      // Step 2: Physical Counter
      await waitFor(() => {
        expect(screen.getByText('Hitung Stok Fisik (Counter)')).toBeInTheDocument();
      });
      expect(screen.getByText('Gery Salut')).toBeInTheDocument();
      expect(screen.getByText('Lemper Ayam Pak Sani')).toBeInTheDocument();

      // Adjust Lemper counter so that diff (10 - 8 = 2) > lossQty (1)
      const inputs = screen.getAllByRole('spinbutton');
      // inputs[0] is Gery (set to 5), inputs[1] is Lemper (set to 8)
      await user.clear(inputs[0]!);
      await user.type(inputs[0]!, '5');

      await user.clear(inputs[1]!);
      await user.type(inputs[1]!, '8');

      // Advance to Step 3
      const toStep3Btn = screen.getByRole('button', { name: /Lanjut ke Review Selisih/i });
      await user.click(toStep3Btn);

      // Step 3: Review
      await waitFor(() => {
        expect(screen.getByText('Review Selisih & Alokasi Loss')).toBeInTheDocument();
      });

      // Advance to Step 4
      const toStep4Btn = screen.getByRole('button', { name: /Lanjut ke Ringkasan Akhir/i });
      await user.click(toStep4Btn);

      // Step 4: Summary & Finalize
      await waitFor(() => {
        expect(screen.getByText('Ringkasan & Finalisasi Periode')).toBeInTheDocument();
      });

      expect(screen.getByText('Finalisasi & Tutup Periode')).toBeInTheDocument();

      const finalizeBtn = screen.getByRole('button', { name: /Finalisasi & Tutup Periode/i });
      await user.click(finalizeBtn);

      await waitFor(() => {
        expect(apiModule.finalizeOpname).toHaveBeenCalledTimes(1);
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
    });
  });
});
