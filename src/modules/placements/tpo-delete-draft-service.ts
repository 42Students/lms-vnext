import "server-only";
import {and,count,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementApplications,placementJobs,placementOffers} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {auditTpoJobChange,requireTpoJobActor,requireTpoJobCollege} from "./tpo-job-write-base";
import {placementJobIdSchema} from "./validation";
import {canDeleteUnpublishedDrive,tpoDeleteDraftSchema} from "./tpo-delete-draft-model";

/** Archive only an empty unpublished draft. Historical records are retained. */
export async function deleteTpoUnpublishedDraft(context:RequestContext,rawJobId:unknown,raw:unknown){
 const collegeId=await requireTpoJobCollege(context);
 const jobId=placementJobIdSchema.parse(rawJobId),input=tpoDeleteDraftSchema.parse(raw);
 return getDb().transaction(async tx=>{
  await requireTpoJobActor(tx,context);
  const [job]=await tx.select({id:placementJobs.id,title:placementJobs.title,
   status:placementJobs.status,updatedAt:placementJobs.updatedAt})
   .from(placementJobs).where(and(eq(placementJobs.id,jobId),
    eq(placementJobs.collegeId,collegeId))).for("update").limit(1);
  if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  const [apps]=await tx.select({n:count()}).from(placementApplications)
   .where(eq(placementApplications.jobId,jobId));
  const [offers]=await tx.select({n:count()}).from(placementOffers)
   .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
   .where(eq(placementApplications.jobId,jobId));
  const decision=canDeleteUnpublishedDrive({status:job.status,
   applications:apps?.n??0,offers:offers?.n??0,
   matchesVersion:job.updatedAt.toISOString()===new Date(input.expectedUpdatedAt).toISOString()});
  if(decision!=="ALLOW")return {archived:false,reason:decision};
  const now=new Date();
  const [saved]=await tx.update(placementJobs).set({status:"ARCHIVED",
   archivedAt:now,updatedAt:now})
   .where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId),
    eq(placementJobs.status,"DRAFT"),eq(placementJobs.updatedAt,job.updatedAt)))
   .returning({id:placementJobs.id});
  if(!saved)return {archived:false,reason:"STALE" as const};
  await auditTpoJobChange(tx,context,job,"placements.draft.archived","archived unpublished",{
   unpublished:true,submittedApplications:0,issuedOffers:0});
  return {archived:true,reason:null};
 });
}
