import { isDebarmentActive } from "./batch-registration-policy";
/** Resolve the legacy debarment comparison in the college's IST calendar. */
export function placementCollegeDateInIndia(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function hasActivePlacementDebarment(
  records: readonly {
    liftedAt: Date | null;
    untilDate: string | null;
    untilDrives: number | null;
    drivesCounted: number;
  }[],
  now: Date,
): boolean {
  const day = placementCollegeDateInIndia(now);
  return records.some((record) => isDebarmentActive(record, day));
}
