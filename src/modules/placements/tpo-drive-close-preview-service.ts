import "server-only";
import {and,count,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementApplications,placementJobRounds,placementJobs,placementOffers,placementSeasons} from "@/db/schema";
import {placementDriveSelections} from "@/db/schema/placement-drive-selections";
import {placementWaitlistPromotions} from "@/db/schema/placement-waitlist-promotions";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {endDriveApplicants,settleDriveWithdrawalRequests,tellRecruiterDriveStopped} from "./tpo-drive-stop-effects";
import {placementJobIdSchema} from "./validation";
import {auditTpoJobChange,requireTpoJobActor,requireTpoJobCollege,type TpoJobTx} from "./tpo-job-write-base";
import {evaluateTpoDriveClosure,tpoDriveCloseSchema} from "./tpo-drive-close-preview-model";
async function unreleasedSelections(tx:TpoJobTx,jobId:string){
 const [entry]=await tx.select({n:count()}).from(placementDriveSelections)
  .where(and(eq(placementDriveSelections.jobId,jobId),
   inArray(placementDriveSelections.status,["SELECTED","VERIFIED"])));
 return entry?.n??0;
}
async function pendingWaitlistReservations(tx:TpoJobTx,jobId:string){
 const [row]=await tx.select({n:count()}).from(placementWaitlistPromotions)
  .where(and(eq(placementWaitlistPromotions.jobId,jobId),eq(placementWaitlistPromotions.status,"PENDING")));
 return row?.n??0;
}
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
  const [unreleased]=await tx.select({n:count()}).from(placementOffers)
   .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
   .where(and(eq(placementApplications.jobId,job.id),eq(placementOffers.status,"ISSUED")));
  const issuedOffers=unreleased?.n??0;
  const pendingSelections=await unreleasedSelections(tx,job.id);
  const pendingPromotions=await pendingWaitlistReservations(tx,job.id);
  return {id:job.id,title:job.title,status:job.status,expectedUpdatedAt:job.updatedAt.toISOString(),
   canClose:job.status==="PUBLISHED"&&Boolean(season)&&issuedOffers===0&&pendingSelections===0&&pendingPromotions===0,
   issuedOffers,pendingSelections,pendingPromotions,counts:await impact(tx,job.id)};
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
  const pendingSelections=await unreleasedSelections(tx,job.id);
  // A waitlist seat can be PENDING between its reservation and canonical
  // offer issuance. Closing now would strand that reservation permanently.
  // The job row lock above serializes this check with reservation creation.
  const pendingPromotions=await pendingWaitlistReservations(tx,job.id);
  const decision=evaluateTpoDriveClosure(job.status,season?.status??null,
   counts,input.expectedCounts,pendingSelections+pendingPromotions);
  if(decision==="PREVIEW_STALE")throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE");
  if(decision==="UNRELEASED_SELECTIONS")throw new PlacementsServiceError("PLACEMENT_JOB_NOT_CLOSABLE");
  if(decision!=="ALLOW")throw new PlacementsServiceError("PLACEMENT_JOB_NOT_CLOSABLE");
  const [issued]=await tx.select({n:count()}).from(placementOffers)
   .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
   .where(and(eq(placementApplications.jobId,jobId),eq(placementOffers.status,"ISSUED")));
  if((issued?.n??0)>0)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_CLOSABLE");
  const [saved]=await tx.update(placementJobs).set({
   status:"CLOSED",closedAt:new Date(),
   updatedAt:sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementJobs.updatedAt})+interval '1 millisecond')`,
  }).where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId),
   eq(placementJobs.status,"PUBLISHED"),
   sql`date_trunc('milliseconds',${placementJobs.updatedAt})=${input.expectedUpdatedAt}::timestamptz`,
  )).returning({id:placementJobs.id,title:placementJobs.title,
   status:placementJobs.status,updatedAt:placementJobs.updatedAt});
  if(!saved)throw new PlacementsServiceError("PLACEMENT_JOB_STALE");
  const settledWithdrawalRequests=await settleDriveWithdrawalRequests(
    tx,context,jobId,collegeId,"CLOSED",input.reason,
  );
  const applicantEffects=await endDriveApplicants(
    tx,context,jobId,collegeId,"CLOSED",input.reason,
  );
  const recruiterNotified=await tellRecruiterDriveStopped(
    tx,context,jobId,collegeId,"CLOSED",input.reason,
  );
  await auditTpoJobChange(tx,context,saved,"PLACEMENTS_TPO_DRIVE_CLOSED_WITH_PREVIEW","closed",{
   reason:input.reason,action:input.action,fromStatus:job.status,toStatus:saved.status,
   counts,settledWithdrawalRequests,applicantEffects,recruiterNotified,previewVersion:input.expectedUpdatedAt,
   updatedAt:saved.updatedAt.toISOString(),
  });
  return {id:saved.id,status:saved.status,updatedAt:saved.updatedAt.toISOString(),counts,
   settledWithdrawalRequests,applicantEffects,recruiterNotified};
 });
}
