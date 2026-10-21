import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementApplicationScreenings} from "@/db/schema";
import {placementCollegeApplicationStages} from "@/db/schema/placement-college-application-stages";
import type {RequestContext} from "@/modules/identity/context";
import {getPlacementJob} from "./job-service";

export type SuperAdminDriveAttention={
 label:string;stage:"APPLIED"|"INTERVIEW"|"OFFERED"|null;
 count:number;details:string;
};

/** Read-only, single-drive counterpart to the college dashboard's attention
 * report. getPlacementJob authorizes the selected Super Admin college before
 * ANY application data is read. The source job remains authoritative. */
export async function getSuperAdminDriveAttention(
 context:RequestContext,jobId:string,
):Promise<SuperAdminDriveAttention[]>{
 const job=await getPlacementJob(context,jobId);
 const staleBefore=new Date(Date.now()-7*86400000);
 const [row]=await getDb().select({
  total:sql<number>`count(*)::integer`.mapWith(Number),
  stale:sql<number>`count(*) filter(where
   coalesce(${placementCollegeApplicationStages.stage},
    case when ${placementApplicationScreenings.status}='SHORTLISTED' then 'SHORTLISTED'
     when ${placementApplicationScreenings.status}='REJECTED' then 'REJECTED'
     else 'APPLIED' end)='APPLIED'
   and ${placementApplications.submittedAt}<${staleBefore})::integer`.mapWith(Number),
  unscheduled:sql<number>`count(*) filter(where
   ${placementCollegeApplicationStages.stage}='INTERVIEW'
   and not exists(select 1 from placement_round_candidate_slots s
    where s.job_id=${placementApplications.jobId}
     and s.application_id=${placementApplications.id}
     and s.status='BOOKED'))::integer`.mapWith(Number),
  withoutLetter:sql<number>`count(*) filter(where exists(
   select 1 from placement_offers o
    where o.application_id=${placementApplications.id}
      and o.status in ('ISSUED','ACCEPTED')
      and (o.offer_letter_url is null or trim(o.offer_letter_url)='')))::integer`.mapWith(Number),
  progressed:sql<number>`count(*) filter(where
    coalesce(${placementCollegeApplicationStages.stage},
      ${placementApplicationScreenings.status}) in
      ('SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED','OFFERED','HIRED'))::integer`.mapWith(Number),
 }).from(placementApplications)
  .innerJoin(collegeMemberships,and(
   eq(collegeMemberships.id,placementApplications.membershipId),
   eq(collegeMemberships.collegeId,job.collegeId)))
  .leftJoin(placementApplicationScreenings,
    eq(placementApplicationScreenings.applicationId,placementApplications.id))
  .leftJoin(placementCollegeApplicationStages,
    eq(placementCollegeApplicationStages.applicationId,placementApplications.id))
  .where(and(eq(placementApplications.jobId,job.id),
   eq(placementApplications.status,"SUBMITTED")));
 const result:SuperAdminDriveAttention[]=[];
 if((row?.stale??0)>0)result.push({label:"No action in a week",stage:"APPLIED",
  count:row!.stale,details:"Applications awaiting their first review"});
 if((row?.unscheduled??0)>0)result.push({label:"Marked Interview, nothing scheduled",
  stage:"INTERVIEW",count:row!.unscheduled,details:"Candidates without a booked interview slot"});
 if((row?.withoutLetter??0)>0)result.push({label:"Offered, no offer letter attached",
  stage:"OFFERED",count:row!.withoutLetter,details:"Issued or accepted offers missing a letter"});
 const deadline=job.applicationDeadline;
 if(job.status==="PUBLISHED"&&deadline&&
    deadline.getTime()>Date.now()&&deadline.getTime()-Date.now()<=7*86400000&&
    (row?.total??0)>=5&&(row?.progressed??0)/(row?.total??1)<0.2){
  result.push({label:"Closing soon",stage:null,
   count:row!.total-row!.progressed,details:"Low conversion so far"});
 }
 return result;
}
