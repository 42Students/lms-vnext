import type {MentorMeetingCalendarItem} from "./mentor-calendar-view";

/** RFC 5545: escape content, convert all stored timestamps to UTC and fold
 * every physical content line at 75 UTF-8 octets, not 75 JS code units.
 */
export function mentorIcsEscape(value:string):string{
 return value.replace(/\\/g,"\\\\")
  .replace(/\r\n|\r|\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
}
export function mentorIcsFold(line:string):string{
 const encoder=new TextEncoder();
 let output="",part="",bytes=0;
 for(const char of line){
  const length=encoder.encode(char).length;
  if(bytes+length>75){
   output+=part+"\r\n";
   part=" ";bytes=1;
  }
  part+=char;bytes+=length;
 }
 return output+part;
}
const icsUtc=(date:Date)=>date.toISOString().replace(/[-:]/g,"")
  .replace(/\.\d{3}Z$/,"Z");
export function buildMentorMeetingIcs(
 meetings:readonly MentorMeetingCalendarItem[],stamp:Date=new Date(),
):string|null{
 if(!Number.isFinite(stamp.getTime()))return null;
 const eligible=meetings.filter(item=>{
  const start=Date.parse(item.startsAt),end=Date.parse(item.endsAt);
  return ["SCHEDULED","RESCHEDULED"].includes(item.status)&&
    Number.isFinite(start)&&Number.isFinite(end)&&end>start;
 });
 if(!eligible.length)return null;
 const lines=[
  "BEGIN:VCALENDAR","VERSION:2.0",
  "PRODID:-//42LMS//Mentor Project Calendar//EN",
  "CALSCALE:GREGORIAN","METHOD:PUBLISH",
  ...eligible.flatMap(meeting=>[
   "BEGIN:VEVENT",
   "UID:"+mentorIcsEscape(meeting.id+"@42lms"),
   "DTSTAMP:"+icsUtc(stamp),
   "DTSTART:"+icsUtc(new Date(meeting.startsAt)),
   "DTEND:"+icsUtc(new Date(meeting.endsAt)),
   "SUMMARY:"+mentorIcsEscape(meeting.title),
   "DESCRIPTION:"+mentorIcsEscape(meeting.projectTitle),
   "STATUS:CONFIRMED","END:VEVENT",
  ]),
  "END:VCALENDAR",
 ];
 return lines.map(mentorIcsFold).join("\r\n")+"\r\n";
}
