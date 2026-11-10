import { render, screen, waitFor, within } from '@testing-library/react';
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

    it('expands item details when clicking Lihat Rincian button', async () => {
      const user = userEvent.setup();
      render(<BarangMasukPage />);

      await waitFor(() => {
        expect(screen.getByText('Barang Masuk & Retur')).toBeInTheDocument();
      });

      const expandBtn = screen.getAllByRole('button', { name: /Lihat Rincian/i })[0]!;
      await user.click(expandBtn);

      // Verify line details appear in the DOM (mobile card view)
      await waitFor(() => {
        expect(screen.getByText('Item Produk:')).toBeInTheDocument();
        expect(screen.getByText('(2 pack)')).toBeInTheDocument();
      });
    });
  });

  describe('StockInDialog', () => {
    it('renders all lines when editing stock in with multiple lines', () => {
      const onSaved = vi.fn();
      const onClose = vi.fn();

      const multiLineStockIn: apiModule.StockIn = {
        id: 102,
        type: 'initial',
        date: '2026-10-01',
        note: 'Stok awal 2 item',
        opnameId: null,
        totalCost: '35000.0000',
        totalQtyPcs: 30,
        linesCount: 2,
        lines: [
          {
            id: 11,
            stockInId: 102,
            productId: 1,
            productName: 'Gery Salut',
            ownerType: 'own',
            consignorName: null,
            inputMode: 'pack',
            qtyPack: 2,
            pcsPerPackSnapshot: 10,
            qtyPcs: 20,
            totalCost: '35000.0000',
            createdAt: '2026-10-01T00:00:00.000Z',
            updatedAt: '2026-10-01T00:00:00.000Z',
          },
          {
            id: 12,
            stockInId: 102,
            productId: 2,
            productName: 'Lemper Ayam Pak Sani',
            ownerType: 'consignor',
            consignorName: 'Pak Sani',
            inputMode: 'pcs',
            qtyPack: null,
            pcsPerPackSnapshot: 1,
            qtyPcs: 10,
            totalCost: '0.0000',
            createdAt: '2026-10-01T00:00:00.000Z',
            updatedAt: '2026-10-01T00:00:00.000Z',
          },
        ],
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      };

      render(
        <StockInDialog
          open={true}
          onClose={onClose}
          onSaved={onSaved}
          initialData={multiLineStockIn}
          products={mockProducts}
        />,
      );

      // Verify header indicates editing
      expect(screen.getByText('Ubah Barang Masuk')).toBeInTheDocument();

      // Verify both items are rendered
      expect(screen.getByText('Daftar Barang (2 Item)')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
    });

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

  describe('Stock-in purchase payments', () => {
    const consignmentStockIn: apiModule.StockIn = {
      id: 103,
      type: 'consignment_in',
      date: '2026-10-05',
      note: 'Setoran lemper',
      opnameId: null,
      totalCost: '0.0000',
      totalQtyPcs: 5,
      linesCount: 1,
      lines: [],
      createdAt: '2026-10-05T00:00:00.000Z',
      updatedAt: '2026-10-05T00:00:00.000Z',
    };

    const historyPartial: apiModule.StockInPaymentHistory = {
      stockInId: 101,
      receiptTotal: '35000.0000',
      paidAmount: '10000.0000',
      outstandingAmount: '25000.0000',
      payments: [
        {
          id: 501,
          stockInId: 101,
          amount: '10000.0000',
          paymentDate: '2026-10-06',
          paymentMethod: 'transfer',
          note: 'DP ke agen',
          createdBy: 1,
          createdAt: '2026-10-06T03:00:00.000Z',
        },
      ],
    };

    const historyAfterPayment: apiModule.StockInPaymentHistory = {
      ...historyPartial,
      paidAmount: '20000.0000',
      outstandingAmount: '15000.0000',
      payments: [
        ...historyPartial.payments,
        {
          id: 502,
          stockInId: 101,
          amount: '10000.0000',
          paymentDate: '2026-10-07',
          paymentMethod: 'qris',
          note: null,
          createdBy: 1,
          createdAt: '2026-10-07T03:00:00.000Z',
        },
      ],
    };

    const purchaseStockIn = mockStockIns[0]!;

    it('createStockInPayment posts same-origin JSON with the Idempotency-Key header', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ data: historyAfterPayment.payments[1] }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        }),
      );
      const key = '3f2b8c1e-8a4d-4c2b-9f1e-1234567890ab';

      const res = await apiModule.createStockInPayment(
        101,
        { amount: '10000', paymentDate: '2026-10-07', paymentMethod: 'qris', note: null },
        key,
      );

      expect(res.data.id).toBe(502);
      const [url, init] = fetchSpy.mock.calls[0]!;
      expect(url).toBe('/api/v1/stock-ins/101/payments');
      expect(init?.method).toBe('POST');
      const headers = new Headers(init?.headers);
      expect(headers.get('Idempotency-Key')).toBe(key);
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(JSON.parse(String(init?.body))).toEqual({
        amount: '10000',
        paymentDate: '2026-10-07',
        paymentMethod: 'qris',
        note: null,
      });
    });

    it('getStockInPayments fetches same-origin payment history', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ data: historyPartial }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

      const res = await apiModule.getStockInPayments(101);

      expect(res.data.outstandingAmount).toBe('25000.0000');
      expect(fetchSpy.mock.calls[0]![0]).toBe('/api/v1/stock-ins/101/payments');
    });

    it('offers payment action only for purchase stock-ins on desktop and mobile', async () => {
      vi.spyOn(apiModule, 'getStockIns').mockResolvedValue({
        data: [purchaseStockIn, consignmentStockIn],
        pagination: { page: 1, limit: 100, total: 2, totalPages: 1 },
      });
      render(<BarangMasukPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Setoran lemper').length).toBeGreaterThan(0);
      });

      const payButtons = screen.getAllByRole('button', { name: /Pembayaran belanja/i });
      // One in desktop table, one in mobile card, both for the purchase only.
      expect(payButtons).toHaveLength(2);
      payButtons.forEach((btn) => {
        expect(btn).toHaveAccessibleName('Pembayaran belanja 2026-10-04');
      });
    });

    it('loads history on open and shows totals, outstanding and immutable history', async () => {
      const getSpy = vi
        .spyOn(apiModule, 'getStockInPayments')
        .mockResolvedValue({ data: historyPartial });
      const user = userEvent.setup();
      render(<BarangMasukPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Pembayaran belanja/i }).length).toBe(2);
      });
      await user.click(screen.getAllByRole('button', { name: /Pembayaran belanja/i })[0]!);

      const dialog = await screen.findByRole('dialog', { name: /Pembayaran Belanja/i });

      await waitFor(() => {
        expect(getSpy).toHaveBeenCalledWith(101);
        expect(screen.getByTestId('payment-receipt-total')).toHaveTextContent('Rp 35.000');
      });
      expect(screen.getByTestId('payment-paid-amount')).toHaveTextContent('Rp 10.000');
      expect(screen.getByTestId('payment-outstanding-amount')).toHaveTextContent('Rp 25.000');
      expect(screen.getByText('Belum Lunas')).toBeInTheDocument();

      const history = screen.getByRole('list', { name: /Riwayat pembayaran/i });
      expect(history).toHaveTextContent('2026-10-06');
      expect(history).toHaveTextContent('Transfer');
      expect(history).toHaveTextContent('DP ke agen');
      expect(history).toHaveTextContent('Rp 10.000');
      // History is append-only: no edit/delete controls.
      expect(within(dialog).queryByRole('button', { name: /Hapus|Ubah|Edit/i })).toBeNull();
    });

    it('shows loading state and blocks submit while history loads', async () => {
      vi.spyOn(apiModule, 'getStockInPayments').mockReturnValue(new Promise(() => {}));
      const { StockInPaymentDialog } = await import(
        '@/components/barang-masuk/stock-in-payment-dialog'
      );
      render(<StockInPaymentDialog open stockIn={purchaseStockIn} onClose={vi.fn()} />);

      expect(screen.getByText(/Memuat riwayat pembayaran/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Simpan Pembayaran/i })).toBeDisabled();
    });

    it('shows a load error when history fails', async () => {
      vi.spyOn(apiModule, 'getStockInPayments').mockRejectedValue(
        new apiModule.ApiError(500, 'INTERNAL', 'Server sedang bermasalah.'),
      );
      const { StockInPaymentDialog } = await import(
        '@/components/barang-masuk/stock-in-payment-dialog'
      );
      render(<StockInPaymentDialog open stockIn={purchaseStockIn} onClose={vi.fn()} />);

      expect(await screen.findByRole('alert')).toHaveTextContent('Server sedang bermasalah.');
    });

    it('validates amount client-side and never exceeds outstanding', async () => {
      vi.spyOn(apiModule, 'getStockInPayments').mockResolvedValue({ data: historyPartial });
      const createSpy = vi.spyOn(apiModule, 'createStockInPayment');
      const { StockInPaymentDialog } = await import(
        '@/components/barang-masuk/stock-in-payment-dialog'
      );
      const user = userEvent.setup();
      render(<StockInPaymentDialog open stockIn={purchaseStockIn} onClose={vi.fn()} />);

      await screen.findByTestId('payment-outstanding-amount');
      const amountInput = screen.getByLabelText(/Nominal Pembayaran/i);
      const submit = screen.getByRole('button', { name: /Simpan Pembayaran/i });

      await user.click(submit);
      expect(await screen.findByRole('alert')).toHaveTextContent(/lebih besar dari 0/i);

      await user.type(amountInput, '30000');
      await user.click(submit);
      expect(await screen.findByRole('alert')).toHaveTextContent(/melebihi sisa tagihan/i);

      expect(createSpy).not.toHaveBeenCalled();
    });

    it('records a partial payment with a UUID key, then refreshes history', async () => {
      const getSpy = vi
        .spyOn(apiModule, 'getStockInPayments')
        .mockResolvedValueOnce({ data: historyPartial })
        .mockResolvedValueOnce({ data: historyAfterPayment });
      const createSpy = vi
        .spyOn(apiModule, 'createStockInPayment')
        .mockResolvedValue({ data: historyAfterPayment.payments[1]! });
      const key = '11111111-2222-4333-8444-555555555555';
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(key);
      const onPaid = vi.fn();
      const { StockInPaymentDialog } = await import(
        '@/components/barang-masuk/stock-in-payment-dialog'
      );
      const user = userEvent.setup();
      render(
        <StockInPaymentDialog open stockIn={purchaseStockIn} onClose={vi.fn()} onPaid={onPaid} />,
      );

      await screen.findByTestId('payment-outstanding-amount');
      await user.type(screen.getByLabelText(/Nominal Pembayaran/i), '10000');
      const dateInput = screen.getByLabelText(/Tanggal Pembayaran/i);
      await user.clear(dateInput);
      await user.type(dateInput, '2026-10-07');
      await user.selectOptions(screen.getByLabelText(/Metode Pembayaran/i), 'qris');
      await user.click(screen.getByRole('button', { name: /Simpan Pembayaran/i }));

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith(
          101,
          { amount: '10000', paymentDate: '2026-10-07', paymentMethod: 'qris', note: null },
          key,
        );
      });
      expect(await screen.findByRole('status')).toHaveTextContent(/Pembayaran berhasil dicatat/i);
      await waitFor(() => {
        expect(getSpy).toHaveBeenCalledTimes(2);
        expect(screen.getByTestId('payment-outstanding-amount')).toHaveTextContent('Rp 15.000');
      });
      expect(screen.getByRole('list', { name: /Riwayat pembayaran/i })).toHaveTextContent('QRIS');
      expect(onPaid).toHaveBeenCalledTimes(1);
    });

    it('shows server errors and reuses the same key when retrying the same payment', async () => {
      vi.spyOn(apiModule, 'getStockInPayments').mockResolvedValue({ data: historyPartial });
      const createSpy = vi
        .spyOn(apiModule, 'createStockInPayment')
        .mockRejectedValueOnce(
          new apiModule.ApiError(0, 'NETWORK_ERROR', 'Tidak dapat terhubung ke server.'),
        )
        .mockResolvedValueOnce({ data: historyAfterPayment.payments[1]! });
      const uuidSpy = vi
        .spyOn(crypto, 'randomUUID')
        .mockReturnValueOnce('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
        .mockReturnValueOnce('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
      const { StockInPaymentDialog } = await import(
        '@/components/barang-masuk/stock-in-payment-dialog'
      );
      const user = userEvent.setup();
      render(<StockInPaymentDialog open stockIn={purchaseStockIn} onClose={vi.fn()} />);

      await screen.findByTestId('payment-outstanding-amount');
      await user.type(screen.getByLabelText(/Nominal Pembayaran/i), '5000');
      await user.click(screen.getByRole('button', { name: /Simpan Pembayaran/i }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Tidak dapat terhubung ke server.');

      await user.click(screen.getByRole('button', { name: /Simpan Pembayaran/i }));
      await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(2));

      expect(createSpy.mock.calls[0]![2]).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
      expect(createSpy.mock.calls[1]![2]).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
      expect(createSpy.mock.calls[1]![1]).toEqual(createSpy.mock.calls[0]![1]);
      expect(uuidSpy).toHaveBeenCalledTimes(1);
    });

    it('marks fully paid receipts as Lunas and disables new payments', async () => {
      vi.spyOn(apiModule, 'getStockInPayments').mockResolvedValue({
        data: {
          ...historyPartial,
          paidAmount: '35000.0000',
          outstandingAmount: '0.0000',
        },
      });
      const { StockInPaymentDialog } = await import(
        '@/components/barang-masuk/stock-in-payment-dialog'
      );
      render(<StockInPaymentDialog open stockIn={purchaseStockIn} onClose={vi.fn()} />);

      expect(await screen.findByText('Lunas')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Simpan Pembayaran/i })).toBeDisabled();
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
