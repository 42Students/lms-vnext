/**
 * Mentor calendar rules mirrored from legacy /mentor/calendar.
 * All times are UTC instants from timestamptz; display uses the viewer timezone.
 * REQUESTED stays actionable even when its requested slot has passed.
 */
export type MentorMeetingCalendarItem = {
  id: string;
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  title: string;
  status: "REQUESTED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  startsAt: string;
  endsAt: string;
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
    const end = Date.parse(item.endsAt);
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
  if (item.status !== "SCHEDULED") return item.status;
  // Legacy's MISSED badge derives from a scheduled meeting dated before today;
  // do not persist a synthetic MISSED state in PostgreSQL.
  const start = Date.parse(item.startsAt);
  if (!Number.isFinite(start)) return item.status;
  // Compare calendar dates in the meeting's declared IANA timezone, not
  // the server process timezone (which is often UTC in production).
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: item.timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    });
    const dateKey = (date: Date) => {
      const parts = formatter.formatToParts(date);
      const get = (type: string) => parts.find(part => part.type === type)?.value ?? "";
      return get("year") + get("month") + get("day");
    };
    return dateKey(new Date(start)) < dateKey(now) ? "MISSED" : item.status;
  } catch {
    // Invalid stored timezone must not turn a scheduled meeting into MISSED.
    return item.status;
  }
}

export function safeMentorMeetingJoinUrl(item: MentorMeetingCalendarItem): string | null {
  if (item.status === "CANCELLED" || !item.meetingUrl) return null;
  try {
    const url = new URL(item.meetingUrl);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}
