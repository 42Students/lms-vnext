import type { LearnerAttendanceStatus } from "./learner-attendance-status-tone-model";
export function learnerAttendanceExactAbsences(rows: readonly {status:LearnerAttendanceStatus}[]):number {
  return rows.filter(row=>row.status==="ABSENT").length;
}
