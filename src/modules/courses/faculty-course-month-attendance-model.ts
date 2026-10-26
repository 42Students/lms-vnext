/** Faculty Courses month attendance counts marked learner-session occurrences.
 * Migrated attendance stores exceptions only: a MARKED session without rows
 * means all enrolled roster members attended. Unmarked/future sessions do
 * not enter either numerator or denominator. */
export type FacultyMonthAttendanceEvidence={present:number;possible:number};
export function facultyCourseMonthAttendanceEvidence(input:{
 roster:readonly {membershipId:string}[];
 sessions:readonly {id:string;startsAt:Date;attendanceStatus:string|null}[];
 records:readonly {scheduleEventId:string;membershipId:string;status:string}[];
},now=new Date()):FacultyMonthAttendanceEvidence|null{
 const learners=new Set(input.roster.map(item=>item.membershipId));
 const marked=new Set(input.sessions.filter(session=>
  session.attendanceStatus==="MARKED"&&
  Number.isFinite(session.startsAt.getTime())&&session.startsAt<=now)
  .map(item=>item.id));
 if(!learners.size||!marked.size)return null;
 const missed=new Set(input.records.filter(record=>
  marked.has(record.scheduleEventId)&&learners.has(record.membershipId)&&
  ["ABSENT","EXCUSED","MEDICAL","LATE"].includes(record.status))
  .map(record=>record.scheduleEventId+":"+record.membershipId));
 const possible=learners.size*marked.size;
 return {present:Math.max(0,possible-missed.size),possible};
}
export function facultyCourseMonthAttendancePercent(input:Parameters<
 typeof facultyCourseMonthAttendanceEvidence>[0],now=new Date()):number|null{
 const evidence=facultyCourseMonthAttendanceEvidence(input,now);
 return evidence?Math.round(100*evidence.present/evidence.possible):null;
}
