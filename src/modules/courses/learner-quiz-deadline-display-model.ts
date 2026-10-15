/** A quiz deadline is an absolute persisted instant, not a browser-local date.
 * Invalid stored values never masquerade as actual submission times. */
export function learnerQuizDeadlineDisplay(value: string | null): string {
  if (!value) return "No deadline";
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) return "Deadline unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
  }).format(instant);
}
