/** Inclusive IST start and exclusive following midnight. Using the start of
 * the following day avoids dropping sub-millisecond PostgreSQL timestamps at
 * 23:59:59.999; IST has no daylight saving transitions. Date strings are
 * validated as ISO calendar dates by superAdminHiringReportQuery. */
export function istStartOfDay(value: string): Date {
  return new Date(value + "T00:00:00+05:30");
}
export function istStartOfNextDay(value: string): Date {
  return new Date(istStartOfDay(value).getTime() + 86_400_000);
}
