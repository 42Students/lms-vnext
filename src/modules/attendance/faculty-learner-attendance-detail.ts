import { facultyAttendanceDayCell } from "./faculty-grid-model";

export type AttendanceDetailSession = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  attendanceStatus: string | null;
};
export type AttendanceDetailRecord = {
  scheduleEventId: string;
  membershipId: string;
  status: string;
  markedAt: string;
  note: string | null;
};

export function facultyLearnerAttendanceDetail(
  membershipId: string,
  sessions: readonly AttendanceDetailSession[],
  records: readonly AttendanceDetailRecord[],
  now: Date,
) {
  const bySession = new Map(
    records.filter((row) => row.membershipId === membershipId)
      .map((row) => [row.scheduleEventId, row] as const),
  );
  const rows = sessions
    .map((session) => {
      const record = bySession.get(session.id) ?? null;
      const cell = facultyAttendanceDayCell(
        [session],
        record ? new Map([[session.id, record]]) : new Map(),
        now,
      );
      return {
        ...session,
        code: cell.code,
        label: cell.label,
        note: record?.note ?? null,
        markedAt: record?.markedAt ?? null,
      };
    })
    .sort((a, b) =>
      new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime() ||
      a.id.localeCompare(b.id),
    );
  const present = rows.filter((row) => row.code === "P").length;
  const absent = rows.filter((row) => row.code === "A").length;
  const unmarked = rows.filter((row) => row.code === "—").length;
  const upcoming = rows.filter((row) => row.code === "S").length;
  const marked = present + absent;
  return {
    rows,
    present,
    absent,
    unmarked,
    upcoming,
    marked,
    // An unknown/unmarked session is never silently counted as Present.
    attendedPercent: marked > 0 ? Math.round((present / marked) * 100) : null,
  };
}


/** Health for active learners in an authorized Section, excluding historic
 * departures from the class denominator and excluding unmarked sessions. */
export function facultyAttendanceMonthSummary(
  learnerIds: readonly string[],
  sessions: readonly AttendanceDetailSession[],
  records: readonly AttendanceDetailRecord[],
  now: Date,
) {
  const ids = [...new Set(learnerIds)];
  const eligible = new Set(ids);
  const recordsByLearner = new Map<string, AttendanceDetailRecord[]>();
  for (const record of records) {
    if (!eligible.has(record.membershipId)) continue;
    const group = recordsByLearner.get(record.membershipId) ?? [];
    group.push(record);
    recordsByLearner.set(record.membershipId, group);
  }
  const learners = ids.map((membershipId) => {
    const detail = facultyLearnerAttendanceDetail(
      membershipId, sessions, recordsByLearner.get(membershipId) ?? [], now,
    );
    return {
      membershipId,
      present: detail.present,
      absent: detail.absent,
      unmarked: detail.unmarked,
      upcoming: detail.upcoming,
      percentage: detail.attendedPercent,
    };
  });
  const sum = (key: "present" | "absent" | "unmarked" | "upcoming") =>
    learners.reduce((total, learner) => total + learner[key], 0);
  const presentMarks = sum("present");
  const absentMarks = sum("absent");
  const markedMarks = presentMarks + absentMarks;
  return {
    learnerCount: ids.length,
    // Only MARKED sessions are evidenced as held; future timetable rows
    // remain in upcomingSessions and do not inflate legacy held counts.
    sessionCount: sessions.filter((s) => s.attendanceStatus === "MARKED").length,
    markedSessions: sessions.filter((s) => s.attendanceStatus === "MARKED").length,
    unmarkedSessions: sessions.filter((s) =>
      new Date(s.startsAt).getTime() <= now.getTime() &&
      s.attendanceStatus !== "MARKED",
    ).length,
    upcomingSessions: sessions.filter((s) =>
      new Date(s.startsAt).getTime() > now.getTime(),
    ).length,
    presentMarks,
    absentMarks,
    markedMarks,
    unmarkedMarks: sum("unmarked"),
    upcomingMarks: sum("upcoming"),
    averagePercent: markedMarks > 0 ? Math.round(presentMarks / markedMarks * 100) : null,
    learners,
  };
}


/** Advisory attendance risk uses exact mark counts, not rounded display values.
 * Unknown learners do not become "safe" or "below threshold" by default. */
export function facultyAttendanceThresholdBreakdown(
  learners: readonly {
    membershipId: string;
    present: number;
    absent: number;
  }[],
  rawThreshold: number,
) {
  const threshold = Number.isFinite(rawThreshold) && rawThreshold >= 1 && rawThreshold <= 100
    ? rawThreshold : 75;
  const below: string[] = [];
  const unknown: string[] = [];
  let meets = 0;
  for (const row of learners) {
    const marked = row.present + row.absent;
    if (marked === 0) unknown.push(row.membershipId);
    else if (row.present * 100 < threshold * marked) below.push(row.membershipId);
    else meets += 1;
  }
  return { threshold, below, unknown, meets };
}
