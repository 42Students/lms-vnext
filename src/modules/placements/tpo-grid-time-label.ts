/** Deterministic college-facing time labels, including malformed external timestamps. */
export function tpoGridTimeLabel(value: string | null | undefined): string {
  if (!value) return "Date unavailable";
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short",
  }).format(instant) + " IST";
}
