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

/** A drive day includes every scheduled round on the current IST date. */
export function tpoIstDayWindow(nowIso: string) {
  const now = new Date(nowIso);
  if (!Number.isFinite(now.getTime())) throw new RangeError("Invalid drive day");
  const dateParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (key: "year" | "month" | "day") =>
    Number(dateParts.find(entry => entry.type === key)?.value ?? "");
  const startMs = Date.UTC(part("year"), part("month") - 1, part("day")) - 330 * 60_000;
  return { start: new Date(startMs), end: new Date(startMs + 86_400_000) };
}
export function isTpoRoundOnDriveDay(round: TpoLiveRoundFact, nowIso: string) {
  if (round.status !== "SCHEDULED" || !round.scheduledAt) return false;
  const at = Date.parse(round.scheduledAt);
  if (!Number.isFinite(at)) return false;
  const day = tpoIstDayWindow(nowIso);
  return at >= day.start.getTime() && at < day.end.getTime();
}
