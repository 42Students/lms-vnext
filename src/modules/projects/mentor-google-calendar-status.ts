import "server-only";
import {mentorGoogleEventId} from "./mentor-google-calendar-provider";

/** Response counts from the Google Calendar API itself, never inferred from
 * an in-app RSVP, attendee list, .ics download or client supplied metadata. */
export type MentorGoogleMeetingStatus={
 syncState:"CONFIRMED"|"TENTATIVE"|"CANCELLED"|"NOT_FOUND";
 responseCounts:{accepted:number;declined:number;tentative:number;needsAction:number}|null;
 responseCountReason:"COMPLETE"|"ATTENDEES_OMITTED"|"TOO_MANY_GUESTS"|null;
 reminderOneHour:boolean|null;
 recurringWeekly:boolean;
 verifiedAt:string|null;
};
type GoogleEventResponse={
 id?:unknown;status?:unknown;updated?:unknown;
 attendeesOmitted?:unknown;attendees?:unknown;
 reminders?:unknown;recurrence?:unknown;
};
type GoogleAttendee={responseStatus?:unknown;email?:unknown;organizer?:unknown};
function googleEventStats(body:GoogleEventResponse):MentorGoogleMeetingStatus {
 const state=body.status==="cancelled"?"CANCELLED":
  body.status==="tentative"?"TENTATIVE":"CONFIRMED";
 const attendees=Array.isArray(body.attendees)?body.attendees as GoogleAttendee[]:[];
 const responseCountReason=body.attendeesOmitted===true?"ATTENDEES_OMITTED":
  attendees.length>200?"TOO_MANY_GUESTS":"COMPLETE";
 let counts:MentorGoogleMeetingStatus["responseCounts"]=null;
 if(responseCountReason==="COMPLETE"){
  counts={accepted:0,declined:0,tentative:0,needsAction:0};
  for(const entry of attendees){
   if(!entry||typeof entry!=="object"||entry.organizer===true)continue;
   if(entry.responseStatus==="accepted")counts.accepted++;
   else if(entry.responseStatus==="declined")counts.declined++;
   else if(entry.responseStatus==="tentative")counts.tentative++;
   else counts.needsAction++;
  }
 }
 const reminders=body.reminders&&typeof body.reminders==="object"?
  body.reminders as {useDefault?:unknown;overrides?:unknown}:null;
 const methods=Array.isArray(reminders?.overrides)?
  reminders.overrides as {method?:unknown;minutes?:unknown}[]:null;
 const oneHour=methods===null?null:methods.some(row=>row&&
  (row.method==="email"||row.method==="popup")&&row.minutes===60);
 const rules=Array.isArray(body.recurrence)?body.recurrence:[];
 const recurring=rules.some(row=>typeof row==="string"&&
  /^RRULE:FREQ=WEEKLY(?:;|$)/i.test(row));
 const rawUpdated=typeof body.updated==="string"?Date.parse(body.updated):NaN;
 return {syncState:state,responseCounts:counts,responseCountReason,
  reminderOneHour:oneHour,recurringWeekly:recurring,
  verifiedAt:Number.isFinite(rawUpdated)?new Date(rawUpdated).toISOString():null};
}
/** Read a saved meeting only with a currently consented access token. The
 * calling layer must verify project/college/organizer membership and obtain
 * the token from encrypted server-side storage before invoking this adapter.
 * No attendee email is included in the returned status or logs. */
export async function readMentorGoogleMeetingStatus(
 accessToken:string,calendarId:string,meetingId:string,
 fetchImpl:typeof fetch=fetch,
):Promise<MentorGoogleMeetingStatus>{
 if(!accessToken.trim()||accessToken.length>4096||
    !calendarId||calendarId.length>254||/[\x00-\x1f\x7f]/.test(calendarId))
  throw new Error("GOOGLE_CALENDAR_CONNECTION_UNAVAILABLE");
 const id=mentorGoogleEventId(meetingId);
 const url=new URL("https://www.googleapis.com/calendar/v3/calendars/"+
  encodeURIComponent(calendarId)+"/events/"+encodeURIComponent(id));
 url.searchParams.set("fields",
  "id,status,updated,attendeesOmitted,attendees(responseStatus,organizer),reminders,recurrence");
 const response=await fetchImpl(url.toString(),{
  method:"GET",redirect:"error",cache:"no-store",
  headers:{Authorization:"Bearer "+accessToken,Accept:"application/json"},
 });
 if(response.status===404||response.status===410)
  return {syncState:"NOT_FOUND",responseCounts:null,responseCountReason:null,
   reminderOneHour:null,recurringWeekly:false,verifiedAt:null};
 if(!response.ok)throw new Error("GOOGLE_CALENDAR_STATUS_UNAVAILABLE");
 const raw=await response.text();
 if(raw.length>64_000)throw new Error("GOOGLE_CALENDAR_STATUS_TOO_LARGE");
 let result:GoogleEventResponse;
 try{result=JSON.parse(raw) as GoogleEventResponse;}
 catch{throw new Error("GOOGLE_CALENDAR_STATUS_INVALID");}
 if(result?.id!==id||!["confirmed","tentative","cancelled"].includes(
  typeof result.status==="string"?result.status:""))
  throw new Error("GOOGLE_CALENDAR_STATUS_INVALID");
 return googleEventStats(result);
}
