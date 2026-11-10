import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '@/lib/api';
import { TakeProfitSummaryCard } from '@/components/take-profit/take-profit-summary-card';
import { TakeProfitTable } from '@/components/take-profit/take-profit-table';
import { TakeProfitDialog } from '@/components/take-profit/take-profit-dialog';
import TakeProfitPage from '@/app/(app)/take-profit/page';

const mockOverview: apiModule.TakeProfitOverview = {
  latestOpname: {
    id: 5,
    opnameDate: '2026-03-01',
    realCash: '1000000.0000',
    totalPayoutDue: '300000.0000',
  },
  totalPayout: '300000.0000',
  payoutPaid: '180000.0000',
  payoutUnpaid: '120000.0000',
  payoutStatus: 'partial',
  totalUnpaidConsignorBalance: '120000.0000',
  minWorkingCapital: '400000.0000',
  withdrawnCurrentPeriod: '100000.0000',
  totalWithdrawnAllTime: '150000.0000',
  availableToWithdraw: '300000.0000',
  rawBalance: '250000.0000',
  isSafe: true,
  warningReason: null,
  liquidityInitialized: true,
  currentLiquidBalance: '900000.0000',
  unpaidStockPurchaseBalance: '80000.0000',
  totalUnpaidObligations: '200000.0000',
  liquidityShortfall: '0.0000',
};

