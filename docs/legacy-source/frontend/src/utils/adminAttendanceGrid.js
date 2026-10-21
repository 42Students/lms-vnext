export const sessionIdOf = (session) => session?.Id ?? session?.classScheduleId ?? session?.id ?? null;
export const isSessionAbsent = (absentIds, session) => {
  const id = sessionIdOf(session);
  return id != null && (Array.isArray(absentIds) ? absentIds : []).some((absent) => String(absent) === String(id));
};
// A held session nobody took attendance for is NOT "present": the faculty grid shows it as N, and
// counting it as present inflated every student's percentage. A session counts for a student once
// it was marked (attendanceMarked) or the student has an absence row for it (legacy rows can lack
// the marked flag, and an absence implies a mark was made).
export const isSessionCounted = (absentIds, session) =>
  Boolean(session?.attendanceMarked) || isSessionAbsent(absentIds, session);
export const getAttendanceDay = (sessions, absentIds, isHeld) => {
  const held = (Array.isArray(sessions) ? sessions : []).filter(isHeld);
  const absentCount = held.filter((session) => isSessionAbsent(absentIds, session)).length;
  const countedCount = held.filter((session) => isSessionCounted(absentIds, session)).length;
  return { sessions: held, count: held.length, absentCount, countedCount,
    unmarkedCount: held.length - countedCount,
    scheduled: held.length > 0, allAbsent: held.length > 0 && absentCount === held.length };
};
