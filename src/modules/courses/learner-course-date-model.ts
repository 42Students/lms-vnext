/** Use the learner's academic timezone for deadlines and scheduled classes,
 * independently of Node's or the browser's current timezone. */
export function formatLearnerCourseMoment(value: Date | string | null): string | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
  }).format(parsed);
}
