interface Props {
  ownerType: 'own' | 'consignor';
  consignorName?: string | null;
}

export function ProductOwnerBadge({ ownerType, consignorName }: Props) {
  if (ownerType === 'own') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
        <span className="size-1.5 rounded-full bg-zinc-400" />
        Milik Sendiri
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-orange-50/80 text-[#D97757] border border-orange-200">
      <span className="size-1.5 rounded-full bg-[#D97757]" />
      <span>Titipan: {consignorName || 'Penitip'}</span>
    </span>
  );
}
