/** A rounded 100% is reserved for work that is fully completed. */
export function projectCompletionPercent(completed: number, total: number): number | null {
  if (!Number.isFinite(total) || !Number.isFinite(completed) || total <= 0) return null;
  const done = Math.max(0, Math.min(total, completed));
  return done === total ? 100 : Math.min(99, Math.round(100 * done / total));
}
