/** Legacy interview-calendar overlap warning for a bounded, authorized drive
 * page. These are advisory UI cues; the writer rechecks all college bookings.
 * Same-company interviewer scope is implicit because rows share one job.
 */
export type VisibleInterviewAppointment={
 id:string;applicationId:string;status:string;scheduledAt:string;
 durationMinutes:number;interviewer:string|null;venue:string|null;meetingUrl:string|null;
};
export type InterviewConflictKind="Candidate"|"Interviewer"|"Room";
const ACTIVE=new Set(["SCHEDULED","CONFIRMED","RESCHEDULE_REQUESTED"]);
const bufferMs=15*60_000;
const comparable=(value:string|null|undefined)=>(value??"").trim().toLocaleLowerCase();
export function visibleInterviewConflictKinds(
  row:VisibleInterviewAppointment,
  peers:readonly VisibleInterviewAppointment[],
):InterviewConflictKind[]{
  if(!ACTIVE.has(row.status))return [];
  const from=Date.parse(row.scheduledAt);
  const to=from+row.durationMinutes*60_000;
  if(!Number.isFinite(from)||!Number.isFinite(to))return [];
  const kinds=new Set<InterviewConflictKind>();
  for(const other of peers){
    if(other.id===row.id||!ACTIVE.has(other.status))continue;
    const otherFrom=Date.parse(other.scheduledAt);
    const otherTo=otherFrom+other.durationMinutes*60_000;
    if(!Number.isFinite(otherFrom)||!Number.isFinite(otherTo)||
       otherFrom>=to+bufferMs||otherTo<=from-bufferMs)continue;
    if(row.applicationId&&row.applicationId===other.applicationId)kinds.add("Candidate");
    if(comparable(row.interviewer)&&comparable(row.interviewer)===comparable(other.interviewer))
      kinds.add("Interviewer");
    const room=comparable(row.venue??row.meetingUrl);
    if(room&&room===comparable(other.venue??other.meetingUrl))kinds.add("Room");
  }
  return ["Candidate","Interviewer","Room"].filter(
    (kind):kind is InterviewConflictKind=>kinds.has(kind as InterviewConflictKind),
  );
}
export function visibleInterviewConflictLabel(kinds:readonly InterviewConflictKind[]):string{
  return kinds.length?kinds.join(" & ")+" conflict":"";
}
