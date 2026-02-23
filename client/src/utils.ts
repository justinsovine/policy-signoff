// Returns a label and border/background/text classes for a policy's status badge.
export function getStatusInfo(signed: boolean, overdue: boolean) {
  if (signed) return { statusLabel: 'Signed', statusStyle: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  if (overdue) return { statusLabel: 'Overdue', statusStyle: 'border-red-200 bg-red-50 text-red-700' };
  return { statusLabel: 'Pending', statusStyle: 'border-amber-200 bg-amber-50 text-amber-700' };
}

// Returns up to two initials from a full name, e.g. "Justin Sovine" to "AT".
export function getInitials(name: string): string {
  const parts = name.trim().split(' ');                           // Split "Justin Sovine" into ["Justin", "Sovine"]
  const first = parts[0]?.[0] ?? '';                              // First letter of the first word, or '' if somehow empty
  const last = parts[parts.length - 1]?.[0] ?? '';                // First letter of the last word
  return (parts.length > 1 ? first + last : first).toUpperCase(); // Combine if 2+ words, otherwise just use first initial
}

// Formats an ISO date string into a long readable format, e.g. "February 17, 2026 at 10:00 AM".
export function formatDateTime(dateString: string | null): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Formats an ISO date string into a readable format, e.g. "Feb 10, 2026".
export function formatDate(dateString: string | null): string {
  if (!dateString) return '-'; // Return a dash if the user hasn't signed yet
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const LETTER_COLORS: Record<string, string> = {
  A: 'bg-sky-100 text-sky-700',
  B: 'bg-violet-100 text-violet-700',
  C: 'bg-amber-100 text-amber-700',
  D: 'bg-rose-100 text-rose-700',
  E: 'bg-emerald-100 text-emerald-700',
  F: 'bg-orange-100 text-orange-700',
  G: 'bg-sky-100 text-sky-700',
  H: 'bg-violet-100 text-violet-700',
  I: 'bg-amber-100 text-amber-700',
  J: 'bg-rose-100 text-rose-700',
  K: 'bg-emerald-100 text-emerald-700',
  L: 'bg-orange-100 text-orange-700',
  M: 'bg-sky-100 text-sky-700',
  N: 'bg-violet-100 text-violet-700',
  O: 'bg-amber-100 text-amber-700',
  P: 'bg-rose-100 text-rose-700',
  Q: 'bg-emerald-100 text-emerald-700',
  R: 'bg-orange-100 text-orange-700',
  S: 'bg-sky-100 text-sky-700',
  T: 'bg-violet-100 text-violet-700',
  U: 'bg-amber-100 text-amber-700',
  V: 'bg-rose-100 text-rose-700',
  W: 'bg-emerald-100 text-emerald-700',
  X: 'bg-orange-100 text-orange-700',
  Y: 'bg-sky-100 text-sky-700',
  Z: 'bg-violet-100 text-violet-700',
};

// Maps each starting letter to one of six colors, cycling A-F, G-L, etc.
export function getAvatarColor(name: string): string {
  const firstLetter = name.charAt(0).toUpperCase();
  return LETTER_COLORS[firstLetter] ?? 'bg-zinc-100 text-zinc-600'; // Falls back to zinc if name is empty or starts with non-letter
}
