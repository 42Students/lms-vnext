/** Page-scoped attention conflicts for college appointment review.
 * Booking services must independently enforce the database-level candidate,
 * interviewer and room guards before accepting a schedule mutation. */
export type CollegeInterviewConflictRow = {
  id: string;
  applicationId: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  venue?: string | null;
  meetingUrl?: string | null;
  interviewer?: string | null;
};
const activeStates = new Set(["SCHEDULED", "CONFIRMED", "RESCHEDULE_REQUESTED"]);
const identity = (value: string | null | undefined) => value?.trim().toLowerCase() || null;

export function collegeInterviewConflictIds<T extends CollegeInterviewConflictRow>(
  appointments: readonly T[],
): Set<string> {
  const active = appointments.filter(row =>
    activeStates.has(row.status) && Number.isFinite(Date.parse(row.scheduledAt)) &&
    Number.isFinite(row.durationMinutes) && row.durationMinutes > 0);
  const conflicts = new Set<string>();
  for (let i = 0; i < active.length; i++) {
    const first = active[i]!;
    const start = Date.parse(first.scheduledAt);
    const end = start + first.durationMinutes * 60_000;
    for (let j = i + 1; j < active.length; j++) {
      const other = active[j]!;
      const otherStart = Date.parse(other.scheduledAt);
      const otherEnd = otherStart + other.durationMinutes * 60_000;
      if (otherStart >= end + 15 * 60_000 || otherEnd <= start - 15 * 60_000)
        continue;
      const firstRoom = identity(first.venue) ?? identity(first.meetingUrl);
      const otherRoom = identity(other.venue) ?? identity(other.meetingUrl);
      if (first.applicationId === other.applicationId ||
          (firstRoom !== null && firstRoom === otherRoom) ||
          (identity(first.interviewer) !== null &&
            identity(first.interviewer) === identity(other.interviewer))) {
        conflicts.add(first.id);
        conflicts.add(other.id);
      }
    }
  }
  return conflicts;
}
