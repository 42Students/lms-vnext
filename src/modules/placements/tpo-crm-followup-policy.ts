/** Match legacy recruiter-lead "No answer" follow-up: 10:00 AM on the
 * next calendar day in Asia/Kolkata, regardless of the time of the call.
 * This is not a floating 24-hour/48-hour delay. India has no DST. */
export function nextDayTpoFollowupAt(now: Date): Date {
  if (!Number.isFinite(now.getTime())) {
    throw new RangeError("Invalid CRM follow-up clock");
  }
  const istDate = new Date(now.getTime() + 330 * 60_000);
  return new Date(Date.UTC(
    istDate.getUTCFullYear(),
    istDate.getUTCMonth(),
    istDate.getUTCDate() + 1,
    4,
    30,
  ));
}
