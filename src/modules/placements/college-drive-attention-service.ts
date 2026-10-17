import "server-only";
import {and,desc,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementApplicationScreenings,
 placementJobs,placementOffers} from "@/db/schema";
import {placementCollegeApplicationStages} from "@/db/schema/placement-college-application-stages";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";

const DEFAULT_STALE_DAYS=7;
export type CollegeAttentionCategory="STALE_APPLIED"|"INTERVIEW_UNSCHEDULED"|"LOW_CONVERSION";
export async function getCollegeDriveAttention(context:RequestContext){
 const collegeId=await requireCollegePlacementAdmin(context),db=getDb();
 const jobs=await db.select({id:placementJobs.id,title:placementJobs.title,
  deadline:placementJobs.applicationDeadline,status:placementJobs.status})
  .from(placementJobs).where(and(eq(placementJobs.collegeId,collegeId),
    eq(placementJobs.status,"PUBLISHED"))).orderBy(desc(placementJobs.createdAt)).limit(60);
 if(!jobs.length)return {jobs:[],total:0,categories:[] as {
  jobId:string;title:string;category:CollegeAttentionCategory;count:number;href:string;
 }[],hasOfferLetterEvidence:false,lookbackDays:DEFAULT_STALE_DAYS};
 const records=await db.select({
  jobId:placementApplications.jobId,
  total:sql<number>`count(*)::integer`.as("app_count"),
  stale:sql<number>`count(*) filter (where
    coalesce(${placementCollegeApplicationStages.stage},
      case when ${placementApplicationScreenings.status}='SHORTLISTED' then 'SHORTLISTED'
       when ${placementApplicationScreenings.status}='REJECTED' then 'REJECTED'
       else 'APPLIED' end)='APPLIED'
    and ${placementApplications.submittedAt} < now()- interval '7 days')::integer`.as("stale"),
  withoutSlot:sql<number>`count(*) filter (where
    ${placementCollegeApplicationStages.stage}='INTERVIEW'
    and not exists(select 1 from placement_round_candidate_slots s
      where s.job_id=${placementApplications.jobId}
        and s.application_id=${placementApplications.id} and s.status='BOOKED'))::integer`.as("unscheduled"),
  shortlisted:sql<number>`count(*) filter (where
    coalesce(${placementCollegeApplicationStages.stage},
      ${placementApplicationScreenings.status}) in
      ('SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED','OFFERED','HIRED'))::integer`.as("progressed"),
 }).from(placementApplications)
  .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
    eq(collegeMemberships.collegeId,collegeId)))
  .leftJoin(placementApplicationScreenings,
    eq(placementApplicationScreenings.applicationId,placementApplications.id))
  .leftJoin(placementCollegeApplicationStages,
    eq(placementCollegeApplicationStages.applicationId,placementApplications.id))
  .where(and(inArray(placementApplications.jobId,jobs.map(job=>job.id)),
    eq(placementApplications.status,"SUBMITTED")))
  .groupBy(placementApplications.jobId);
 const counts=new Map(records.map(row=>[row.jobId,row]));
 const categories: {jobId:string;title:string;category:CollegeAttentionCategory;
  count:number;href:string}[]=[];
 const now=Date.now();
 for(const job of jobs){
  const row=counts.get(job.id);
  if(!row)continue;
  const base="/college/placements/jobs/"+job.id+"/applications";
  if(row.stale>0)categories.push({jobId:job.id,title:job.title,
   category:"STALE_APPLIED",count:row.stale,href:base+"?stage=APPLIED"});
  if(row.withoutSlot>0)categories.push({jobId:job.id,title:job.title,
   category:"INTERVIEW_UNSCHEDULED",count:row.withoutSlot,href:base+"?stage=INTERVIEW"});
  if(job.deadline&&job.deadline.getTime()>now&&job.deadline.getTime()-now<3*86400000&&
    row.total>=5&&row.shortlisted/row.total<0.2){
    categories.push({jobId:job.id,title:job.title,category:"LOW_CONVERSION",
     count:row.total-row.shortlisted,href:base+"?stage=APPLIED"});
  }
 }
 return {jobs:jobs.map(job=>({...job,applicants:counts.get(job.id)?.total??0,
  attention:categories.filter(row=>row.jobId===job.id).length})),
  total:categories.length,categories,hasOfferLetterEvidence:false,
  lookbackDays:DEFAULT_STALE_DAYS};
}
