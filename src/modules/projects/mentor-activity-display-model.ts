/** Formats persisted project event types without exposing internal taxonomy in the UI. */
export function mentorActivityLabel(eventType: string): string {
  const normalized = eventType.replace(/^PROJECT[._]/i, "").replace(/[._]+/g, " ").toLowerCase().trim();
  return normalized.replace(/\b\w/g, char => char.toUpperCase()) || "Update";
}
export function mentorActivityCategory(eventType: string): string {
  const type = eventType.toUpperCase();
  if (type.includes("MEETING")) return "Meeting";
  if (type.includes("RESOURCE")) return "Resource";
  if (type.includes("SPRINT")) return "Sprint";
  if (type.includes("SUBMISSION") || type.includes("DELIVERY")) return "Submission";
  if (type.includes("MEMBER") || type.includes("TEAM")) return "Team";
  if (type.includes("TASK")) return "Task";
  return "Overview";
}
export function mentorActivityRelativeTime(occurredAt: Date | string, now: string): string {
  const gap = Date.parse(now) - new Date(occurredAt).getTime();
  if (!Number.isFinite(gap)) return "Time unavailable";
  if (gap < 60_000) return "Just now";
  if (gap < 3_600_000) return Math.floor(gap / 60_000) + "m ago";
  if (gap < 86_400_000) return Math.floor(gap / 3_600_000) + "h ago";
  return Math.floor(gap / 86_400_000) + "d ago";
}
