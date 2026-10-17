/** MEN-projects-meetings-68: a meeting becomes missed immediately after
 * its scheduled end, not after the local date changes.
 * The DB remains SCHEDULED until someone records its outcome.
 */
export function mentorMeetingDisplayStatus(
  status: string, endsAt: Date, now: Date,
): string {
  return (status === "SCHEDULED" || status === "RESCHEDULED") && endsAt.getTime() < now.getTime()
    ? "MISSED" : status;
}