// Legacy availableToWithdraw (275.000) must never be presented as safe when
// the liquidity ledger has not been initialized yet.
const uninitializedOverview: apiModule.TakeProfitOverview = {
  ...mockOverview,
  availableToWithdraw: '275000.0000',
  liquidityInitialized: false,
  currentLiquidBalance: null,
  liquidityShortfall: '0.0000',
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

function renderSummary(overview: apiModule.TakeProfitOverview) {
  const onOpenWithdrawDialog = vi.fn();
  render(
    <TakeProfitSummaryCard
      overview={overview}
      onOpenWithdrawDialog={onOpenWithdrawDialog}
      onOpenEditCapitalDialog={vi.fn()}
    />,
  );
  return { onOpenWithdrawDialog };
}

describe('TakeProfitSummaryCard (liquidity initialized)', () => {
  it('shows actual liquid cash, reserve, unpaid obligations, safe-to-withdraw and shortfall', () => {
    renderSummary(mockOverview);

    // Safe-to-withdraw headline
    expect(screen.getByTestId('safe-to-withdraw')).toHaveTextContent('Rp 300.000');
    expect(screen.getByText('Aman Ditarik')).toBeInTheDocument();

    // Ledger breakdown
    expect(screen.getByTestId('current-liquid-balance')).toHaveTextContent('Rp 900.000');
    expect(screen.getByTestId('working-capital-reserve')).toHaveTextContent('Rp 400.000');
    expect(screen.getByTestId('unpaid-consignor-balance')).toHaveTextContent('Rp 120.000');
    expect(screen.getByTestId('unpaid-stock-purchase-balance')).toHaveTextContent('Rp 80.000');
    expect(screen.getByTestId('total-unpaid-obligations')).toHaveTextContent('Rp 200.000');
    expect(screen.getByTestId('liquidity-shortfall')).toHaveTextContent('Rp 0');

    // Withdrawal history aggregates still visible
    expect(screen.getByText('Rp 100.000')).toBeInTheDocument();
    expect(screen.getByText('Rp 150.000')).toBeInTheDocument();
  });

  it('does not claim the available cash is pure profit or halal and distinguishes it from Profit A/B', () => {
    renderSummary(mockOverview);

    expect(screen.queryByText(/halal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/keuntungan murni/i)).not.toBeInTheDocument();
    expect(screen.getByText(/bukan Profit A\/B/i)).toBeInTheDocument();
  });

  it('fails closed without crashing when liquidity API amount fields are malformed', () => {
    const malformedOverview = {
      ...mockOverview,
      currentLiquidBalance: 12345,
      totalUnpaidConsignorBalance: null,
      availableToWithdraw: undefined,
      liquidityShortfall: 50000,
    } as unknown as apiModule.TakeProfitOverview;

    expect(() => renderSummary(malformedOverview)).not.toThrow();
    expect(screen.getByTestId('safe-to-withdraw')).toHaveTextContent('—');
    expect(screen.getByTestId('current-liquid-balance')).toHaveTextContent('—');
    expect(screen.getByTestId('unpaid-consignor-balance')).toHaveTextContent('—');
    expect(screen.getByRole('button', { name: /\+ Catat Tarik Laba/i })).toBeDisabled();
  });

  it('enables the withdraw action', async () => {
    const user = userEvent.setup();
    const { onOpenWithdrawDialog } = renderSummary(mockOverview);

    const btn = screen.getByRole('button', { name: /\+ Catat Tarik Laba/i });
    expect(btn).toBeEnabled();
    await user.click(btn);
    expect(onOpenWithdrawDialog).toHaveBeenCalledTimes(1);
  });

  it('renders hold warning and blocks withdrawal even if unsafe API data contains a positive amount', () => {
    const unsafeOverview = {
      ...mockOverview,
      availableToWithdraw: '50000.0000',
      liquidityShortfall: '50000.0000',
      isSafe: false,
      warningReason: 'Kas toko belum mencukupi batas aman modal belanja.',
    };
    renderSummary(unsafeOverview);

    expect(screen.getByText('Tahan Penarikan')).toBeInTheDocument();
    expect(
      screen.getByText('Kas toko belum mencukupi batas aman modal belanja.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('liquidity-shortfall')).toHaveTextContent('Rp 50.000');
    expect(screen.getByTestId('safe-to-withdraw')).toHaveTextContent('—');
    expect(screen.getByRole('button', { name: /\+ Catat Tarik Laba/i })).toBeDisabled();
  });
});

describe('TakeProfitSummaryCard (liquidity not initialized)', () => {
  it('shows an explicit not-initialized warning and hides legacy availableToWithdraw', () => {
    renderSummary(uninitializedOverview);

    expect(screen.getByRole('alert')).toHaveTextContent(/belum diinisialisasi/i);
    expect(screen.queryByText('Rp 275.000')).not.toBeInTheDocument();
    expect(screen.queryByText('Aman Ditarik')).not.toBeInTheDocument();
    expect(screen.getByTestId('safe-to-withdraw')).toHaveTextContent('—');
    expect(screen.getByTestId('current-liquid-balance')).toHaveTextContent(
      /belum diinisialisasi/i,
    );
  });

  it('disables the withdraw action', () => {
    renderSummary(uninitializedOverview);
    expect(screen.getByRole('button', { name: /\+ Catat Tarik Laba/i })).toBeDisabled();
  });
});

describe('TakeProfitDialog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('blocks submission and shows a warning when liquidity is not initialized', async () => {
    const user = userEvent.setup();
    const createSpy = vi.spyOn(apiModule, 'createTakeProfit');
    render(
      <TakeProfitDialog
        open
        onClose={vi.fn()}
        onSaved={vi.fn()}
        overview={uninitializedOverview}
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('alert')).toHaveTextContent(/belum diinisialisasi/i);
    expect(within(dialog).queryByText('Rp 275.000')).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/halal/i)).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', { name: /Tarik Semua Aman/i }),
    ).not.toBeInTheDocument();

    const submit = within(dialog).getByRole('button', { name: /Simpan Penarikan/i });
    expect(submit).toBeDisabled();

    await user.type(within(dialog).getByLabelText(/Nominal yang Ditarik/i), '10000');
    await user.click(submit);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('allows submission and shows safe-to-withdraw amount when initialized', async () => {
    const user = userEvent.setup();
    const createSpy = vi
      .spyOn(apiModule, 'createTakeProfit')
      .mockResolvedValue({ data: mockWithdrawal, message: 'ok' });
    const onSaved = vi.fn();
    render(
      <TakeProfitDialog open onClose={vi.fn()} onSaved={onSaved} overview={mockOverview} />,
    );

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Rp 300.000')).toBeInTheDocument();
    expect(within(dialog).queryByText(/halal/i)).not.toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/Nominal yang Ditarik/i), '10000');
    const submit = within(dialog).getByRole('button', { name: /Simpan Penarikan/i });
    expect(submit).toBeEnabled();
    await user.click(submit);

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
    expect(onSaved).toHaveBeenCalledWith(mockWithdrawal);
  });

  it('blocks dialog submission and renders em dash when overview has malformed fields', async () => {
    const user = userEvent.setup();
    const createSpy = vi.spyOn(apiModule, 'createTakeProfit');
    const malformedOverview = {
      ...mockOverview,
      currentLiquidBalance: 12345,
      availableToWithdraw: null,
      liquidityShortfall: 50000,
    } as unknown as apiModule.TakeProfitOverview;

    render(
      <TakeProfitDialog open onClose={vi.fn()} onSaved={vi.fn()} overview={malformedOverview} />,
    );

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('—')).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /Tarik Semua Aman/i })).not.toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/Nominal yang Ditarik/i), '10000');
    expect(within(dialog).getByRole('button', { name: /Simpan Penarikan/i })).toBeDisabled();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('blocks dialog submission when API marks a positive available amount unsafe', async () => {
    const user = userEvent.setup();
    const createSpy = vi.spyOn(apiModule, 'createTakeProfit');
    const unsafeOverview = {
      ...mockOverview,
      availableToWithdraw: '50000.0000',
      liquidityShortfall: '50000.0000',
      isSafe: false,
    };
    render(
      <TakeProfitDialog open onClose={vi.fn()} onSaved={vi.fn()} overview={unsafeOverview} />,
    );

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: /Simpan Penarikan/i })).toBeDisabled();
    await user.type(within(dialog).getByLabelText(/Nominal yang Ditarik/i), '10000');
    expect(within(dialog).getByRole('button', { name: /Simpan Penarikan/i })).toBeDisabled();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('accepts exact decimal amounts and fills the safe maximum without rounding', async () => {
    const user = userEvent.setup();
    const createSpy = vi
      .spyOn(apiModule, 'createTakeProfit')
      .mockResolvedValue({ data: mockWithdrawal, message: 'ok' });
    const fractionalOverview = { ...mockOverview, availableToWithdraw: '100.5000' };
    render(
      <TakeProfitDialog open onClose={vi.fn()} onSaved={vi.fn()} overview={fractionalOverview} />,
    );

    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByLabelText(/Nominal yang Ditarik/i) as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('inputmode', 'decimal');

    await user.click(within(dialog).getByRole('button', { name: /Tarik Semua Aman/i }));
    expect(input.value).toBe('100.5000');
    await user.clear(input);
    await user.type(input, '100.5001');
    expect(within(dialog).getByText(/melebihi batas aman/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /Simpan Penarikan/i }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/melebihi batas aman/i);
    expect(createSpy).not.toHaveBeenCalled();

    await user.clear(input);
    await user.type(input, '100.5');
    await user.click(within(dialog).getByRole('button', { name: /Simpan Penarikan/i }));
    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
    expect(createSpy.mock.calls[0]![0]).toMatchObject({ amount: '100.5' });
  });
});

