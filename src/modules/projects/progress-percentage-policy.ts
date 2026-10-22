/** Legacy shared workspace progress: rounded completed tasks plus completed
 * sprints divided by all tasks and sprints. Status is a separate persisted
 * decision: a rounded 100% may precede the exact final completion boundary.
 * Do not cap the display at 99 when there is still a fractional task left. */
export function projectCompletionPercent(completed: number, total: number): number | null {
  if (!Number.isFinite(total) || !Number.isFinite(completed) || total <= 0) return null;
  const done = Math.max(0, Math.min(total, completed));
  return Math.max(0, Math.min(100, Math.round(100 * done / total)));
}
