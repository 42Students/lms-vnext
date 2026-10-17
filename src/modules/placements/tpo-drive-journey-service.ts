import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementApplications,placementJobs} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoJobCollege} from "./tpo-job-write-base";
import {placementJobIdSchema} from "./validation";
import {previewEligiblePublishedDrive} from "./tpo-drive-publish-effects";
import {PlacementsServiceError} from "./errors";

/** TPO-drive-workspace-20: stage counts are distinct applications, not offer versions. */
export async function getTpoDriveJourney(context:RequestContext,rawJobId:unknown){
 const collegeId=await requireTpoJobCollege(context),jobId=placementJobIdSchema.parse(rawJobId);
 const db=getDb();
 const [job]=await db.select({id:placementJobs.id,title:placementJobs.title,collegeId:placementJobs.collegeId})
  .from(placementJobs).where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const [counts]=await db.select({
  applied:sql<number>`count(*) filter(where ${placementApplications.status}='SUBMITTED')::int`,
  shortlisted:sql<number>`count(*) filter(where exists(
    select 1 from placement_application_screenings s where s.application_id=${placementApplications.id}
      and s.status='SHORTLISTED'))::int`,
  interviewed:sql<number>`count(*) filter(where exists(
    select 1 from placement_round_results r join placement_job_rounds p on p.id=r.round_id
    where r.application_id=${placementApplications.id} and p.job_id=${jobId}
      and p.kind='INTERVIEW' and r.status='APPLIED'))::int`,
  offered:sql<number>`count(*) filter(where exists(
    select 1 from placement_offers o where o.application_id=${placementApplications.id}
    and o.status in ('ISSUED','ACCEPTED')))::int`,
  placed:sql<number>`count(*) filter(where exists(
    select 1 from placement_offers o join placement_joining_outcomes j on j.offer_id=o.id
    where o.application_id=${placementApplications.id} and o.status='ACCEPTED'
      and j.status='JOINED'))::int`,
 }).from(placementApplications).where(eq(placementApplications.jobId,jobId));
 const reach=await db.transaction(tx=>previewEligiblePublishedDrive(tx,context,job),{accessMode:"read only"});
 const stages=[
  {name:"Registered & eligible",count:reach.eligible,href:"/tpo/placements/jobs/"+jobId+"/about"},
  {name:"Applied",count:counts?.applied??0,href:"/tpo/placements/jobs/"+jobId+"/applicants-pipeline?stage=SUBMITTED"},
  {name:"Shortlisted",count:counts?.shortlisted??0,href:"/tpo/placements/jobs/"+jobId+"/applicants-pipeline?stage=SHORTLISTED"},
  {name:"Interviewed",count:counts?.interviewed??0,href:"/tpo/placements/jobs/"+jobId+"/rounds"},
  {name:"Offered",count:counts?.offered??0,href:"/tpo/placements/jobs/"+jobId+"/offers"},
  {name:"Placed",count:counts?.placed??0,href:"/tpo/placements/jobs/"+jobId+"/joining"},
 ];
 return {stages,excluded:reach.excluded,considered:reach.candidateCount,
  definition:"Registered & eligible means the current opted-in, eligible notification audience; later stages count distinct persisted applications."};
}
