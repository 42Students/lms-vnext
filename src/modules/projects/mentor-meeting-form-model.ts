/** User-facing validation for the mentor schedule dialog. Local wall times use IST. */
export function mentorMeetingCeremonyLabel(value: string): string {
  switch (value) {
    case "GENERAL": return "General";
    case "PLANNING": return "Sprint planning";
    case "STANDUP": return "Stand-up";
    case "REVIEW": return "Sprint review";
    case "RETRO": return "Retrospective";
    default: return "General";
  }
}

export function mentorMeetingHttpUrl(raw: string): boolean {
  if (raw.length > 2048) return false;
  try {
    const url = new URL(raw);
    return (url.protocol === "https:" || url.protocol === "http:") &&
      Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function istInstant(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return NaN;
  return new Date(value + ":00+05:30").getTime();
}

export function mentorMeetingScheduleError(input: {
  title: string;
  startsAt: string;
  endsAt: string;
  meetingUrl: string;
  nowMs: number;
}): string | null {
  if (!input.title.trim()) return "Meeting title is required.";
  if (!input.startsAt) return "Meeting date is required.";
  const start = istInstant(input.startsAt);
  if (!Number.isFinite(start)) return "Enter a valid meeting date.";
  if (start <= input.nowMs) return "Meeting date must be in the future.";
  if (!input.endsAt) return "End time is required.";
  const end = istInstant(input.endsAt);
  if (!Number.isFinite(end) || end <= start) {
    return "Meeting end time must be after the start time.";
  }
  if (!input.meetingUrl.trim()) return "Meeting link is required.";
  if (!mentorMeetingHttpUrl(input.meetingUrl.trim())) {
    return "Enter a valid meeting link.";
  }
  return null;
}