describe('TakeProfitTable', () => {
  it('renders withdrawal records and method badge correctly', () => {
    render(
      <TakeProfitTable
        items={[mockWithdrawal]}
        loading={false}
        onDelete={vi.fn()}
        canDelete
        pagination={{ page: 1, limit: 10, total: 1, totalPages: 1 }}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getAllByText('Rp 100.000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('💵 Tunai').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Prive owner awal bulan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Opname #5').length).toBeGreaterThan(0);
  });

  it('shows delete actions when deletion is allowed', () => {
    render(
      <TakeProfitTable
        items={[mockWithdrawal]}
        loading={false}
        onDelete={vi.fn()}
        canDelete
        pagination={{ page: 1, limit: 10, total: 1, totalPages: 1 }}
        onPageChange={vi.fn()}
      />,
    );

    // desktop row + mobile card
    expect(screen.getAllByRole('button', { name: 'Hapus' })).toHaveLength(2);
  });

  it('hides delete actions and marks history immutable when deletion is not allowed', () => {
    render(
      <TakeProfitTable
        items={[mockWithdrawal]}
        loading={false}
        onDelete={vi.fn()}
        canDelete={false}
        pagination={{ page: 1, limit: 10, total: 1, totalPages: 1 }}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Hapus' })).not.toBeInTheDocument();
    expect(screen.getByText(/tidak dapat dihapus/i)).toBeInTheDocument();
  });

  it('renders empty message when no withdrawals exist', () => {
    render(
      <TakeProfitTable
        items={[]}
        loading={false}
        onDelete={vi.fn()}
        canDelete
        pagination={{ page: 1, limit: 10, total: 0, totalPages: 0 }}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/Belum ada catatan penarikan laba/i)).toBeInTheDocument();
  });
});

