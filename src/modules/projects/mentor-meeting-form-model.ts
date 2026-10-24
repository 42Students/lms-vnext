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
  if (raw.length > 500) return false;
  try {
    const url = new URL(raw);
    return (url.protocol === "https:" || url.protocol === "http:") &&
      Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

/** Distinguish an accepted requested slot from a genuine alternative.
 * Compare UTC instants, not textual timezone spellings.
 */
export function mentorMeetingHasDifferentRequestedWindow(
  requestedStart:string,requestedEnd:string,proposedStart:string,proposedEnd:string,
):boolean{
  const originalStart=Date.parse(requestedStart),originalEnd=Date.parse(requestedEnd);
  const nextStart=Date.parse(proposedStart),nextEnd=Date.parse(proposedEnd);
  return [originalStart,originalEnd,nextStart,nextEnd].every(Number.isFinite)&&
    (originalStart!==nextStart||originalEnd!==nextEnd);
}

function istInstant(value: string): number {
  const parts=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!parts) return NaN;
  const [,rawYear,rawMonth,rawDay,rawHour,rawMinute]=parts;
  const year=Number(rawYear),month=Number(rawMonth),day=Number(rawDay);
  const hour=Number(rawHour),minute=Number(rawMinute);
  if(month<1||month>12||day<1||day>31||hour>23||minute>59) return NaN;
  const instant=new Date(value+":00+05:30");
  if(!Number.isFinite(instant.getTime()))return NaN;
  // Date silently normalizes Feb 31 / 24:00 in some runtimes. A local
  // round trip must preserve every wall-clock component, even at IST midnight.
  const local=new Date(instant.getTime()+330*60_000);
  if(local.getUTCFullYear()!==year||local.getUTCMonth()+1!==month||
    local.getUTCDate()!==day||local.getUTCHours()!==hour||
    local.getUTCMinutes()!==minute)return NaN;
  return instant.getTime();
}

export function mentorMeetingScheduleError(input: {
  title: string;
  startsAt: string;
  endsAt: string;
  meetingUrl: string;
  nowMs: number;
  draft?: boolean;
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
  if (!input.draft && !input.meetingUrl.trim()) return "Meeting link is required.";
  if (input.meetingUrl.trim() && !mentorMeetingHttpUrl(input.meetingUrl.trim())) {
    return "Enter a valid meeting link.";
  }
  return null;
}
