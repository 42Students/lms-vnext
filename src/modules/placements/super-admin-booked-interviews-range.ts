/** Validate calendar day inputs before constructing IST bounds.
 * JavaScript Date otherwise silently normalizes invalid days (e.g. 2026-02-31).
 * The exclusive end is local midnight AFTER the requested last day.
 */
export function superAdminBookedInterviewWindow(from: string, to: string):
  { fromDate: Date; toDate: Date } | null {
  const parseDay = (day: string): Date | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
    const utc = new Date(day + "T00:00:00Z");
    if (!Number.isFinite(utc.getTime()) || utc.toISOString().slice(0, 10) !== day)
      return null;
    return new Date(day + "T00:00:00+05:30");
  };
  const fromDate = parseDay(from);
  const lastDate = parseDay(to);
  if (!fromDate || !lastDate || lastDate < fromDate) return null;
  const toDate = new Date(lastDate.getTime() + 86_400_000);
  if (!Number.isFinite(toDate.getTime())) return null;
  return { fromDate, toDate };
}
