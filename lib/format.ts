/**
 * Pure formatting utilities for Febriyann Store UI (BR-01, BR-02, BR-05).
 * Never converts money amounts to native JS float numbers.
 */

export function formatRupiah(value: string | null | undefined): string {
  if (!value || value.trim() === '') {
    return '—';
  }

  const trimmed = value.trim();
  const isNegative = trimmed.startsWith('-');
  const absStr = isNegative ? trimmed.slice(1) : trimmed;

  const [intPart = '0', decPart = ''] = absStr.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const trimmedDec = decPart.replace(/0+$/, '');

  const sign = isNegative ? '-Rp ' : 'Rp ';
  if (trimmedDec.length > 0) {
    return `${sign}${formattedInt},${trimmedDec}`;
  }
  return `${sign}${formattedInt}`;
}

export function formatPercent(value: string | null | undefined): string {
  if (!value || value.trim() === '') {
    return '—';
  }

  const trimmed = value.trim();
  const [intPart = '0', decPart = ''] = trimmed.split('.');
  const trimmedDec = decPart.replace(/0+$/, '');

  if (trimmedDec.length > 0) {
    return `${intPart},${trimmedDec}%`;
  }
  return `${intPart}%`;
}

export function formatDateIndo(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}
