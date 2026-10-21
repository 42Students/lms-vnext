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
 sprintLabel?:string|null;meetingUrl?:string|null;status?:string|null;
};
/** Read-only transition adapter, suitable for an idempotent import/backfill.
 * The old meeting identifier and orphaned sprint label survive even if a
 * normalized sprint UUID no longer resolves. Historical missing end times
 * are represented by start time, exactly as the old calendar did. */
export function crosswalkLegacyProjectMeeting(input:{
 projectId:string;projectTitle:string;projectStatus:string;
 record:LegacyProjectMeetingRecord;
}):MentorMeetingCalendarItem & {legacyMeetingKey:string}{
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
 const statuses=["DRAFT","REQUESTED","SCHEDULED","RESCHEDULED","COMPLETED","CANCELLED"] as const;
 const status=statuses.find(v=>v===r.status)??"REQUESTED";
 return {legacyMeetingKey:meetingKey,
  id:legacyMeetingUuid(input.projectId,meetingKey),
  projectId:input.projectId,projectTitle:input.projectTitle,projectStatus:input.projectStatus,
  title:(r.title??r.meetingTitle??"Meeting").trim()||"Meeting",
  status,startsAt,endsAt,
  timeZone:r.timeZone??r.timezone??"Asia/Kolkata",
  meetingUrl:r.meetingUrl??null,linkedSprintTitle:r.sprintLabel??null};
}
