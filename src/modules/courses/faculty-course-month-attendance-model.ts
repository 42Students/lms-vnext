/** One Faculty Courses row summarises marked class sessions this month.
 * Unlike an explicit-present model, migrated attendance stores exceptions only:
 * a MARKED session with no record means every roster learner was present.
 * Exclude unmarked and future sessions and fail closed on unknown rosters. */
export function facultyCourseMonthAttendancePercent(input:{
 roster:readonly {membershipId:string}[];
 sessions:readonly {id:string;startsAt:Date;attendanceStatus:string|null}[];
 records:readonly {scheduleEventId:string;membershipId:string;status:string}[];
},now=new Date()):number|null{
 const learners=new Set(input.roster.map(item=>item.membershipId));
 const marked=new Set(input.sessions.filter(session=>
  session.attendanceStatus==="MARKED"&&
  Number.isFinite(session.startsAt.getTime())&&session.startsAt<=now)
  .map(item=>item.id));
 if(!learners.size||!marked.size)return null;
 // Persisted exceptions are scoped to a session and enrolled learner. Even
 // when duplicate historical rows exist, one learner loses at most one
 // attendance occurrence per marked session.
 const missed=new Set(input.records.filter(record=>
  marked.has(record.scheduleEventId)&&learners.has(record.membershipId)&&
  ["ABSENT","EXCUSED","MEDICAL","LATE"].includes(record.status))
  .map(record=>record.scheduleEventId+":"+record.membershipId));
 const capacity=learners.size*marked.size;
 return Math.round(100*Math.max(0,capacity-missed.size)/capacity);
}
