/**
 * Mentor calendar rules mirrored from legacy /mentor/calendar.
 * All instants are stored in UTC; display and date boundaries use Asia/Kolkata.
 * REQUESTED stays actionable even when its requested slot has passed.
 */
export type MentorMeetingCalendarItem = {
  id: string;
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  title: string;
  status: "DRAFT" | "REQUESTED" | "SCHEDULED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED";
  meetingType?: "GENERAL" | "PLANNING" | "STANDUP" | "REVIEW" | "RETRO";
  startsAt: string;
  endsAt: string | null;
  timeZone: string;
  meetingUrl: string | null;
  linkedSprintTitle: string | null;
};

export function splitMentorMeetings(
  items: readonly MentorMeetingCalendarItem[],
  now: Date,
) {
  const currentTime = now.getTime();
  const upcoming: MentorMeetingCalendarItem[] = [];
  const past: MentorMeetingCalendarItem[] = [];
  for (const item of items) {
    const end = Date.parse(item.endsAt??item.startsAt);
    const start = Date.parse(item.startsAt);
    const meetingIsFuture = Number.isFinite(end) && end > currentTime ||
      !Number.isFinite(end) && Number.isFinite(start) && start > currentTime;
    if (item.status === "REQUESTED" ||
        item.status !== "CANCELLED" && meetingIsFuture) {
      upcoming.push(item);
    } else {
      past.push(item);
    }
  }
  const start = (item: MentorMeetingCalendarItem) => {
    const value = Date.parse(item.startsAt);
    return Number.isFinite(value) ? value : 0;
  };
  upcoming.sort((a, b) => start(a) - start(b) || a.id.localeCompare(b.id));
  past.sort((a, b) => start(b) - start(a) || a.id.localeCompare(b.id));
  return { upcoming, past };
}

export function mentorMeetingDisplayStatus(
  item: MentorMeetingCalendarItem, now: Date,
): string {
  if (item.status !== "SCHEDULED" && item.status !== "RESCHEDULED") return item.status;
  // Legacy meetings without a recorded end use their start instant.
  const end = Date.parse(item.endsAt??item.startsAt);
  if (!Number.isFinite(end) || !Number.isFinite(now.getTime())) return item.status;
  return end < now.getTime() ? "MISSED" : item.status;
}

export function safeMentorMeetingJoinUrl(item: MentorMeetingCalendarItem, now?: Date): string | null {
  // Legacy Join remains available for every non-cancelled meeting with a safe URL.
  // REQUESTED and COMPLETED remain read-only in this view.
  if (item.status==="CANCELLED" || !item.meetingUrl) return null;
  void now;
  try {
    const url = new URL(item.meetingUrl);
    return (url.protocol === "https:" || url.protocol === "http:") &&
      Boolean(url.hostname) && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}
