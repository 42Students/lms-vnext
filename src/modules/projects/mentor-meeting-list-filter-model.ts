import type {MentorMeetingCalendarItem} from "./mentor-calendar-view";

export const mentorMeetingListKinds=[
 {id:"ALL",label:"All meetings"},
 {id:"REVIEW",label:"Reviews"},
 {id:"RETRO",label:"Retros"},
 {id:"PLANNING",label:"Planning"},
 {id:"STANDUP",label:"Standups"},
 {id:"OTHER",label:"Other"},
] as const;
export type MentorMeetingListKind=(typeof mentorMeetingListKinds)[number]["id"];
export const mentorMeetingListScopes=[
 {id:"ALL",label:"All dates"},
 {id:"COMING",label:"Coming up"},
 {id:"ASKED",label:"Asked"},
 {id:"PAST",label:"Past"},
 {id:"NOTES_MISSING",label:"Notes missing"},
] as const;
export type MentorMeetingListScope=(typeof mentorMeetingListScopes)[number]["id"];

export function mentorMeetingMissingNotes(
 meeting:Pick<MentorMeetingCalendarItem,"status"|"outcome"|"facilitation">,
):boolean{
 if(meeting.status!=="COMPLETED")return false;
 const f=meeting.facilitation;
 return ![meeting.outcome,f?.notes,f?.wentWell,f?.retroDidntGoWell,
   f?.improve,f?.nextTime,f?.followUpNotes]
   .some(value=>typeof value==="string"&&value.trim().length>0)&&
   !(f?.actionItemRows?.length)&&!(f?.retroActions?.length);
}
export function mentorMeetingListMatch(
 meeting:MentorMeetingCalendarItem,
 kind:MentorMeetingListKind,scope:MentorMeetingListScope,now:Date,
):boolean{
 if(kind!=="ALL"&&(kind==="OTHER"?
   meeting.meetingType!=="REVIEW"&&meeting.meetingType!=="RETRO"&&
   meeting.meetingType!=="PLANNING"&&meeting.meetingType!=="STANDUP":
   meeting.meetingType!==kind))return false;
 const start=Date.parse(meeting.startsAt);
 const end=Date.parse(meeting.endsAt);
 const current=now.getTime();
 if(scope==="ASKED")return meeting.status==="REQUESTED";
 if(scope==="NOTES_MISSING")return mentorMeetingMissingNotes(meeting);
 if(scope==="COMING")return ["SCHEDULED","RESCHEDULED"].includes(meeting.status)&&
   Number.isFinite(end)&&end>current;
 if(scope==="PAST")return ["COMPLETED","CANCELLED"].includes(meeting.status)||
   (meeting.status!=="REQUESTED"&&Number.isFinite(start)&&
     Number.isFinite(end)&&end<=current);
 return true;
}
