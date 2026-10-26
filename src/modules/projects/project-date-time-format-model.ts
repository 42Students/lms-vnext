/** Shared project timestamps in IST. Intl forbids timeZoneName with dateStyle/timeStyle. */
export function formatProjectIstDateTime(value: Date | null): string {
  if (value === null) return "Not set";
  if (!Number.isFinite(value.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit",
    timeZone: "Asia/Kolkata", timeZoneName: "short",
  }).format(value);
}
