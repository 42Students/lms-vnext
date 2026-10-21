export type FacultyAttendanceSessionLike = {
  id: string;
  startsAt: string;
  attendanceStatus: string | null;
};

export type FacultyAttendanceRecordLike = {
  scheduleEventId: string;
  membershipId: string;
  status: string;
};

export type FacultyAttendanceDayCell = {
  code: "P" | "A" | "—" | "S" | "MIXED";
  label: string;
  present: number;
  absent: number;
  notMarked: number;
  scheduled: number;
  sessionCount: number;
  ratio: string | null;
};

const INDIA_TIME_ZONE = "Asia/Kolkata";

export function indiaAttendanceDayKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("Attendance date must be valid");
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function indiaAttendanceMonthKey(value: string | Date) {
  return indiaAttendanceDayKey(value).slice(0, 7);
}

/** Move an India-local YYYY-MM month without using the viewer's timezone. */
export function shiftIndiaAttendanceMonth(value: string, offset: number) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value) || !Number.isInteger(offset)) {
    return value;
  }
  const [year, month] = value.split("-").map(Number);
  const shifted = new Date(Date.UTC(year!, month! - 1 + offset, 1));
  return shifted.getUTCFullYear() + "-" +
    String(shifted.getUTCMonth() + 1).padStart(2, "0");
}

export function groupFacultyAttendanceSessionsByIndiaDay<
  T extends FacultyAttendanceSessionLike,
>(sessions: readonly T[]) {
  const groups = new Map<string, T[]>();
  for (const session of sessions) {
    const key = indiaAttendanceDayKey(session.startsAt);
    const bucket = groups.get(key) ?? [];
    bucket.push(session);
    groups.set(key, bucket);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([dayKey, rows]) => ({
      dayKey,
      sessions: [...rows].sort(
        (a, b) =>
          new Date(a.startsAt).getTime() -
            new Date(b.startsAt).getTime() ||
          a.id.localeCompare(b.id),
      ),
    }));
}

/** A learner's late arrival or excused/medical attendance is not an
 * explicit legacy absence; only ABSENT increments the absent count. */
function isAbsenceLike(status: string | undefined) {
  return status === "ABSENT";
}

export function facultyAttendanceDayCell(
  sessions: readonly FacultyAttendanceSessionLike[],
  recordsBySession: ReadonlyMap<string, FacultyAttendanceRecordLike>,
  now = new Date(),
): FacultyAttendanceDayCell {
  let present = 0;
  let absent = 0;
  let notMarked = 0;
  let scheduled = 0;

  for (const session of sessions) {
    const startsAt = new Date(session.startsAt);
    if (startsAt.getTime() > now.getTime()) {
      scheduled += 1;
      continue;
    }
    const record = recordsBySession.get(session.id);
    if (session.attendanceStatus !== "MARKED") {
      // A legacy/imported absence is itself evidence that this learner was
      // marked, even when the session-level marker is missing.
      if (record && isAbsenceLike(record.status)) absent += 1;
      else if(record && ["PRESENT","LATE","EXCUSED","MEDICAL"].includes(record.status)) present += 1;
      else notMarked += 1;
      continue;
    }
    if (record && isAbsenceLike(record.status)) absent += 1;
    else present += 1;
  }

  const sessionCount = sessions.length;
  const heldCount = present + absent + notMarked;

  if (heldCount === 0 && scheduled > 0) {
    return {
      code: "S",
      label: sessionCount === 1 ? "Scheduled" : `${scheduled} scheduled sessions`,
      present,
      absent,
      notMarked,
      scheduled,
      sessionCount,
      ratio: null,
    };
  }

  if (heldCount > 0 && notMarked === heldCount && scheduled === 0) {
    return {
      code: "—",
      label: heldCount === 1 ? "Not marked yet" : `0 present, 0 absent, ${notMarked} not marked of ${sessionCount} sessions`,
      present,
      absent,
      notMarked,
      scheduled,
      sessionCount,
      ratio: null,
    };
  }

  if (
    sessionCount === 1 &&
    scheduled === 0 &&
    notMarked === 0
  ) {
    const isAbsent = absent === 1;
    return {
      code: isAbsent ? "A" : "P",
      label: isAbsent ? "Absent" : "Present",
      present,
      absent,
      notMarked,
      scheduled,
      sessionCount,
      ratio: null,
    };
  }

  return {
    code: "MIXED",
    label: `${present} present, ${absent} absent, ${notMarked} not marked${scheduled ? `, ${scheduled} scheduled` : ""} of ${sessionCount} sessions`,
    present,
    absent,
    notMarked,
    scheduled,
    sessionCount,
    ratio: `${present}/${heldCount}`,
  };
}
