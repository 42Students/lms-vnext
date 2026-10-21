import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobs,placementSeasons} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {placementJobIdSchema} from "./validation";
import {auditTpoJobChange,requireTpoJobActor,requireTpoJobCollege} from "./tpo-job-write-base";
import {evaluateTpoDriveDeadline,tpoDriveDeadlineSchema} from "./tpo-drive-deadline-model";
export async function getTpoDriveDeadlineState(context:RequestContext,rawJobId:unknown){
 const collegeId=await requireTpoJobCollege(context),jobId=placementJobIdSchema.parse(rawJobId);
 const [job]=await getDb().select({
  id:placementJobs.id,title:placementJobs.title,status:placementJobs.status,
  updatedAt:placementJobs.updatedAt,seasonId:placementJobs.seasonId,
  applicationDeadline:placementJobs.applicationDeadline,
 }).from(placementJobs).where(and(eq(placementJobs.id,jobId),
  eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const [season]=await getDb().select({status:placementSeasons.status}).from(placementSeasons)
 .where(and(eq(placementSeasons.id,job.seasonId),eq(placementSeasons.collegeId,collegeId))).limit(1);
 return {id:job.id,title:job.title,status:job.status,updatedAt:job.updatedAt.toISOString(),
  applicationDeadline:job.applicationDeadline?.toISOString()??null,
  extendable:job.status==="PUBLISHED"&&season?.status==="ACTIVE"};
}
export async function extendTpoDriveDeadline(context:RequestContext,rawJobId:unknown,raw:unknown){
 const collegeId=await requireTpoJobCollege(context),jobId=placementJobIdSchema.parse(rawJobId);
 const input=tpoDriveDeadlineSchema.parse(raw);
 return getDb().transaction(async tx=>{
  await requireTpoJobActor(tx,context);
  const [job]=await tx.select().from(placementJobs)
   .where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId)))
   .for("update").limit(1);
  if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  if(job.updatedAt.toISOString()!==input.expectedUpdatedAt)
   throw new PlacementsServiceError("PLACEMENT_JOB_STALE");
  const [season]=await tx.select({status:placementSeasons.status}).from(placementSeasons)
   .where(and(eq(placementSeasons.id,job.seasonId),eq(placementSeasons.collegeId,collegeId))).limit(1);
  const decision=evaluateTpoDriveDeadline(job.status,season?.status??null,
   job.applicationDeadline?.toISOString()??null,input.newDeadlineIso,new Date().toISOString());
  if(decision!=="ALLOW"){
   if(decision==="READ_ONLY")throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
   throw new PlacementsServiceError("PLACEMENT_JOB_INVALID_DEADLINE");
  }
  const [updated]=await tx.update(placementJobs).set({
   applicationDeadline:new Date(input.newDeadlineIso),
   updatedAt:sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementJobs.updatedAt})+interval '1 millisecond')`,
  }).where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId),
   eq(placementJobs.status,"PUBLISHED"),
   sql`date_trunc('milliseconds',${placementJobs.updatedAt})=${input.expectedUpdatedAt}::timestamptz`,
  )).returning({id:placementJobs.id,title:placementJobs.title,status:placementJobs.status,
   updatedAt:placementJobs.updatedAt,applicationDeadline:placementJobs.applicationDeadline});
  if(!updated)throw new PlacementsServiceError("PLACEMENT_JOB_STALE");
  await auditTpoJobChange(tx,context,updated,"PLACEMENTS_TPO_DRIVE_DEADLINE_EXTENDED",
   job.applicationDeadline===null?"set deadline for":"extended deadline for",{
   reason:input.reason,action:job.applicationDeadline===null?"SET":"EXTEND",oldDeadline:job.applicationDeadline?.toISOString()??null,
   newDeadline:updated.applicationDeadline?.toISOString()??null,
   fromUpdatedAt:job.updatedAt.toISOString(),toUpdatedAt:updated.updatedAt.toISOString(),
  });
  return {jobId:updated.id,updatedAt:updated.updatedAt.toISOString(),
   applicationDeadline:updated.applicationDeadline?.toISOString()??null,
   message:"Deadline extended"};
 });
}

/** A future scheduled-expiry writer must CAS on both the PUBLISHED state
 * and the exact deadline it originally selected, *in its UPDATE WHERE*.
 * Checking this pure snapshot predicate alone is not sufficient for writes.
 * The current platform deliberately derives closure at read/write time and
 * does not have a persisted automatic closure sweep. */
export function isTpoDriveExpirySnapshotStillCurrent(
 current:{status:string;applicationDeadline:Date|null},
 expectedDeadline:Date,
 now:Date,
):boolean{
 return current.status==="PUBLISHED" &&
  current.applicationDeadline instanceof Date &&
  current.applicationDeadline.getTime()===expectedDeadline.getTime() &&
  now.getTime()>=expectedDeadline.getTime();
}

/** Exact legacy fallback for the caller's retry/error toast. */
export const TPO_DEADLINE_FAILURE_COPY="Failed to extend deadline";
