import { z } from "zod";
const dateSchema=z.iso.date();
const MAX_ROWS=100;
const istDay=(date:Date):string=>{
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",
   year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
 const part=(type:string)=>parts.find(p=>p.type===type)?.value??"";
 return part("year")+"-"+part("month")+"-"+part("day");
};
const stamp=(date:Date):string=>date.toISOString().replaceAll("-","").replaceAll(":","").replace(/\.\d{3}Z$/,"Z");
const safeText=(text:string):string=>text.slice(0,240)
 .replaceAll("\\","\\\\").replaceAll("\r","").replaceAll("\n","\\n")
 .replaceAll(",","\\,").replaceAll(";","\\;");
type CalendarEvent={id:string;title:string;startsAt:string;endsAt:string;
 location:string|null;description:string|null};
export function learnerScheduleDayIcs(events:readonly CalendarEvent[],dayInput:unknown):{
 content:string;count:number;truncated:boolean;
}{
 const parsed=dateSchema.safeParse(dayInput);
 if(!parsed.success)return {content:"",count:0,truncated:false};
 const rows=events.filter(event=>{
  const start=new Date(event.startsAt),end=new Date(event.endsAt);
  return Number.isFinite(start.getTime())&&Number.isFinite(end.getTime())&&
   end.getTime()>start.getTime()&&istDay(start)===parsed.data;
 }).slice(0,MAX_ROWS);
 const all=[...events].filter(e=>{
  const d=new Date(e.startsAt);
  return Number.isFinite(d.getTime())&&istDay(d)===parsed.data;
 });
 const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//42Students//LMS vNext//EN","CALSCALE:GREGORIAN"];
 for(const event of rows){
  const start=new Date(event.startsAt),end=new Date(event.endsAt);
  lines.push("BEGIN:VEVENT","UID:"+encodeURIComponent(event.id)+"@lms-vnext",
   "DTSTAMP:"+stamp(start),"DTSTART:"+stamp(start),"DTEND:"+stamp(end),
   "SUMMARY:"+safeText(event.title),
   "DESCRIPTION:"+safeText(event.description??""),
   "LOCATION:"+safeText(event.location??""),"END:VEVENT");
 }
 lines.push("END:VCALENDAR");
 return {content:lines.join("\r\n")+"\r\n",count:rows.length,truncated:all.length>MAX_ROWS};
}
