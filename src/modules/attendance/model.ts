export type LearnerAttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "EXCUSED"
  | "MEDICAL"
  | "LATE"
  | "NOT_MARKED"
  | "SCHEDULED";

export type LearnerAttendanceRow = {
  id: string;
  deliveryId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  sectionName: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location: string | null;
  facultyName: string | null;
  sessionStatus: "UNMARKED" | "MARKED" | null;
  recordStatus:
    | "PRESENT"
    | "ABSENT"
    | "EXCUSED"
    | "MEDICAL"
    | "LATE"
    | null;
  markedAt: Date | null;
};

export function learnerAttendanceStatus(
  row: Pick<
    LearnerAttendanceRow,
    "startsAt" | "sessionStatus" | "recordStatus"
  >,
  now = new Date(),
): LearnerAttendanceStatus {
  if (row.startsAt.getTime() > now.getTime()) {
    return "SCHEDULED";
  }

  if (row.sessionStatus !== "MARKED") {
    return "NOT_MARKED";
  }

  return row.recordStatus ?? "PRESENT";
}

export function isAttendancePresent(
  status: LearnerAttendanceStatus,
) {
  return status === "PRESENT";
}

export function summarizeLearnerAttendance(
  rows: readonly LearnerAttendanceRow[],
  now = new Date(),
) {
  const heldRows = rows.filter(
    (row) => row.startsAt.getTime() <= now.getTime(),
  );
  const statuses = heldRows.map(
    (row) => learnerAttendanceStatus(row, now),
  );
  const marked = statuses.filter(
    (status) => status !== "NOT_MARKED",
  );
  const present = marked.filter(
    isAttendancePresent,
  ).length;
  const absent = marked.length - present;
  const percentage =
    marked.length > 0
      ? Math.round(
          (present / marked.length) * 100,
        )
      : null;

  return {
    heldSessions: heldRows.length,
    markedSessions: marked.length,
    unmarkedSessions:
      statuses.length - marked.length,
    present,
    absent,
    percentage,
  };
}
