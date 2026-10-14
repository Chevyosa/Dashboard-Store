import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '@/lib/api';
import { DashboardKPICards } from '@/components/dashboard/dashboard-kpi-cards';
import { TurnoverBreakdownCard } from '@/components/dashboard/turnover-breakdown-card';
import { TopProductsCard } from '@/components/dashboard/top-products-card';
import { PendingPayoutsCard } from '@/components/dashboard/pending-payouts-card';
import { QuickActions } from '@/components/dashboard/quick-actions';
import DashboardPage from '@/app/(app)/dashboard/page';

const mockSummaryData: apiModule.DashboardSummaryResponse = {
  overview: {
    activeProductsCount: 8,
    activeConsignorsCount: 3,
    totalStockValuation: '50000.0000',
    totalUnpaidConsignorBalance: '35000.0000',
    latestOpname: {
      id: 1,
      opnameDate: '2026-10-02',
      status: 'final',
      totalTurnover: '150000.0000',
      totalSoldQty: 25,
      totalLossQty: 2,
      totalCogs: '60000.0000',
      totalPayoutDue: '45000.0000',
    },
    hasActiveDraft: false,
    activeDraftDate: null,
  },
  turnoverBreakdown: {
    ownTurnover: '90000.0000',
    consignorTurnover: '60000.0000',
    totalTurnover: '150000.0000',
    ownPercentage: 60,
    consignorPercentage: 40,
  },
  topProducts: [
    {
      productId: 1,
      name: 'Gery Salut',
      ownerType: 'own',
      soldQty: 15,
      turnover: '22500.0000',
    },
    {
      productId: 2,
      name: 'Lemper Ayam',
      ownerType: 'consignor',
      soldQty: 10,
      turnover: '70000.0000',
    },
  ],
  pendingPayoutConsignors: [
    {
      consignorId: 1,
      consignorName: 'Pak Sani',
      phone: '08123456789',
      totalAccrual: '45000.0000',
      totalPayment: '10000.0000',
      balance: '35000.0000',
    },
  ],
  recentOpnames: [
    {
      id: 1,
      opnameDate: '2026-10-02',
      status: 'final',
      totalTurnover: '150000.0000',
      totalSoldQty: 25,
      totalLossQty: 2,
      totalCogs: '60000.0000',
      totalPayoutDue: '45000.0000',
    },
  ],
  opnameOptions: [
    {
      id: 1,
      opnameDate: '2026-10-02',
      status: 'final',
    },
  ],
  latestReconciliation: {
    opnameId: 1,
    opnameDate: '2026-10-02',
    theoreticalTurnover: '150000.0000',
    turnoverOwn: '90000.0000',
    turnoverConsignor: '60000.0000',
    qrisAmount: '50000.0000',
    cashAmount: '100000.0000',
    realCash: '150000.0000',
    cashDifference: '0.0000',
    cashDifferenceHint: 'Uang riil cocok dengan omset teoritis.',
    totalCogs: '60000.0000',
    totalOwnLossCost: '2000.0000',
    totalLossCompensation: '0.0000',
    totalOpeningValue: '40000.0000',
    totalClosingValue: '50000.0000',
    modalBelanjaOwn: '72000.0000',
    totalPayoutDue: '45000.0000',
    profitA: '43000.0000',
    profitB: '33000.0000',
    profitDiff: '-10000.0000',
    invariantI3Satisfied: true,
  },
};

describe('DashboardKPICards', () => {
  it('renders turnover, profit A, loss, and pending payout with Rupiah format', () => {
    render(
      <DashboardKPICards
        overview={mockSummaryData.overview}
        latestReconciliation={mockSummaryData.latestReconciliation}
      />
    );

    expect(screen.getByText('Omset Penjualan')).toBeInTheDocument();
    expect(screen.getByText('Rp 150.000')).toBeInTheDocument();
    expect(screen.getByText('25 Pcs Terjual')).toBeInTheDocument();
    expect(screen.getByText('Rp 43.000')).toBeInTheDocument();
    expect(screen.getByText('Rp 2.000')).toBeInTheDocument();
    expect(screen.getByText('Rp 35.000')).toBeInTheDocument();
  });
});

describe('TurnoverBreakdownCard', () => {
  it('renders percentages and amounts for own and consignor sales', () => {
    render(<TurnoverBreakdownCard breakdown={mockSummaryData.turnoverBreakdown} />);

    expect(screen.getByText('Komposisi Omset Penjualan')).toBeInTheDocument();
    expect(screen.getByText('Rp 90.000')).toBeInTheDocument();
    expect(screen.getByText('Rp 60.000')).toBeInTheDocument();
    expect(screen.getByText('60% dari total omset')).toBeInTheDocument();
    expect(screen.getByText('40% dari total omset')).toBeInTheDocument();
  });
});

describe('TopProductsCard', () => {
  it('renders ranking of top selling products with tags', () => {
    render(<TopProductsCard products={mockSummaryData.topProducts} />);

    expect(screen.getByText('Produk Paling Laris')).toBeInTheDocument();
    expect(screen.getByText('Gery Salut')).toBeInTheDocument();
    expect(screen.getByText('Own')).toBeInTheDocument();
    expect(screen.getByText('15 unit terjual')).toBeInTheDocument();
    expect(screen.getByText('Lemper Ayam')).toBeInTheDocument();
    expect(screen.getByText('Titipan')).toBeInTheDocument();
    expect(screen.getByText('10 unit terjual')).toBeInTheDocument();
  });
});

describe('PendingPayoutsCard', () => {
  it('renders list of consignors with pending payout balances', () => {
    render(<PendingPayoutsCard consignors={mockSummaryData.pendingPayoutConsignors} />);

    expect(screen.getByText('Kewajiban Bagi Hasil Penitip')).toBeInTheDocument();
    expect(screen.getByText('1 Tertunggak')).toBeInTheDocument();
    expect(screen.getByText('Pak Sani')).toBeInTheDocument();
    expect(screen.getByText('Rp 35.000')).toBeInTheDocument();
  });
});

describe('QuickActions', () => {
  it('renders quick action shortcuts with proper links', () => {
    render(<QuickActions />);

    expect(screen.getByText('Tutup Periode / Opname')).toBeInTheDocument();
    expect(screen.getByText('Catat Barang Masuk')).toBeInTheDocument();
    expect(screen.getByText('Catat Kerugian / Loss')).toBeInTheDocument();
    expect(screen.getByText('Buku Kas & Bayar Penitip')).toBeInTheDocument();
  });
});

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.spyOn(apiModule, 'getDashboardSummary').mockResolvedValue({
      data: mockSummaryData,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and renders dashboard with all sections populated', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard Toko')).toBeInTheDocument();
    });

    expect(screen.getByText('8 Produk Aktif')).toBeInTheDocument();
    expect(screen.getByText('3 Penitip Aktif')).toBeInTheDocument();
    expect(screen.getByText('Rekonsiliasi Kas & Verifikasi Laba Dua Sisi')).toBeInTheDocument();
    expect(screen.getByText('Terverifikasi Valid 100%')).toBeInTheDocument();
  });
});
