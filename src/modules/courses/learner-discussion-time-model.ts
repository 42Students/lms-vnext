/** Course discussions are college-local conversations; show an unambiguous IST
 * timestamp and avoid raw, untrusted strings in time labels. */
export function learnerDiscussionTimeLabel(value: string): string {
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric",
    minute: "2-digit", timeZone: "Asia/Kolkata", timeZoneName: "short",
  }).format(instant);
}
