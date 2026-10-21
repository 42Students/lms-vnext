/** Application retention is a read-only report, not a deletion scheduler.
 * The 365-day default window measures full days in UTC, independent of the viewer's timezone.
 */
export const COLLEGE_APPLICATION_RETENTION_DAYS = 365;

export function collegeApplicationRetentionCutoff(now: Date, days = COLLEGE_APPLICATION_RETENTION_DAYS): Date {
  if (!Number.isFinite(now.getTime())) throw new Error("Invalid retention reference date");
  if (!Number.isSafeInteger(days) || days < 1 || days > 3650) throw new Error("Invalid retention threshold");
  return new Date(now.getTime() - days * 86400000);
}
