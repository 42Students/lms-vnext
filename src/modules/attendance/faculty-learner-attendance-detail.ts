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
