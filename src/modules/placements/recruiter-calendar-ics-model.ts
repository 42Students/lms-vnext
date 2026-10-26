import type {PlacementCalendarEvent} from "./placement-calendar-model";

/** RFC 5545 calendar output from an already authorization-scoped employer list.
 * Never put learner identity, interview invitee or private college notes here. */
export type RecruiterCalendarDue={
 id:string;jobId:string;jobTitle:string;roundName:string;dueAt:Date;
};
function escaped(value:string){
 return value.slice(0,500).replace(/\\/g,"\\\\")
  .replace(/\r\n|\r|\n/g,"\\n")
  .replace(/;/g,"\\;").replace(/,/g,"\\,");
}
function folded(line:string){
 const encoder=new TextEncoder();
 let result="",part="",size=0;
 for(const cp of line){
  const bytes=encoder.encode(cp).length;
  if(size+bytes>75){result+=part+"\r\n";part=" ";size=1;}
  part+=cp;size+=bytes;
 }
 return result+part;
}
function stamp(d:Date){
 return d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
}
export function recruiterCalendarIcs(
 events:readonly PlacementCalendarEvent[],
 due:readonly RecruiterCalendarDue[],
 generatedAt:Date,
){
 if(!Number.isFinite(generatedAt.getTime()))throw new Error("Invalid export timestamp");
 const lines=["BEGIN:VCALENDAR","VERSION:2.0",
  "PRODID:-//42LMS//Recruiter Drive Calendar//EN",
  "CALSCALE:GREGORIAN","METHOD:PUBLISH",
  "X-WR-CALNAME:42LMS Recruiter Drives"];
 const seen=new Set<string>();
 let total=0;
 function add(id:string,start:Date,end:Date|null,title:string,location:string|null,detail:string){
  if(total>=300||seen.has(id)||!Number.isFinite(start.getTime())||
     (end!==null&&(!Number.isFinite(end.getTime())||end.getTime()<start.getTime())))return;
  seen.add(id);total++;
  lines.push("BEGIN:VEVENT","UID:"+escaped(id)+"@42lms",
   "DTSTAMP:"+stamp(generatedAt),"DTSTART:"+stamp(start),
   ...(end?["DTEND:"+stamp(end)]:[]),
   "SUMMARY:"+escaped(title),"DESCRIPTION:"+escaped(detail),
   ...(location?["LOCATION:"+escaped(location)]:[]),"END:VEVENT");
 }
 for(const event of events){
  // The caller supplies only published/closed, active-grant job events.
  // Restrict to recruiter-meaningful kinds; no candidate-level calendar rows.
  if(!["ROUND","INTERVIEW_SLOT","APPLICATION_DEADLINE"].includes(event.kind)||
     !event.jobId||!event.id)continue;
  const kind=event.kind==="APPLICATION_DEADLINE"?"Applications close":
   event.kind==="INTERVIEW_SLOT"?"Interview slot":"Hiring round";
  add(event.id,event.startsAt,event.endsAt??null,
   kind+" · "+event.jobTitle+" · "+event.title,
   event.venue,
   "Drive: "+event.jobTitle+"; Status: "+event.status);
 }
 for(const item of due){
  add("results-due:"+item.id,item.dueAt,null,
   "Send results · "+item.roundName+" · "+item.jobTitle,
   null,"Hiring drive: "+item.jobTitle);
 }
 lines.push("END:VCALENDAR");
 return {ics:lines.map(folded).join("\r\n")+"\r\n",
  included:total,truncated:seen.size>=300||events.length+due.length>300};
}
