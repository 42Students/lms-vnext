import {csvSafeCell} from "./mentor-board-review-model";
import {mentorPortfolioHref,type MentorActivityQuery} from "./mentor-portfolio-model";

export function mentorPortfolioActivityExportHref(query:MentorActivityQuery) {
 const pageHref=mentorPortfolioHref("activity",{...query,page:1,pageSize:20});
 const suffix=pageHref.includes("?")?pageHref.slice(pageHref.indexOf("?")):"";
 return "/api/mentor/activity/export"+suffix;
}
export type MentorPortfolioActivityExportRow={
 id:string;projectTitle:string;label:string;importance:string;occurredAt:Date;
};
/** User-safe exported fields only: no actors, URLs, source details or metadata. */
export function mentorPortfolioActivityCsv(
 rows:readonly MentorPortfolioActivityExportRow[],omitted:number
){
 const date=new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 });
 const lines=["Event ID,Project,Recorded event,Importance,Occurred (IST)"];
 for(const row of rows){
  const recorded=Number.isFinite(row.occurredAt.getTime())
   ?date.format(row.occurredAt)+" IST":"Unknown";
  lines.push([row.id,row.projectTitle,row.label,row.importance,recorded].map(csvSafeCell).join(","));
 }
 if(omitted>0)lines.push(["","Truncated",omitted+" additional matching events","",""]
  .map(csvSafeCell).join(","));
 return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