describe('TakeProfitPage Integration', () => {
  beforeEach(() => {
    vi.spyOn(apiModule, 'listTakeProfits').mockResolvedValue({
      data: [mockWithdrawal],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads overview and withdrawals list, opens withdraw dialog on click', async () => {
    vi.spyOn(apiModule, 'getTakeProfitOverview').mockResolvedValue({ data: mockOverview });
    const user = userEvent.setup();
    render(<TakeProfitPage />);

    await waitFor(() => {
      expect(screen.getByText('Take Profit')).toBeInTheDocument();
      expect(screen.getByTestId('safe-to-withdraw')).toHaveTextContent('Rp 300.000');
      expect(screen.getAllByText('Prive owner awal bulan').length).toBeGreaterThan(0);
    });

    const openButtons = screen.getAllByRole('button', { name: /\+ Catat Tarik Laba/i });
    openButtons.forEach((btn) => expect(btn).toBeEnabled());
    await user.click(openButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Catat Penarikan Laba \(Take Profit\)/i)).toBeInTheDocument();
    });
  });

  it('hides delete actions once liquidity is initialized (history is immutable)', async () => {
    vi.spyOn(apiModule, 'getTakeProfitOverview').mockResolvedValue({ data: mockOverview });
    render(<TakeProfitPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Prive owner awal bulan').length).toBeGreaterThan(0);
      expect(screen.getByTestId('safe-to-withdraw')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: 'Hapus' })).not.toBeInTheDocument();
  });

  it('disables withdraw actions but keeps legacy delete when liquidity is not initialized', async () => {
    vi.spyOn(apiModule, 'getTakeProfitOverview').mockResolvedValue({
      data: uninitializedOverview,
    });
    render(<TakeProfitPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/belum diinisialisasi/i);
      expect(screen.getAllByText('Prive owner awal bulan').length).toBeGreaterThan(0);
    });

    const openButtons = screen.getAllByRole('button', { name: /\+ Catat Tarik Laba/i });
    expect(openButtons.length).toBeGreaterThan(0);
    openButtons.forEach((btn) => expect(btn).toBeDisabled());
    expect(screen.queryByText('Rp 275.000')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Hapus' }).length).toBeGreaterThan(0);
  });

  it('disables withdraw actions when initialized but not safe', async () => {
    vi.spyOn(apiModule, 'getTakeProfitOverview').mockResolvedValue({
      data: {
        ...mockOverview,
        availableToWithdraw: '0.0000',
        liquidityShortfall: '50000.0000',
        isSafe: false,
      },
    });
    render(<TakeProfitPage />);

    await waitFor(() => {
      expect(screen.getByTestId('liquidity-shortfall')).toHaveTextContent('Rp 50.000');
    });

    const openButtons = screen.getAllByRole('button', { name: /\+ Catat Tarik Laba/i });
    expect(openButtons.length).toBe(2);
    openButtons.forEach((btn) => expect(btn).toBeDisabled());
    expect(screen.queryByRole('button', { name: 'Hapus' })).not.toBeInTheDocument();
  });

  it('keeps withdraw and delete disabled when the overview fails to load', async () => {
    vi.spyOn(apiModule, 'getTakeProfitOverview').mockRejectedValue(new Error('Server error'));
    render(<TakeProfitPage />);

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
      expect(screen.getAllByText('Prive owner awal bulan').length).toBeGreaterThan(0);
    });

    screen
      .getAllByRole('button', { name: /\+ Catat Tarik Laba/i })
      .forEach((btn) => expect(btn).toBeDisabled());
    expect(screen.queryByRole('button', { name: 'Hapus' })).not.toBeInTheDocument();
  });

  it('reloads overview and list after a legacy delete', async () => {
    const overviewSpy = vi
      .spyOn(apiModule, 'getTakeProfitOverview')
      .mockResolvedValue({ data: uninitializedOverview });
    const listSpy = vi.mocked(apiModule.listTakeProfits);
    vi.spyOn(apiModule, 'deleteTakeProfit').mockResolvedValue(undefined as never);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    render(<TakeProfitPage />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Hapus' }).length).toBeGreaterThan(0);
    });
    expect(overviewSpy).toHaveBeenCalledTimes(1);
    expect(listSpy).toHaveBeenCalledTimes(1);

    await user.click(screen.getAllByRole('button', { name: 'Hapus' })[0]);

    await waitFor(() => {
      expect(overviewSpy).toHaveBeenCalledTimes(2);
      expect(listSpy).toHaveBeenCalledTimes(2);
    });
  });
});
