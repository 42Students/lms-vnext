import {csvSafeCell} from "./mentor-board-review-model";
import type {MentorMeetingCalendarItem} from "./mentor-calendar-view";
/** Read-only export over already authorized meeting records, excluding join URLs. */
export function mentorCalendarCsv(rows:readonly MentorMeetingCalendarItem[],omitted:number){
 const formatter=new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 });
 const lines=["Meeting ID,Project,Meeting,Status,Start (IST),End (IST)"];
 for(const row of rows)lines.push([row.id,row.projectTitle,row.title,row.status,
  formatter.format(new Date(row.startsAt))+" IST",
  formatter.format(new Date(row.endsAt))+" IST"].map(csvSafeCell).join(","));
 if(omitted>0)lines.push(["","Truncated",omitted+" additional matching meetings","","",""]
   .map(csvSafeCell).join(","));
 return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
