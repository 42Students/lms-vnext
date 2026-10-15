/** Compare instants, not their locale-formatted clock times. */
export function isFutureProjectMeetingWindow(startsAt: Date, endsAt: Date, nowMs: number): boolean {
  return Number.isFinite(startsAt.getTime()) && Number.isFinite(endsAt.getTime()) &&
    startsAt.getTime() > nowMs && endsAt.getTime() > startsAt.getTime();
}
