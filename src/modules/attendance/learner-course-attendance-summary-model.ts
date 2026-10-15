/** Attendance denominator is persisted MARKED sessions only; explicit ABSENT
 * is distinct from EXCUSED, MEDICAL and LATE, with no invented statuses. */
export type LearnerCourseAttendanceState="PRESENT"|"ABSENT"|"EXCUSED"|"MEDICAL"|"LATE"|"NOT_MARKED"|"SCHEDULED";
export function learnerCourseAttendanceSummary(rows:readonly {status:LearnerCourseAttendanceState}[]){
 const held=rows.filter(row=>row.status!=="SCHEDULED");
 const marked=held.filter(row=>row.status!=="NOT_MARKED");
 const present=marked.filter(row=>row.status==="PRESENT").length;
 const absent=marked.filter(row=>row.status==="ABSENT").length;
 return {heldSessions:held.length,markedSessions:marked.length,
  unmarkedSessions:held.length-marked.length,present,absent,
  otherMarked:marked.length-present-absent,
  percentage:marked.length>0?Math.round(100*present/marked.length):null,
 };
}
/** Compare exact counts; rounded percentages are a display concern. */
export function learnerCourseAttendanceThresholdReached(
 present:number,marked:number,threshold:number,
):boolean{
 return marked>0&&Number.isFinite(threshold)&&Number.isFinite(present)&&
   threshold>=0&&threshold<=100&&present*100>=threshold*marked;
}
