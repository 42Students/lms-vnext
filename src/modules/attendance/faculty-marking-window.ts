export type FacultyAttendanceMarkingWindow = "OPEN" | "NOT_STARTED" | "WINDOW_EXPIRED";

/** Intentional vNext Faculty policy: never mark before class start; after end, only
 * the college's correction-window period remains writable by Faculty.
 * College Admin corrections have separate authorization and are not gated here.
 * The legacy Ready to mark button allowed early marking; any relaxation here
 * must be paired with a server-side policy, per-college setting and audit.
 */
export function facultyAttendanceMarkingWindow(input: {
  startsAt: Date;
  endsAt: Date;
  correctionWindowHours: number;
  now: Date;
}): FacultyAttendanceMarkingWindow {
  const { startsAt, endsAt, correctionWindowHours, now } = input;
  const start = startsAt.getTime();
  const end = endsAt.getTime();
  const current = now.getTime();
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    !Number.isFinite(current) ||
    !Number.isFinite(correctionWindowHours) ||
    correctionWindowHours < 0 ||
    end <= start
  ) {
    return "WINDOW_EXPIRED";
  }
  const endOfCorrection = end + correctionWindowHours * 3_600_000;
  if (!Number.isFinite(endOfCorrection)) return "WINDOW_EXPIRED";
  if (current < start) return "NOT_STARTED";
  if (current > endOfCorrection) return "WINDOW_EXPIRED";
  return "OPEN";
}
