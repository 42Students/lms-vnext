export const TPO_ROUND_ATTENDANCE_STATES = [
  "WAITING",
  "PRESENT",
  "IN_INTERVIEW",
  "DONE",
  "ABSENT",
] as const;

export type TpoRoundAttendanceState =
  | (typeof TPO_ROUND_ATTENDANCE_STATES)[number]
  | "UNKNOWN";

export type TpoRoundRosterSourceStudent = {
  applicationId: string;
  displayName: string;
  rollNumber: string | null;
  attendance: string;
};

export type TpoRoundApplicationDetail = {
  applicationId: string;
  applicationStatus: string;
  resultStatus: string | null;
  resultOutcome: string | null;
};

export type TpoRoundRosterRow = {
  applicationId: string;
  displayName: string;
  rollNumber: string | null;
  applicationStatus: string;
  attendance: TpoRoundAttendanceState;
  resultStatus: string | null;
  resultOutcome: string | null;
};

function normalizeAttendance(
  value: string,
): TpoRoundAttendanceState {
  return TPO_ROUND_ATTENDANCE_STATES.find(
    (status) => status === value,
  ) ?? "UNKNOWN";
}

/**
 * Project the already-authorized Drive Day roster into a
 * strictly limited, read-only TPO presentation.
 *
 * The caller must obtain students through getDriveDayRoster
 * and application details through a separately college-scoped
 * database query.
 *
 * Details alone cannot introduce students into the roster.
 * A roster student without a matching scoped application
 * detail is omitted rather than given an invented status.
 */
export function buildTpoRoundDriveDayRoster(
  students: readonly TpoRoundRosterSourceStudent[],
  details: readonly TpoRoundApplicationDetail[],
) {
  // TPO-drive-workspace-40: duplicated or conflicting identity evidence
  // must never produce duplicate attendance/results or choose an arbitrary row.
  const detailsByApplication = new Map<string, TpoRoundApplicationDetail>();
  const ambiguous = new Set<string>();
  for(const detail of details){
    if(detailsByApplication.has(detail.applicationId))ambiguous.add(detail.applicationId);
    else detailsByApplication.set(detail.applicationId,detail);
  }
  const seenStudents = new Set<string>();
  const rows: TpoRoundRosterRow[] = students.flatMap(
    (student) => {
      if(seenStudents.has(student.applicationId) || ambiguous.has(student.applicationId))
        return [];
      seenStudents.add(student.applicationId);
      const detail = detailsByApplication.get(
        student.applicationId,
      );

      if (!detail) {
        return [];
      }

      return [
        {
          applicationId: student.applicationId,
          displayName: student.displayName,
          rollNumber: student.rollNumber,
          applicationStatus: detail.applicationStatus,
          attendance: normalizeAttendance(
            student.attendance,
          ),
          resultStatus: detail.resultStatus,
          resultOutcome:
            detail.resultStatus === null
              ? null
              : detail.resultOutcome,
        },
      ];
    },
  );

  rows.sort(
    (left, right) =>
      left.displayName.localeCompare(
        right.displayName,
      ) ||
      (left.rollNumber ?? "").localeCompare(
        right.rollNumber ?? "",
      ) ||
      left.applicationId.localeCompare(
        right.applicationId,
      ),
  );

  return {
    rows,
    counts: {
      total: rows.length,
      waiting: rows.filter(
        (row) => row.attendance === "WAITING",
      ).length,
      present: rows.filter(
        (row) => row.attendance === "PRESENT",
      ).length,
      inInterview: rows.filter(
        (row) =>
          row.attendance === "IN_INTERVIEW",
      ).length,
      done: rows.filter(
        (row) => row.attendance === "DONE",
      ).length,
      absent: rows.filter(
        (row) => row.attendance === "ABSENT",
      ).length,
      unknownAttendance: rows.filter(
        (row) => row.attendance === "UNKNOWN",
      ).length,
      stagedResults: rows.filter(
        (row) => row.resultStatus === "STAGED",
      ).length,
      appliedResults: rows.filter(
        (row) => row.resultStatus === "APPLIED",
      ).length,
      noResult: rows.filter(
        (row) => row.resultStatus === null,
      ).length,
    },
  };
}
