export type LearnerAttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "EXCUSED"
  | "MEDICAL"
  | "LATE"
  | "NOT_MARKED";

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
    "sessionStatus" | "recordStatus"
  >,
): LearnerAttendanceStatus {
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
) {
  const statuses = rows.map(
    learnerAttendanceStatus,
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
    heldSessions: rows.length,
    markedSessions: marked.length,
    unmarkedSessions:
      statuses.length - marked.length,
    present,
    absent,
    percentage,
  };
}
