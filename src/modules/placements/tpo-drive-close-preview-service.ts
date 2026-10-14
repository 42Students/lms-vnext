import "server-only";
import {and,count,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementApplications,placementJobRounds,placementJobs,placementOffers,placementSeasons} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {placementJobIdSchema} from "./validation";
import {auditTpoJobChange,requireTpoJobActor,requireTpoJobCollege,type TpoJobTx} from "./tpo-job-write-base";
import {evaluateTpoDriveClosure,tpoDriveCloseSchema} from "./tpo-drive-close-preview-model";
async function impact(tx:TpoJobTx,jobId:string){
 const [applications,rounds,offers]=await Promise.all([
  tx.select({n:count()}).from(placementApplications).where(eq(placementApplications.jobId,jobId)),
  tx.select({n:count()}).from(placementJobRounds).where(eq(placementJobRounds.jobId,jobId)),
  tx.select({n:count()}).from(placementOffers)
   .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
   .where(eq(placementApplications.jobId,jobId)),
 ]);
 return {applications:applications[0]?.n??0,rounds:rounds[0]?.n??0,offers:offers[0]?.n??0};
}
export async function getTpoDriveClosePreview(context:RequestContext,rawJobId:unknown){
 const collegeId=await requireTpoJobCollege(context),jobId=placementJobIdSchema.parse(rawJobId);
 return getDb().transaction(async tx=>{
  const [job]=await tx.select({id:placementJobs.id,title:placementJobs.title,
   status:placementJobs.status,seasonId:placementJobs.seasonId,updatedAt:placementJobs.updatedAt})
   .from(placementJobs).where(and(eq(placementJobs.id,jobId),
     eq(placementJobs.collegeId,collegeId))).limit(1);
  if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  const [season]=await tx.select({status:placementSeasons.status}).from(placementSeasons)
   .where(and(eq(placementSeasons.id,job.seasonId),eq(placementSeasons.collegeId,collegeId))).limit(1);
  return {id:job.id,title:job.title,status:job.status,expectedUpdatedAt:job.updatedAt.toISOString(),
   canClose:job.status==="PUBLISHED"&&season?.status==="ACTIVE",
   counts:await impact(tx,job.id)};
 });
}
export async function closeTpoDriveWithPreview(context:RequestContext,rawJobId:unknown,raw:unknown){
 const collegeId=await requireTpoJobCollege(context),jobId=placementJobIdSchema.parse(rawJobId);
 const input=tpoDriveCloseSchema.parse(raw);
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
  const counts=await impact(tx,job.id);
  const decision=evaluateTpoDriveClosure(job.status,season?.status??null,
   counts,input.expectedCounts);
  if(decision==="PREVIEW_STALE")throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE");
  if(decision!=="ALLOW")throw new PlacementsServiceError("PLACEMENT_JOB_NOT_CLOSABLE");
  const [saved]=await tx.update(placementJobs).set({
   status:"CLOSED",closedAt:new Date(),
   updatedAt:sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementJobs.updatedAt})+interval '1 millisecond')`,
  }).where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId),
   eq(placementJobs.status,"PUBLISHED"),
   sql`date_trunc('milliseconds',${placementJobs.updatedAt})=${input.expectedUpdatedAt}::timestamptz`,
  )).returning({id:placementJobs.id,title:placementJobs.title,
   status:placementJobs.status,updatedAt:placementJobs.updatedAt});
  if(!saved)throw new PlacementsServiceError("PLACEMENT_JOB_STALE");
  await auditTpoJobChange(tx,context,saved,"PLACEMENTS_TPO_DRIVE_CLOSED_WITH_PREVIEW","closed",{
   reason:input.reason,action:input.action,fromStatus:job.status,toStatus:saved.status,
   counts,previewVersion:input.expectedUpdatedAt,updatedAt:saved.updatedAt.toISOString(),
  });
  return {id:saved.id,status:saved.status,updatedAt:saved.updatedAt.toISOString(),counts};
 });
}
