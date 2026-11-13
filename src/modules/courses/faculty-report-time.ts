import { DEFAULT_TIME_ZONE } from "@/config/locale";
/** Faculty reports use the college's approved IST display convention. */
export function facultyReportIstTimestamp(value: string | Date | null): string {
  if (value === null) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: DEFAULT_TIME_ZONE, dateStyle: "medium", timeStyle: "short",
  }).format(date) + " IST";
}
