import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementJobs} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {createPrivateUploadGrant,readPrivateObjectAttestation} from "@/modules/storage/private-object-storage";
import {validateRecruiterJdFile} from "./recruiter-jd-upload-service";
import {placementJobIdSchema} from "./validation";
import {PlacementsServiceError} from "./errors";
import {auditTpoJobChange,requireTpoJobActor,requireTpoJobCollege} from "./tpo-job-write-base";

const keySchema=z.string().regex(
 /^private\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/placement-document\/[0-9a-f-]{36}$/i,
);
const jobWriteSchema=z.strictObject({
 action:z.enum(["CONFIRM","REMOVE"]),
 expectedUpdatedAt:z.iso.datetime({offset:true}).transform(value=>new Date(value).toISOString()),
 objectKey:keySchema.optional(),
 reason:z.string().trim().min(10).max(1000),
}).superRefine((value,ctx)=>{
 if(value.action==="CONFIRM"&&!value.objectKey)
  ctx.addIssue({code:"custom",path:["objectKey"],message:"A verified document is required."});
 if(value.action==="REMOVE"&&value.objectKey)
  ctx.addIssue({code:"custom",path:["objectKey"],message:"Remove does not accept a document key."});
});
const initiateSchema=z.strictObject({
 action:z.literal("INITIATE"),originalName:z.string().min(1).max(255),
 contentType:z.string(),sizeBytes:z.number().int().positive(),
});
async function activeDrive(context:RequestContext,jobId:string){
 const collegeId=await requireTpoJobCollege(context);
 const [job]=await getDb().select({
  id:placementJobs.id,status:placementJobs.status,
 }).from(placementJobs).where(and(
  eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 if(job.status!=="DRAFT"&&job.status!=="PUBLISHED")
  throw new PlacementsServiceError("PLACEMENT_JOB_NOT_EDITABLE");
 if(!context.membership||context.membership.collegeId!==collegeId)
  throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 return {collegeId,ownerMembershipId:context.membership.id};
}
/** Signed 5 MB PDF/Word intake; no browser-provided URL is ever persisted. */
export async function initiateTpoJdUpload(context:RequestContext,rawJobId:unknown,raw:unknown){
 const jobId=placementJobIdSchema.parse(rawJobId);
 const input=initiateSchema.parse(raw);
 const scope=await activeDrive(context,jobId);
 const verified=validateRecruiterJdFile(input);
 const grant=await createPrivateUploadGrant({
  ...scope,namespace:"placement-document",originalName:verified.originalName,
  contentType:verified.contentType,expectedSizeBytes:input.sizeBytes,
  maxSizeBytes:5*1024*1024,
 });
 return {uploadUrl:grant.uploadUrl,requiredHeaders:grant.requiredHeaders,
  objectKey:grant.objectKey,expiresAt:grant.expiresAt.toISOString()};
}
/** Attest outside the row lock, then recheck job/actor/revision transactionally.
 * Replacing/removing a JD changes no unrelated role/eligibility settings.
 * Audit records the presence only, never signed URL or private object key.
 */
export async function saveTpoJdUpload(context:RequestContext,rawJobId:unknown,raw:unknown){
 const jobId=placementJobIdSchema.parse(rawJobId);
 const input=jobWriteSchema.parse(raw);
 const scope=await activeDrive(context,jobId);
 if(input.action==="CONFIRM"){
  const proof=await readPrivateObjectAttestation(input.objectKey!,scope);
  if(proof.sizeBytes>5*1024*1024||
     !["application/pdf","application/msword",
       "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(proof.contentType))
   throw new Error("JD_FILE_TYPE_INVALID");
 }
 return getDb().transaction(async tx=>{
  await requireTpoJobActor(tx,context);
  const [job]=await tx.select({
   id:placementJobs.id,title:placementJobs.title,status:placementJobs.status,
   updatedAt:placementJobs.updatedAt,
   jobDescriptionObjectPath:placementJobs.jobDescriptionObjectPath,
  }).from(placementJobs).where(and(
   eq(placementJobs.id,jobId),eq(placementJobs.collegeId,scope.collegeId),
  )).for("update").limit(1);
  if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  if(job.status!=="DRAFT"&&job.status!=="PUBLISHED")
   throw new PlacementsServiceError("PLACEMENT_JOB_NOT_EDITABLE");
  if(job.updatedAt.toISOString()!==input.expectedUpdatedAt)
   throw new PlacementsServiceError("PLACEMENT_JOB_STALE");
  const next=input.action==="CONFIRM"?input.objectKey!:null;
  if(job.jobDescriptionObjectPath===next)
   return {updatedAt:job.updatedAt.toISOString(),hasDocument:Boolean(next),changed:false};
  const [updated]=await tx.update(placementJobs).set({
   jobDescriptionObjectPath:next,
   updatedAt:sql`greatest(clock_timestamp(), date_trunc('milliseconds', ${placementJobs.updatedAt}) + interval '1 millisecond')`,
  }).where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,scope.collegeId),
   sql`date_trunc('milliseconds', ${placementJobs.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`,
  )).returning({updatedAt:placementJobs.updatedAt});
  if(!updated)throw new PlacementsServiceError("PLACEMENT_JOB_STALE");
  await auditTpoJobChange(tx,context,job,"PLACEMENTS_TPO_DRIVE_EDITED","updated JD for",{
   reason:input.reason,operation:input.action,
   hadDocument:Boolean(job.jobDescriptionObjectPath),hasDocument:Boolean(next),
  });
  return {updatedAt:updated.updatedAt.toISOString(),hasDocument:Boolean(next),changed:true};
 });
}

/** Metadata only: a draft wizard may obtain a fresh optimistic token.
 * Never expose the private object key or signed URL in this response.
 */
export async function getTpoJdStatus(context:RequestContext,rawJobId:unknown){
 const jobId=placementJobIdSchema.parse(rawJobId);
 const scope=await activeDrive(context,jobId);
 const [job]=await getDb().select({
  updatedAt:placementJobs.updatedAt,
  hasDocument:sql<boolean>`${placementJobs.jobDescriptionObjectPath} is not null`,
 }).from(placementJobs).where(and(
  eq(placementJobs.id,jobId),eq(placementJobs.collegeId,scope.collegeId))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 return {updatedAt:job.updatedAt.toISOString(),hasDocument:job.hasDocument};
}
