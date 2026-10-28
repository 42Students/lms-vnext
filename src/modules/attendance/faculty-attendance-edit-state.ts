/**
 * Faculty marking persists ABSENT rows, while College Admin may also persist
 * PRESENT, EXCUSED, MEDICAL or LATE. Only explicit ABSENT records should
 * open as absent: treating every saved record as an absence silently changes
 * administrator-reviewed attendance when a faculty member reopens a session.
 *
 * Keep this derived state scoped to the selected schedule event.
 */
export function initialAbsencesForSession(
  roster: readonly { membershipId: string }[],
  absenceRecords: readonly { scheduleEventId: string; membershipId: string; status: string }[],
  scheduleEventId: string,
): Set<string> {
  const recorded = new Set(
    absenceRecords
      .filter((record) => record.scheduleEventId === scheduleEventId && record.status === "ABSENT")
      .map((record) => record.membershipId),
  );
  return new Set(
    roster
      .filter((member) => recorded.has(member.membershipId))
      .map((member) => member.membershipId),
  );
}

/** Never open a cross-Section or invented session from URL input. */
export function resolveFacultyAttendanceSession(
  sessions: readonly { id: string }[],
  requested: unknown,
) {
  if (typeof requested === "string" && sessions.some((session) => session.id === requested)) {
    return requested;
  }
  return sessions[0]?.id ?? "";
}

/** An absent or invalid Calendar deep link must NOT activate Mark mode.
 * Normal Attendance navigation must open the monthly Report. */
export function resolveFacultyAttendanceDeepLink(
  sessions: readonly { id: string }[], requested: unknown,
): string | null {
  if (typeof requested !== "string") return null;
  return sessions.some((session) => session.id === requested) ? requested : null;
}

/** Compare absence sets by roster identity, never by Set iteration order. */
export function facultyAttendanceMarksDirty(
 roster:readonly {membershipId:string}[],
 persisted:ReadonlySet<string>,
 edited:ReadonlySet<string>,
):boolean {
 return roster.some(member=>persisted.has(member.membershipId)!==edited.has(member.membershipId));
}
