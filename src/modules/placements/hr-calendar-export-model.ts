import type {HrCalendarCategory} from "./hr-calendar-category-model";
export const HR_CALENDAR_EXPORT_CAP=200;
export type HrCalendarCsvEvent={
 kind:string;title:string;jobTitle:string|null;startsAt:Date;status:string;jobId:string|null;
};
export type HrCalendarCsvDue={
 id:string;jobTitle:string;roundName:string;dueAt:Date;jobId:string;
};
function escapeCell(value:string){
 const safe=/^\s*[=+\-@]/u.test(value)||/^[\t\r\n]/u.test(value)?"'"+value:value;
 return '"'+safe.replaceAll('"','""')+'"';
}
export function buildHrCalendarCsv(events:readonly HrCalendarCsvEvent[],
 dues:readonly HrCalendarCsvDue[],category:HrCalendarCategory){
 const rows=[
  ...events.filter(e=>Number.isFinite(e.startsAt.getTime())&&
   (category==="ALL"||(category==="ROUNDS"?e.kind==="ROUND":
   category==="DEADLINES"?e.kind==="APPLICATION_DEADLINE":
   category==="SLOTS"?e.kind==="INTERVIEW_SLOT":false)))
   .map(e=>({job:e.jobTitle??"",item:e.title,type:e.kind,
     timestamp:e.startsAt,status:e.status})),
  ...(category==="ALL"||category==="RESULTS_DUE"
   ?dues.filter(e=>Number.isFinite(e.dueAt.getTime())).map(e=>({
   job:e.jobTitle,item:e.roundName,type:"RESULTS_DUE",timestamp:e.dueAt,status:"Recorded deadline",
  })):[]),
 ].sort((a,b)=>a.timestamp.getTime()-b.timestamp.getTime()||
   a.job.localeCompare(b.job)||a.item.localeCompare(b.item));
 const out=[["Job","Event","Type","Date/time (IST)","Recorded status"].map(escapeCell).join(",")];
 const fmt=new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"});
 for(const row of rows.slice(0,HR_CALENDAR_EXPORT_CAP))
  out.push([row.job,row.item,row.type,fmt.format(row.timestamp),row.status].map(escapeCell).join(","));
 const omitted=Math.max(0,rows.length-HR_CALENDAR_EXPORT_CAP);
 if(omitted)out.push(["Export capped","Additional authorized events omitted","","",""].map(escapeCell).join(","));
 return {csv:"\uFEFF"+out.join("\r\n")+"\r\n",exported:Math.min(rows.length,HR_CALENDAR_EXPORT_CAP),omitted};
}
