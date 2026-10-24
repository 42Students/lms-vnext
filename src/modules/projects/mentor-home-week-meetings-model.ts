/** Upcoming calendar meetings in the current ISO week in IST. The Mentor
 * home rail is independent of the 48-hour needs-attention projection. */
export type MentorHomeWeekMeeting={
  id:string;projectId:string;projectTitle:string;projectStatus:string;
  title:string;status:string;startsAt:string;
};
export function selectMentorHomeWeekMeetings<T extends MentorHomeWeekMeeting>(
  meetings:readonly T[],now:Date,
):T[]{
  const fields=new Intl.DateTimeFormat("en-US",{
    timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  }).formatToParts(now);
  const part=(kind:"year"|"month"|"day")=>{
    const text=fields.find(field=>field.type===kind)?.value;
    return Number(text);
  };
  const year=part("year"),month=part("month"),day=part("day");
  if(!Number.isSafeInteger(year)||!Number.isSafeInteger(month)||
    !Number.isSafeInteger(day))return [];
  const localDayUtc=Date.UTC(year,month-1,day);
  const weekday=new Date(localDayUtc).getUTCDay();
  const mondayOffset=(weekday+6)%7;
  const nextMondayIst=localDayUtc+(7-mondayOffset)*86400000-330*60000;
  return meetings.filter(meeting=>{
    const start=Date.parse(meeting.startsAt);
    return meeting.projectStatus==="ACTIVE"&&
      ["SCHEDULED","RESCHEDULED","REQUESTED"].includes(meeting.status)&&
      Number.isFinite(start)&&start>=now.getTime()&&start<nextMondayIst;
  }).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt)||
    a.id.localeCompare(b.id));
}
