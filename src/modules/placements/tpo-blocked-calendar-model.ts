import type {PlacementCalendarEvent} from "./placement-calendar-model";

/** College-wide all-day blocked events, projected from TPO settings, not a job. */
export function toTpoBlockedCalendarEvents(
 rows:readonly {day:string;reason:string|null}[],
 from:string,to:string,
):PlacementCalendarEvent[]{
 return rows.filter(row=>row.day>=from&&row.day<=to).map(row=>({
  id:"blocked:"+row.day,kind:"BLOCKED",startsAt:new Date(row.day+"T00:00:00+05:30"),
  title:"Blocked",companyId:null,companyName:"College calendar",
  jobId:null,jobTitle:null,roundId:null,roundKind:null,leadId:null,followupId:null,
  status:"BLOCKED",timezone:"Asia/Kolkata",venue:null,note:row.reason,
  completedAt:null,
 }));
}
