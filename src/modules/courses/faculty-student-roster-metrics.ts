/** Exact per-student figures for the Faculty prototype's Students table.
 * "Progress" means published assignment submission completion, not lesson
 * consumption or graded performance; callers must label it accordingly. */
export type FacultyStudentMetricsInput={
 roster:readonly {membershipId:string}[];
 attendanceSessions:readonly {id:string;startsAt:Date;attendanceStatus:string|null}[];
 attendanceRecords:readonly {scheduleEventId:string;membershipId:string;status:string}[];
 assignments:readonly {id:string;status:string;dueAt:Date|null;
  submissions:readonly {membershipId:string}[]}[];
};

export function facultyStudentRosterMetrics(input:FacultyStudentMetricsInput,now=new Date()){
 const members=new Set(input.roster.map(row=>row.membershipId));
 const marked=[...new Map(input.attendanceSessions.filter(session=>
  session.attendanceStatus==="MARKED" &&
  Number.isFinite(session.startsAt.getTime())&&session.startsAt<=now)
  .map(session=>[session.id,session] as const)).values()];
 const held=new Set(marked.map(session=>session.id));
 // The persistence model stores absence/exception rows; a recorded session
 // without an absence row means the learner was marked present.
 const exceptions=new Set(input.attendanceRecords.filter(record=>
  held.has(record.scheduleEventId)&&members.has(record.membershipId)&&
  ["ABSENT","EXCUSED","MEDICAL","LATE"].includes(record.status))
  .map(record=>record.scheduleEventId+":"+record.membershipId));
 const assignments=[...new Map(input.assignments.filter(item=>item.status==="PUBLISHED")
  .map(item=>[item.id,item] as const)).values()];
 const submitted=new Map(assignments.map(item=>[item.id,
  new Set(item.submissions.filter(sub=>members.has(sub.membershipId))
   .map(sub=>sub.membershipId))] as const));
 const due=assignments.filter(item=>item.dueAt&&
  Number.isFinite(item.dueAt.getTime())&&item.dueAt<=now);
 const byLearner=input.roster.map(learner=>{
  const id=learner.membershipId;
  const submittedAssignments=assignments.filter(item=>submitted.get(item.id)?.has(id)).length;
  const missedDue=due.filter(item=>!submitted.get(item.id)?.has(id)).length;
  const absenceCount=marked.filter(session=>exceptions.has(session.id+":"+id)).length;
  return {
   membershipId:id,
   assignmentProgressPercent:assignments.length?
    Math.round(submittedAssignments*100/assignments.length):null,
   submittedAssignments,totalAssignments:assignments.length,
   attendancePercent:marked.length?
    Math.round((marked.length-absenceCount)*100/marked.length):null,
   overdueMissing:missedDue,
  };
 });
 return {
  byLearner,
  behindTotal:byLearner.filter(item=>item.overdueMissing>0).length,
  lowAttendanceTotal:byLearner.filter(item=>item.attendancePercent!==null&&item.attendancePercent<75).length,
 };
}
