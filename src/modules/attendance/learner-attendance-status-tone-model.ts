export type LearnerAttendanceStatus = "PRESENT"|"ABSENT"|"EXCUSED"|"MEDICAL"|"LATE"|"NOT_MARKED"|"SCHEDULED";
/** Excused and medical sessions are not absences in the visual language; percentage policy remains unchanged. */
export function learnerAttendanceStatusTone(status: LearnerAttendanceStatus): "success"|"error"|"warning"|"neutral" {
  switch(status) {
    case "PRESENT": return "success";
    case "ABSENT": return "error";
    case "LATE": case "NOT_MARKED": return "warning";
    case "EXCUSED": case "MEDICAL": case "SCHEDULED": return "neutral";
  }
}
