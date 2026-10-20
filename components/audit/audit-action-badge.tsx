import React from 'react';

interface AuditActionBadgeProps {
  action: string;
}

export function formatActionLabel(action: string): string {
  switch (action) {
    case 'product.created':
      return 'Tambah Produk';
    case 'product.updated':
      return 'Ubah Produk';
    case 'product.status_changed':
      return 'Ubah Status Produk';
    case 'consignor.created':
      return 'Tambah Penitip';
    case 'consignor.updated':
      return 'Ubah Data Penitip';
    case 'consignor.status_changed':
      return 'Ubah Status Penitip';
    case 'stock_in.created':
      return 'Catat Barang Masuk';
    case 'stock_in.updated':
      return 'Ubah Barang Masuk';
    case 'stock_in.deleted':
      return 'Hapus Barang Masuk';
    case 'stock_return.created':
      return 'Catat Retur Barang';
    case 'stock_return.deleted':
      return 'Hapus Retur Barang';
    case 'loss.created':
      return 'Catat Kerugian / Loss';
    case 'loss.updated':
      return 'Ubah Kerugian / Loss';
    case 'loss.deleted':
      return 'Hapus Kerugian / Loss';
    case 'opname.draft_saved':
      return 'Simpan Draft Opname';
    case 'opname.draft_deleted':
      return 'Hapus Draft Opname';
    case 'opname.finalized':
      return 'Finalisasi Opname';
    case 'consignor_payment.created':
      return 'Bayar Bagi Hasil';
    case 'consignor_payment.deleted':
      return 'Batal Pembayaran Bagi Hasil';
    case 'login_success':
      return 'Login Berhasil';
    case 'login_failed':
      return 'Login Gagal';
    case 'admin.created':
      return 'Buat Akun Admin';
    case 'admin.password_reset':
      return 'Reset Password Admin';
    default:
      return action;
  }
}

export function AuditActionBadge({ action }: AuditActionBadgeProps) {
  const label = formatActionLabel(action);

  let colorClasses = 'bg-zinc-100 text-zinc-700 border-zinc-200';

  if (action.includes('created') || action.includes('finalized') || action === 'login_success') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (action.includes('updated')) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (action.includes('deleted') || action === 'login_failed') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (action.includes('status_changed') || action.includes('loss')) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (action.includes('payment')) {
    colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
  }

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${colorClasses}`}
    >
      {label}
    </span>
  );
}
