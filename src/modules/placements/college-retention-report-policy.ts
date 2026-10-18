/** Application retention is a read-only report, not a deletion scheduler.
 * The 180-day window measures full days in UTC, independent of the viewer's timezone.
 */
export const COLLEGE_APPLICATION_RETENTION_DAYS = 180;

export function collegeApplicationRetentionCutoff(now: Date): Date {
  if (!Number.isFinite(now.getTime())) throw new Error("Invalid retention reference date");
  return new Date(now.getTime() - COLLEGE_APPLICATION_RETENTION_DAYS * 86400000);
}
