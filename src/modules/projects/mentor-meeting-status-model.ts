/** MEN-projects-meetings-27: persisted mentor meeting states.
 * Requested is a learner-originated state. Completed and Cancelled use
 * separate audited decision routes, never the ordinary scheduling endpoint.
 */
export type MentorScheduleStatus="DRAFT"|"SCHEDULED"|"RESCHEDULED";
export function maySaveMentorMeetingStatus(
  current:string|null, next:MentorScheduleStatus, timeChanged:boolean,
):boolean{
  if(current===null)return next==="DRAFT"||next==="SCHEDULED";
  if(current==="DRAFT")return next==="DRAFT"||next==="SCHEDULED";
  if(current==="REQUESTED")return next==="SCHEDULED";
  if(current==="SCHEDULED")
    return next==="SCHEDULED"&&!timeChanged||next==="RESCHEDULED"&&timeChanged;
  if(current==="RESCHEDULED")
    return next==="RESCHEDULED";
  return false;
}
export function mentorScheduleStatusFromMeeting(status:string|null|undefined):MentorScheduleStatus{
  if(status==="DRAFT")return "DRAFT";
  if(status==="RESCHEDULED")return "RESCHEDULED";
  return "SCHEDULED";
}
