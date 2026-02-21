export function getStatusInfo(signed: boolean, overdue: boolean) {
  if (signed) return { statusLabel: 'Signed', statusStyle: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  if (overdue) return { statusLabel: 'Overdue', statusStyle: 'border-red-200 bg-red-50 text-red-700' };
  return { statusLabel: 'Pending', statusStyle: 'border-amber-200 bg-amber-50 text-amber-700' };
}
