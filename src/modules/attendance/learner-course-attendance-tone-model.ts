/** Late, excused and medical are distinct from explicit ABSENT. */
export function learnerCourseAttendanceTone(status:string):
  "success"|"warning"|"neutral"|"error" {
 switch(status){
  case "PRESENT": return "success";
  case "ABSENT": return "error";
  case "NOT_MARKED": case "LATE": return "warning";
  case "SCHEDULED": case "EXCUSED": case "MEDICAL": return "neutral";
  default: return "neutral";
 }
}
