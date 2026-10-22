import {createHash} from "node:crypto";
import type {MentorMeetingCalendarItem} from "./mentor-calendar-view";

/** Canonical, deterministic key for importing old project meeting documents.
 * Scope the old meetingKey to its project to avoid collisions between colleges. */
export function legacyMeetingUuid(projectId:string,meetingKey:string):string{
 const hex=createHash("sha256").update(projectId+":"+meetingKey).digest("hex");
 return hex.slice(0,8)+"-"+hex.slice(8,12)+"-5"+hex.slice(13,16)+"-a"+
  hex.slice(17,20)+"-"+hex.slice(20,32);
}

export type LegacyProjectMeetingRecord={
 meetingKey?:string|null;id?:string|null;title?:string|null;meetingTitle?:string|null;
 date?:string|null;startTime?:string|null;endTime?:string|null;
 startsAt?:string|null;endsAt?:string|null;
 timezone?:string|null;timeZone?:string|null;
 sprintLabel?:string|null;meetingUrl?:string|null;meetLink?:string|null;
 calendarEventId?:string|null;calendarProvider?:string|null;
 calendarSyncStatus?:string|null;calendarSyncError?:string|null;
 reminderAt?:string|null;reminderChannel?:string|null;
 followUpAt?:string|null;followUpStatus?:string|null;followUpNotes?:string|null;
 status?:string|null;
};
/** Read-only transition adapter, suitable for an idempotent import/backfill.
 * The old meeting identifier and orphaned sprint label survive even if a
 * normalized sprint UUID no longer resolves. Historical missing end times
 * are represented by start time, exactly as the old calendar did. */
export function crosswalkLegacyProjectMeeting(input:{
 projectId:string;projectTitle:string;projectStatus:string;
 record:LegacyProjectMeetingRecord;
}):MentorMeetingCalendarItem & {
 legacyMeetingKey:string;legacyCalendarEventId:string|null;
 legacyCalendarProvider:string|null;legacyCalendarSyncStatus:string|null;
 legacyReminderAt:string|null;legacyReminderChannel:string|null;
 legacyFollowUpAt:string|null;legacyFollowUpStatus:string|null;
 legacyFollowUpNotes:string|null;
 calendarSyncRetired:true;reminderDeliveryRetired:true;
}{
 const r=input.record;
 const meetingKey=String(r.meetingKey??r.id??[
  r.date,r.startTime,r.title??r.meetingTitle,
 ].join("|"));
 const localDate=r.date&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)?r.date:null;
 const localClock=(value:string|null|undefined)=>value&&/^\d{2}:\d{2}(?::\d{2})?$/.test(value)?
  value.length===5?value+":00":value:null;
 const parse=(iso:string|null|undefined,time:string|null|undefined):string=>{
  if(iso&&Number.isFinite(Date.parse(iso)))return new Date(iso).toISOString();
  const clock=localClock(time);
  if(localDate&&clock)return new Date(localDate+"T"+clock+"+05:30").toISOString();
  return "";
 };
 const startsAt=parse(r.startsAt,r.startTime);
 const endsAt=parse(r.endsAt,r.endTime)||startsAt;
 // The legacy importer sometimes stored an actual meeting URL in
 // calendarEventId after auto-sync was retired. Treat that as the manual
 // link only when it is a legitimate HTTP(S) URL. Opaque provider IDs stay
 // historical provenance and never become fake room links or active sync.
 const approvedLink=(candidate:string|null|undefined)=>{
  if(!candidate||candidate.length>500)return null;
  try{
   const u=new URL(candidate);
   return (u.protocol==="https:"||u.protocol==="http:")&&u.hostname&&
    !u.username&&!u.password?u.toString():null;
  }catch{return null;}
 };
 const meetingHref=approvedLink(r.meetingUrl)||
  approvedLink(r.meetLink)||approvedLink(r.calendarEventId);
 const statuses=["DRAFT","REQUESTED","SCHEDULED","RESCHEDULED","COMPLETED","CANCELLED"] as const;
 const status=statuses.find(v=>v===r.status)??"REQUESTED";
 return {legacyMeetingKey:meetingKey,
  id:legacyMeetingUuid(input.projectId,meetingKey),
  projectId:input.projectId,projectTitle:input.projectTitle,projectStatus:input.projectStatus,
  title:(r.title??r.meetingTitle??"Meeting").trim()||"Meeting",
  status,startsAt,endsAt,
  timeZone:r.timeZone??r.timezone??"Asia/Kolkata",
  meetingUrl:meetingHref,linkedSprintTitle:r.sprintLabel??null,
  legacySprintLabel:r.sprintLabel??null,legacyStartTime:r.startTime??null,
  legacyEndTime:r.endTime??null,
  legacyCalendarEventId:r.calendarEventId?.slice(0,160)??null,
  legacyCalendarProvider:r.calendarProvider?.slice(0,60)??null,
  legacyCalendarSyncStatus:r.calendarSyncStatus?.slice(0,20)??null,
  legacyReminderAt:r.reminderAt??null,
  legacyReminderChannel:r.reminderChannel?.slice(0,40)??null,
  legacyFollowUpAt:r.followUpAt??null,
  legacyFollowUpStatus:r.followUpStatus?.slice(0,40)??null,
  legacyFollowUpNotes:r.followUpNotes?.slice(0,4000)??null,
  calendarSyncRetired:true,reminderDeliveryRetired:true};
}

/** Corrupt or unscheduled legacy records remain reviewable instead of being
 * silently excluded from import or incorrectly assigned to another sprint. */
export function legacyMeetingImportDisposition(record:LegacyProjectMeetingRecord){
 const usable=Boolean(
  (record.startsAt&&Number.isFinite(Date.parse(record.startsAt)))||
  (record.date&&/^\d{4}-\d{2}-\d{2}$/.test(record.date)&&
   record.startTime&&/^\d{2}:\d{2}(?::\d{2})?$/.test(record.startTime)));
 return {requiresReview:!usable,reason:usable?null:"MISSING_OR_INVALID_START",
  preserveForAudit:true as const,sourceSprintLabel:record.sprintLabel??null};
}
