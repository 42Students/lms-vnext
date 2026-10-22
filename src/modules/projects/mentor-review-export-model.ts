import {csvSafeCell} from "./mentor-board-review-model";
import {mentorPortfolioHref,mentorReviewQuerySchema} from "./mentor-portfolio-model";
import type {z} from "zod";
type MentorReviewQuery=z.infer<typeof mentorReviewQuerySchema>;

/** Strip pagination before export so the server applies the same authorized filters. */
export function mentorReviewExportHref(query:MentorReviewQuery) {
 const listing=mentorPortfolioHref("reviews",{...query,...(query.projectId!==undefined?{projectId:query.projectId}:{}),page:1,pageSize:20});
 const suffix=listing.includes("?")?listing.slice(listing.indexOf("?")):"";
 return "/api/mentor/reviews/export"+suffix;
}
export type MentorReviewExportRow={projectId:string;projectTitle:string;occurredAt:Date};
/** Only assigned project labels and submission times, no learner identities or review notes. */
export function mentorReviewExportCsv(rows:readonly MentorReviewExportRow[],omitted:number){
 const fmt=new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 });
 const lines=["Project ID,Assigned project,Review needed,Submitted (IST)"];
 const limited=rows.slice(0,200);
 const knownOmitted=Number.isSafeInteger(omitted)&&omitted>0?omitted:0;
 const totalOmitted=knownOmitted+Math.max(0,rows.length-limited.length);
 for(const row of limited){
  const submitted=Number.isFinite(row.occurredAt.getTime())?fmt.format(row.occurredAt)+" IST":"Unknown";
  lines.push([row.projectId,row.projectTitle,"Final delivery awaiting review",submitted].map(csvSafeCell).join(","));
 }
 if(totalOmitted>0)lines.push(["","Export capped",totalOmitted+" more matching deliveries",""].map(csvSafeCell).join(","));
 return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
