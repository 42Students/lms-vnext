import "server-only";
import {eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementTpoBlockedDates} from "@/db/schema/tpo-configuration";
import type {RequestContext} from "@/modules/identity/context";
import {requireLearnerPlacementAccess} from "./learner-participation-guard";
import {listLearnerPlacementJobs} from "./learner-job-service";
import {
 careerDayKey,legacyJobImportantDatesToSupplements,
 type CareerCalendarSupplement,
} from "./learner-career-calendar-model";

/** Calendar supplements share the authorized, eligibility-targeted learner
 * browse projection. A published job outside this member's batch/section is
 * never promoted into the learner's calendar merely because it has a deadline.
 * College-wide blocked exam days are read only after persisted learner access.
 */
export async function listLearnerCareerCalendarSupplements(
 context:RequestContext,
):Promise<CareerCalendarSupplement[]>{
 const membership=await requireLearnerPlacementAccess(context);
 const [visible,blocks]=await Promise.all([
  listLearnerPlacementJobs(context),
  getDb().select({day:placementTpoBlockedDates.day,reason:placementTpoBlockedDates.reason})
   .from(placementTpoBlockedDates)
   .where(eq(placementTpoBlockedDates.collegeId,membership.collegeId))
   .orderBy(placementTpoBlockedDates.day).limit(1500),
 ]);
 const byJob=new Map<string,{
  job:typeof visible[number]["job"];
  companyName:string;applied:boolean;
 }>();
 for(const row of visible){
  const prior=byJob.get(row.job.id);
  if(prior){if(row.application)prior.applied=true;continue;}
  byJob.set(row.job.id,{
   job:row.job,companyName:row.company.name,
   applied:row.application!==null,
  });
 }
 const supplements:CareerCalendarSupplement[]=[];
 for(const [jobId,item] of byJob){
  const {job,companyName,applied}=item;
  if(!applied&&job.applicationDeadline){
   const day=careerDayKey(job.applicationDeadline);
   supplements.push({
    key:jobId+":application-deadline",
    kind:"APPLICATION_DEADLINE",day,title:"Apply by deadline · "+job.title,
    companyName,roleTitle:job.title,visible:true,applied:false,
   });
  }
  // An imported source may contain several important events on the same day.
  // The immutable index keeps those distinct without exposing private URLs.
  const dates=job.legacyPostingDetails?.importantDates;
  if(Array.isArray(dates)){
   supplements.push(...legacyJobImportantDatesToSupplements({
    jobId,companyName,roleTitle:job.title,importantDates:dates,
   }));
  }
 }
 for(const row of blocks){
  const day=typeof row.day==="string"?row.day.slice(0,10):"";
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))continue;
  supplements.push({
   key:row.day+":college-blocked",
   kind:"EXAM_BLOCK",day,title:row.reason||"Exam day",
   companyName:"College calendar",note:row.reason,
  });
 }
 return supplements;
}
