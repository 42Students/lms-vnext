import { DEFAULT_TIME_ZONE } from "@/config/locale";
/**
 * Mentor meeting clock labels for the VIEWER, not the server/organizer zone.
 *
 * Legacy lms2-fe/src/pages/mentor/calendar.js calls dayjs.tz.guess() when
 * rendering saved meeting instants. This is a user-job parity requirement:
 * a learner or Mentor outside India must not see an IST clock mislabeled as
 * their own local meeting time.
 *
 * The React component initially renders with Asia/Kolkata for deterministic
 * server/client hydration, then reads the viewer zone in a browser effect.
 * API timestamps and canonical UTC instants are never mutated.
 */
export const MENTOR_INITIAL_VIEWER_ZONE=DEFAULT_TIME_ZONE;

export function safeMentorViewerZone(value:string|null|undefined):string{
  if(!value?.trim())return MENTOR_INITIAL_VIEWER_ZONE;
  try{
    new Intl.DateTimeFormat("en-US",{timeZone:value}).format(new Date(0));
    return value;
  }catch{return MENTOR_INITIAL_VIEWER_ZONE;}
}
function validInstant(raw:string|null|undefined):raw is string{
  return Boolean(raw?.trim())&&Number.isFinite(Date.parse(raw!));
}
function parts(raw:string,options:Intl.DateTimeFormatOptions,timeZone:string){
  return new Intl.DateTimeFormat("en-US",{
    ...options,timeZone:safeMentorViewerZone(timeZone),
  }).formatToParts(new Date(raw));
}
function part(items:Intl.DateTimeFormatPart[],key:Intl.DateTimeFormatPartTypes):string{
  return items.find(item=>item.type===key)?.value??"";
}
export function mentorViewerDateLabel(raw:string,timeZone:string):string{
  if(!validInstant(raw))return "Date TBD";
  const items=parts(raw,{weekday:"short",month:"short",day:"numeric",year:"numeric"},timeZone);
  return [part(items,"weekday")+",",part(items,"month"),part(items,"day"),part(items,"year")].join(" ");
}
export function mentorViewerClockLabel(raw:string,timeZone:string):string|null{
  if(!validInstant(raw))return null;
  const items=parts(raw,{hour:"2-digit",minute:"2-digit",hour12:true},timeZone);
  return part(items,"hour")+":"+part(items,"minute")+" "+part(items,"dayPeriod").toUpperCase();
}
export function mentorViewerOffsetLabel(raw:string,timeZone:string):string{
  if(!validInstant(raw))return "GMT+00:00";
  const items=parts(raw,{timeZoneName:"longOffset"},timeZone);
  const label=part(items,"timeZoneName");
  return label&&label!=="GMT"?label:"GMT+00:00";
}
export function mentorViewerMeetingTimeLabel(
  meeting:{
    startsAt:string;endsAt:string;
    legacyStartTime?:string|null;legacyEndTime?:string|null;
  },
  timeZone:string,
):string{
  const start=mentorViewerClockLabel(meeting.startsAt,timeZone);
  if(!start)return (meeting.legacyStartTime?.trim()||"--")+
    (meeting.legacyEndTime?.trim()?" – "+meeting.legacyEndTime.trim():"");
  const end=mentorViewerClockLabel(meeting.endsAt,timeZone);
  return start+(end&&meeting.endsAt!==meeting.startsAt?" – "+end:"")+
    " ("+mentorViewerOffsetLabel(meeting.startsAt,timeZone)+")";
}
