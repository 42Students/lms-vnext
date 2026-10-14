export type TpoLiveRoundFact = {
  status: string;
  scheduledAt: string | null;
  durationMinutes: number | null;
};
/** Without a persisted duration there is no reliable "happening now" window. */
export function isTpoRoundHappeningNow(round: TpoLiveRoundFact, nowIso: string) {
  if (round.status !== "SCHEDULED" || !round.scheduledAt ||
      !round.durationMinutes || round.durationMinutes <= 0) return false;
  const at = Date.parse(round.scheduledAt);
  const now = Date.parse(nowIso);
  return Number.isFinite(at) && Number.isFinite(now) &&
    now >= at && now < at + round.durationMinutes * 60_000;
}
export type TpoAttendanceCounts = {
  total: number; waiting: number; present: number;
  inInterview: number; done: number; absent: number;
  unknownAttendance: number;
};
export function summarizeTpoLiveAttendance(counts: TpoAttendanceCounts) {
  // Only ABSENT is an explicit no-show. Missing/unrecognized state is never a no-show.
  return {
    total: counts.total,
    checkedIn: counts.present + counts.inInterview + counts.done,
    noShow: counts.absent,
    pending: counts.waiting,
    unknown: counts.unknownAttendance,
  };
}
