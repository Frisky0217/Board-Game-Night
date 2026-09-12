/**
 * `played_on` is a bare YYYY-MM-DD date with no timezone. Passing it to
 * `new Date("2026-09-12")` parses it as UTC midnight, which renders as the
 * previous day in any negative-offset timezone. Building from the parts gives a
 * local date instead. The locale is pinned so server rendering is deterministic.
 */
export function formatPlayedOn(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatWinRate(winRate: number | null) {
  return winRate === null ? "—" : `${Math.round(winRate * 100)}%`;
}
