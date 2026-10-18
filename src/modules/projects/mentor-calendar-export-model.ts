import {csvSafeCell} from "./mentor-board-review-model";
import type {MentorMeetingCalendarItem} from "./mentor-calendar-view";
/** Read-only export over already authorized meeting records, excluding join URLs. */
export function mentorCalendarCsv(rows:readonly MentorMeetingCalendarItem[],omitted:number){
 const formatter=new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 });
 const lines=["Meeting ID,Project,Meeting,Status,Start (IST),End (IST)"];
 const limited=rows.slice(0,500);
 const dateLabel=(value:string)=>{
  const parsed=new Date(value);
  return Number.isFinite(parsed.getTime())?formatter.format(parsed)+" IST":"Unknown";
 };
 for(const row of limited)lines.push([row.id,row.projectTitle,row.title,row.status,
  dateLabel(row.startsAt),dateLabel(row.endsAt)].map(csvSafeCell).join(","));
 const hidden=(Number.isSafeInteger(omitted)&&omitted>0?omitted:0)+Math.max(0,rows.length-limited.length);
 if(hidden>0)lines.push(["","Truncated",hidden+" additional matching meetings","","",""]
   .map(csvSafeCell).join(","));
 return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
