import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '@/lib/api';
import { ProductOwnerBadge } from '@/components/produk/product-owner-badge';
import { ProductMarginPreview } from '@/components/produk/product-margin-preview';
import { ProductDialog } from '@/components/produk/product-dialog';
import { ProductStatusDialog } from '@/components/produk/product-status-dialog';
import ProdukPage from '@/app/(app)/produk/page';

const mockConsignors: apiModule.Consignor[] = [
  {
    id: 1,
    name: 'Pak Sani',
    phone: '08123456789',
    note: null,
    defaultMarginType: 'nominal',
    defaultMarginValue: '1000.0000',
    isActive: true,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
];

const mockProducts: apiModule.Product[] = [
  {
    id: 1,
    name: 'Gery Salut Malkist',
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
    name: 'Risoles Mayo',
    ownerType: 'consignor',
    consignorId: 1,
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
  {
    id: 3,
    name: 'Kue Sus Lama',
    ownerType: 'own',
    consignorId: null,
    consignorName: null,
    pcsPerPack: 1,
    sellPrice: '3000.0000',
    marginType: null,
    marginValue: null,
    isActive: false,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-15T00:00:00.000Z',
    marginInfo: {
      ownerMarginPerPcs: null,
      ownerMarginPerPack: null,
      consignorSharePerPcs: null,
      consignorSharePerPack: null,
    },
  },
];

describe('Product Components & Badges', () => {
  it('renders owner badges correctly', () => {
    const { rerender } = render(<ProductOwnerBadge ownerType="own" />);
    expect(screen.getByText('Milik Sendiri')).toBeInTheDocument();

    rerender(<ProductOwnerBadge ownerType="consignor" consignorName="Pak Sani" />);
    expect(screen.getByText('Titipan: Pak Sani')).toBeInTheDocument();
  });

  it('renders margin preview for own product without avgCost', () => {
    render(
      <ProductMarginPreview
        ownerType="own"
        pcsPerPack={10}
        marginInfo={null}
      />
    );
    expect(screen.getByText(/Modal beli & untung produk milik sendiri dihitung otomatis/i)).toBeInTheDocument();
  });

  it('renders margin preview for consignment product', () => {
    render(
      <ProductMarginPreview
        ownerType="consignor"
        pcsPerPack={1}
        marginInfo={{
          ownerMarginPerPcs: '1000.0000',
          ownerMarginPerPack: '1000.0000',
          consignorSharePerPcs: '6000.0000',
          consignorSharePerPack: '6000.0000',
        }}
      />
    );
    expect(screen.getByText('Untung Pemilik (Margin):')).toBeInTheDocument();
    expect(screen.getByText('Hak Penitip (Harga Setor):')).toBeInTheDocument();
  });
});

describe('ProductDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(apiModule, 'getConsignors').mockResolvedValue({
      data: mockConsignors,
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
  });

  it('shows validation error when submitting empty name', async () => {
    const user = userEvent.setup();
    render(
      <ProductDialog
        open={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Tambah Produk' }));
    expect(await screen.findByText('Nama produk wajib diisi.')).toBeInTheDocument();
  });

  it('creates an own product (Golden G1: Gery Salut)', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const onClose = vi.fn();

    const createdProduct: apiModule.Product = {
      id: 4,
      name: 'Gery Salut Malkist',
      ownerType: 'own',
      consignorId: null,
      consignorName: null,
      pcsPerPack: 10,
      sellPrice: '1500',
      marginType: null,
      marginValue: null,
      isActive: true,
      createdAt: '2026-10-04T00:00:00.000Z',
      updatedAt: '2026-10-04T00:00:00.000Z',
      marginInfo: {
        ownerMarginPerPcs: null,
        ownerMarginPerPack: null,
        consignorSharePerPcs: null,
        consignorSharePerPack: null,
      },
    };

    const spyCreate = vi.spyOn(apiModule, 'createProduct').mockResolvedValue({
      data: createdProduct,
    });

    render(
      <ProductDialog
        open={true}
        onClose={onClose}
        onSaved={onSaved}
      />
    );

    await user.type(screen.getByLabelText(/Nama Produk/i), 'Gery Salut Malkist');
    const packInput = screen.getByLabelText(/Isi per Pack/i);
    await user.clear(packInput);
    await user.type(packInput, '10');

    await user.type(screen.getByLabelText(/Harga Jual per Pcs/i), '1500');

    await user.click(screen.getByRole('button', { name: 'Tambah Produk' }));

    await waitFor(() => {
      expect(spyCreate).toHaveBeenCalledWith({
        name: 'Gery Salut Malkist',
        ownerType: 'own',
        consignorId: null,
        pcsPerPack: 10,
        sellPrice: '1500',
        marginType: null,
        marginValue: null,
      });
      expect(onSaved).toHaveBeenCalledWith(createdProduct);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('creates a consignment product with prefilled penitip default margin', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const onClose = vi.fn();

    const createdProduct: apiModule.Product = {
      id: 5,
      name: 'Risoles Mayo',
      ownerType: 'consignor',
      consignorId: 1,
      consignorName: 'Pak Sani',
      pcsPerPack: 1,
      sellPrice: '7000',
      marginType: 'nominal',
      marginValue: '1000',
      isActive: true,
      createdAt: '2026-10-04T00:00:00.000Z',
      updatedAt: '2026-10-04T00:00:00.000Z',
      marginInfo: {
        ownerMarginPerPcs: '1000.0000',
        ownerMarginPerPack: '1000.0000',
        consignorSharePerPcs: '6000.0000',
        consignorSharePerPack: '6000.0000',
      },
    };

    const spyCreate = vi.spyOn(apiModule, 'createProduct').mockResolvedValue({
      data: createdProduct,
    });

    render(
      <ProductDialog
        open={true}
        onClose={onClose}
        onSaved={onSaved}
      />
    );

    // Switch to Titipan Konsinyasi
    await user.click(screen.getByRole('button', { name: 'Titipan Konsinyasi' }));

    await user.type(screen.getByLabelText(/Nama Produk/i), 'Risoles Mayo');
    await user.type(screen.getByLabelText(/Harga Jual per Pcs/i), '7000');

    // Pak Sani default margin (1000) should be filled or fill it
    const marginInput = screen.getByLabelText(/Margin Pemilik per Pcs/i);
    await user.clear(marginInput);
    await user.type(marginInput, '1000');

    await user.click(screen.getByRole('button', { name: 'Tambah Produk' }));

    await waitFor(() => {
      expect(spyCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Risoles Mayo',
          ownerType: 'consignor',
          consignorId: 1,
          sellPrice: '7000',
          marginType: 'nominal',
          marginValue: '1000',
        })
      );
      expect(onSaved).toHaveBeenCalledWith(createdProduct);
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe('ProductStatusDialog', () => {
  it('confirms product status toggle', async () => {
    const user = userEvent.setup();
    const onStatusChanged = vi.fn();
    const onClose = vi.fn();

    const targetProduct = mockProducts[0]!;
    const updated = { ...targetProduct, isActive: false };

    const spyStatus = vi.spyOn(apiModule, 'setProductStatus').mockResolvedValue({
      data: updated,
    });

    render(
      <ProductStatusDialog
        open={true}
        product={targetProduct}
        onClose={onClose}
        onStatusChanged={onStatusChanged}
      />
    );

    expect(screen.getByText('Nonaktifkan Produk?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ya, Nonaktifkan' }));

    await waitFor(() => {
      expect(spyStatus).toHaveBeenCalledWith(targetProduct.id, false);
      expect(onStatusChanged).toHaveBeenCalledWith(updated);
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe('ProdukPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(apiModule, 'getProducts').mockResolvedValue({
      data: mockProducts,
      pagination: { page: 1, limit: 100, total: 3, totalPages: 1 },
    });
    vi.spyOn(apiModule, 'getConsignors').mockResolvedValue({
      data: mockConsignors,
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders products list and KPI cards', async () => {
    render(<ProdukPage />);

    expect(await screen.findByText('Total Produk')).toBeInTheDocument();
    expect((await screen.findAllByText('Gery Salut Malkist')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Risoles Mayo')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Kue Sus Lama')).length).toBeGreaterThan(0);
  });

  it('filters by ownership filter tab', async () => {
    const user = userEvent.setup();
    render(<ProdukPage />);

    await screen.findAllByText('Gery Salut Malkist');

    // Click "Milik Sendiri" filter
    const ownTab = screen.getByRole('button', { name: /Milik Sendiri \(2\)/i });
    await user.click(ownTab);

    expect(screen.getAllByText('Gery Salut Malkist').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Risoles Mayo').length).toBe(0);

    // Click "Titipan" filter
    const consignorTab = screen.getByRole('button', { name: /Titipan \(1\)/i });
    await user.click(consignorTab);

    expect(screen.queryAllByText('Gery Salut Malkist').length).toBe(0);
    expect(screen.getAllByText('Risoles Mayo').length).toBeGreaterThan(0);
  });

  it('filters by search input', async () => {
    const user = userEvent.setup();
    render(<ProdukPage />);

    await screen.findAllByText('Gery Salut Malkist');

    const searchInput = screen.getByPlaceholderText(/Cari nama produk atau nama mitra penitip/i);
    await user.type(searchInput, 'Risoles');

    expect(screen.queryAllByText('Gery Salut Malkist').length).toBe(0);
    expect(screen.getAllByText('Risoles Mayo').length).toBeGreaterThan(0);
  });
});
