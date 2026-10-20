import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '@/lib/api';
import { PayoutStatusBadge } from '@/components/payout/payout-status-badge';
import { PayoutSummaryCards } from '@/components/payout/payout-summary-cards';
import { PayoutTable } from '@/components/payout/payout-table';
import PayoutPage from '@/app/(app)/payout/page';

const mockOverview: apiModule.ConsignorLedgersOverview = {
  totals: {
    totalAccrual: '120000.0000',
    totalPayment: '70000.0000',
    totalBalance: '50000.0000',
    unpaidCount: 1,
  },
  ledgers: [
    {
      consignorId: 1,
      consignorName: 'Pak Sani',
      phone: '08123456789',
      isActive: true,
      totalAccrual: '60000.0000',
      totalPayment: '40000.0000',
      balance: '20000.0000',
      status: 'unpaid',
    },
    {
      consignorId: 2,
      consignorName: 'Kak Peja',
      phone: null,
      isActive: true,
      totalAccrual: '60000.0000',
      totalPayment: '60000.0000',
      balance: '0.0000',
      status: 'settled',
    },
  ],
};

describe('PayoutStatusBadge', () => {
  it('renders correct labels for each status', () => {
    const { rerender } = render(<PayoutStatusBadge status="unpaid" />);
    expect(screen.getByText('Belum Lunas')).toBeInTheDocument();

    rerender(<PayoutStatusBadge status="settled" />);
    expect(screen.getByText('Lunas')).toBeInTheDocument();

    rerender(<PayoutStatusBadge status="overpaid" />);
    expect(screen.getByText('Lebih Bayar')).toBeInTheDocument();
  });
});

describe('PayoutSummaryCards', () => {
  it('renders metric cards with formatted Rupiah values', () => {
    render(<PayoutSummaryCards totals={mockOverview.totals} />);
    expect(screen.getByText('Total Hak Penitip')).toBeInTheDocument();
    expect(screen.getByText('Rp 120.000')).toBeInTheDocument();
    expect(screen.getByText('Rp 70.000')).toBeInTheDocument();
    expect(screen.getByText('Rp 50.000')).toBeInTheDocument();
  });
});

describe('PayoutTable', () => {
  it('renders consignor list and fires action callbacks', async () => {
    const onPay = vi.fn();
    const onViewLedger = vi.fn();
    const user = userEvent.setup();

    render(
      <PayoutTable
        ledgers={mockOverview.ledgers}
        onPay={onPay}
        onViewLedger={onViewLedger}
      />,
    );

    expect(screen.getAllByText('Pak Sani').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Kak Peja').length).toBeGreaterThan(0);

    const payButtons = screen.getAllByRole('button', { name: /bayar/i });
    await user.click(payButtons[0]!);
    expect(onPay).toHaveBeenCalledWith(mockOverview.ledgers[0]);

    const detailButtons = screen.getAllByRole('button', { name: /buku kas/i });
    await user.click(detailButtons[1]!);
    expect(onViewLedger).toHaveBeenCalledWith(mockOverview.ledgers[1]);
  });
});

describe('PayoutPage', () => {
  beforeEach(() => {
    vi.spyOn(apiModule, 'getConsignorLedgers').mockResolvedValue({
      data: mockOverview,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and renders the payout page with data', async () => {
    render(<PayoutPage />);

    expect(screen.getByText('Memuat buku kas penitip...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Pak Sani').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('+ Catat Pembayaran')).toBeInTheDocument();
    expect(screen.getByText('Total Hak Penitip')).toBeInTheDocument();
  });
});
