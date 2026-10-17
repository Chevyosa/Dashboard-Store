import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '@/lib/api';
import { TakeProfitSummaryCard } from '@/components/take-profit/take-profit-summary-card';
import { TakeProfitTable } from '@/components/take-profit/take-profit-table';
import TakeProfitPage from '@/app/(app)/take-profit/page';

const mockOverview: apiModule.TakeProfitOverview = {
  latestOpname: {
    id: 5,
    opnameDate: '2026-03-01',
    realCash: '1000000.0000',
    totalPayoutDue: '300000.0000',
  },
  totalPayout: '300000.0000',
  payoutPaid: '300000.0000',
  payoutUnpaid: '0.0000',
  payoutStatus: 'settled',
  totalUnpaidConsignorBalance: '0.0000',
  minWorkingCapital: '400000.0000',
  withdrawnCurrentPeriod: '100000.0000',
  totalWithdrawnAllTime: '150000.0000',
  availableToWithdraw: '200000.0000',
  rawBalance: '250000.0000',
  isSafe: true,
  warningReason: null,
};

const mockWithdrawal: apiModule.TakeProfitItem = {
  id: 1,
  opnameId: 5,
  opnameDate: '2026-03-01',
  amount: '100000.0000',
  withdrawalDate: '2026-03-02',
  paymentMethod: 'cash',
  note: 'Prive owner awal bulan',
  createdBy: 1,
  createdByUsername: 'owner',
  createdAt: '2026-03-02T10:00:00.000Z',
  updatedAt: '2026-03-02T10:00:00.000Z',
};

describe('TakeProfitSummaryCard', () => {
  it('renders available amount and safe status with breakdown steps', () => {
    render(
      <TakeProfitSummaryCard
        overview={mockOverview}
        onOpenWithdrawDialog={vi.fn()}
        onOpenEditCapitalDialog={vi.fn()}
      />,
    );

    // Available amount
    expect(screen.getByText('Rp 200.000')).toBeInTheDocument();
    expect(screen.getByText('Halal & Aman Ditarik')).toBeInTheDocument();

    // Breakdown values
    expect(screen.getByText('Rp 1.000.000')).toBeInTheDocument();
    expect(screen.getByText('2. Payout Penitip')).toBeInTheDocument();
    expect(screen.getByText('Rp 300.000')).toBeInTheDocument();
    expect(screen.getByText('Rp 400.000')).toBeInTheDocument();
    expect(screen.getByText('Rp 100.000')).toBeInTheDocument();
    expect(screen.getByText('Rp 150.000')).toBeInTheDocument();
  });

  it('renders warning alert when isSafe is false', () => {
    const unsafeOverview: apiModule.TakeProfitOverview = {
      ...mockOverview,
      availableToWithdraw: '0.0000',
      rawBalance: '-200000.0000',
      isSafe: false,
      warningReason: 'Kas toko belum mencukupi batas aman modal belanja.',
    };

    render(
      <TakeProfitSummaryCard
        overview={unsafeOverview}
        onOpenWithdrawDialog={vi.fn()}
        onOpenEditCapitalDialog={vi.fn()}
      />,
    );

    expect(screen.getByText('Tahan Penarikan')).toBeInTheDocument();
    expect(
      screen.getByText('Kas toko belum mencukupi batas aman modal belanja.'),
    ).toBeInTheDocument();
  });
});

describe('TakeProfitTable', () => {
  it('renders withdrawal records and method badge correctly', () => {
    render(
      <TakeProfitTable
        items={[mockWithdrawal]}
        loading={false}
        onDelete={vi.fn()}
        pagination={{ page: 1, limit: 10, total: 1, totalPages: 1 }}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Rp 100.000')).toBeInTheDocument();
    expect(screen.getByText('💵 Tunai')).toBeInTheDocument();
    expect(screen.getByText('Prive owner awal bulan')).toBeInTheDocument();
    expect(screen.getByText('Opname #5')).toBeInTheDocument();
  });

  it('renders empty message when no withdrawals exist', () => {
    render(
      <TakeProfitTable
        items={[]}
        loading={false}
        onDelete={vi.fn()}
        pagination={{ page: 1, limit: 10, total: 0, totalPages: 0 }}
        onPageChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Belum ada catatan penarikan laba/i),
    ).toBeInTheDocument();
  });
});

describe('TakeProfitPage Integration', () => {
  beforeEach(() => {
    vi.spyOn(apiModule, 'getTakeProfitOverview').mockResolvedValue({ data: mockOverview });
    vi.spyOn(apiModule, 'listTakeProfits').mockResolvedValue({
      data: [mockWithdrawal],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads overview and withdrawals list, opens withdraw dialog on click', async () => {
    const user = userEvent.setup();
    render(<TakeProfitPage />);

    await waitFor(() => {
      expect(screen.getByText('Take Profit')).toBeInTheDocument();
      expect(screen.getByText('Rp 200.000')).toBeInTheDocument();
      expect(screen.getByText('Prive owner awal bulan')).toBeInTheDocument();
    });

    // Click + Catat Tarik Laba button
    const openButtons = screen.getAllByRole('button', { name: /\+ Catat Tarik Laba/i });
    await user.click(openButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Catat Penarikan Laba \(Take Profit\)/i)).toBeInTheDocument();
    });
  });
});
