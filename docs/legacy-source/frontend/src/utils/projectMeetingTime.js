import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/** Return null for absent, invalid or legacy timezone values instead of crashing render. */
export function resolveProjectMeetingViewerInstant(meeting, viewerTimezone) {
  const dateValue = meeting?.meetingDate || meeting?.date || meeting?.startDate;
  const startValue = meeting?.startTime || meeting?.time;
  const sourceTimezone = meeting?.timezone || meeting?.timeZone;
  if (!dateValue || !startValue || !sourceTimezone) return null;
  try {
    const sourceInstant = dayjs.tz(`${dateValue}T${startValue}`, sourceTimezone);
    return sourceInstant.isValid() ? sourceInstant.tz(viewerTimezone || dayjs.tz.guess()) : null;
  } catch {
    // Old database records may contain timezones that dayjs/Intl cannot resolve.
    return null;
  }
}
