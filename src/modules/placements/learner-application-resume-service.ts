import "server-only";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementApplications,placementApplicationPrivateArtifacts,placementJobs}
 from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {createPrivateUploadGrant,readPrivateObjectAttestation,
 createPrivateReadGrant} from "@/modules/storage/private-object-storage";

const appId=z.string().uuid();
const request=z.discriminatedUnion("action",[
 z.strictObject({action:z.literal("INITIATE"),contentType:z.literal("application/pdf"),
   sizeBytes:z.number().int().min(1).max(10*1024*1024)}),
 z.strictObject({action:z.literal("CONFIRM"),
   objectKey:z.string().min(5).max(700)}),
]);
function ownMembership(context:RequestContext){
 if(context.user.platformStatus!=="ACTIVE"||!context.membership||
   context.membership.status!=="ACTIVE"||!hasMembershipRole(context,"LEARNER"))
  throw new Error("PLACEMENT_RESUME_NOT_FOUND");
 return context.membership;
}
async function ownApplication(context:RequestContext,id:string){
 const member=ownMembership(context);
 const [record]=await getDb().select({
   id:placementApplications.id,
   collegeId:placementJobs.collegeId,
   status:placementApplications.status,
 }).from(placementApplications).innerJoin(placementJobs,
  eq(placementJobs.id,placementApplications.jobId))
  .where(and(eq(placementApplications.id,id),
   eq(placementApplications.membershipId,member.id),
   eq(placementJobs.collegeId,member.collegeId))).limit(1);
 if(!record)throw new Error("PLACEMENT_RESUME_NOT_FOUND");
 return {member,record};
}
export async function updateOwnApplicationResume(context:RequestContext,
 rawId:unknown,raw:unknown){
 const id=appId.parse(rawId),input=request.parse(raw);
 const {member,record}=await ownApplication(context,id);
 if(record.status!=="SUBMITTED")throw new Error("PLACEMENT_RESUME_NOT_ACTIVE");
 if(input.action==="INITIATE"){
  const grant=await createPrivateUploadGrant({
   collegeId:member.collegeId,ownerMembershipId:member.id,
   namespace:"placement-document",contentType:input.contentType,
   expectedSizeBytes:input.sizeBytes,maxSizeBytes:10*1024*1024,
  });
  return {action:"UPLOAD",objectKey:grant.objectKey,
    uploadUrl:grant.uploadUrl,headers:grant.requiredHeaders,
    expiresAt:grant.expiresAt.toISOString()};
 }
 const proof=await readPrivateObjectAttestation(input.objectKey,{
  collegeId:member.collegeId,ownerMembershipId:member.id,
 });
 if(proof.contentType!=="application/pdf"||proof.sizeBytes>10*1024*1024)
  throw new Error("PLACEMENT_RESUME_UNVERIFIED");
 return getDb().transaction(async tx=>{
  const [current]=await tx.select({
   id:placementApplications.id,status:placementApplications.status,
  }).from(placementApplications).where(and(
   eq(placementApplications.id,id),
   eq(placementApplications.membershipId,member.id),
   eq(placementApplications.status,"SUBMITTED"))).for("update").limit(1);
  if(!current)throw new Error("PLACEMENT_RESUME_NOT_ACTIVE");
  const [previous]=await tx.select({
   resumeObjectPath:placementApplicationPrivateArtifacts.resumeObjectPath,
   resumeHistory:placementApplicationPrivateArtifacts.resumeHistory,
  }).from(placementApplicationPrivateArtifacts)
    .where(eq(placementApplicationPrivateArtifacts.applicationId,id))
    .for("update").limit(1);
  if(previous?.resumeObjectPath===input.objectKey)
   return {action:"CONFIRM",changed:false};
  const now=new Date(),history=previous?.resumeHistory??[];
  const prior=previous?.resumeObjectPath
   ?[{objectPath:previous.resumeObjectPath,replacedAt:now.toISOString()}]:[];
  await tx.insert(placementApplicationPrivateArtifacts).values({
   applicationId:id,resumeObjectPath:input.objectKey,
   resumeHistory:[...history,...prior],
   updatedByUserId:context.user.id,updatedAt:now,
  }).onConflictDoUpdate({
   target:placementApplicationPrivateArtifacts.applicationId,
   set:{resumeObjectPath:input.objectKey,resumeHistory:[...history,...prior],
    updatedByUserId:context.user.id,updatedAt:now},
  });
  return {action:"CONFIRM",changed:true};
 });
}
export async function readOwnApplicationResume(context:RequestContext,
 rawId:unknown){
 const id=appId.parse(rawId);
 const {member}=await ownApplication(context,id);
 const [artifact]=await getDb().select({
  objectKey:placementApplicationPrivateArtifacts.resumeObjectPath,
 }).from(placementApplicationPrivateArtifacts)
 .where(eq(placementApplicationPrivateArtifacts.applicationId,id)).limit(1);
 if(!artifact?.objectKey)return {ready:false as const};
 const proof=await createPrivateReadGrant({
  objectKey:artifact.objectKey,collegeId:member.collegeId,
  ownerMembershipId:member.id,
 });
 return {ready:true as const,readUrl:proof.readUrl,
  expiresAt:proof.expiresAt.toISOString(),contentType:proof.contentType};
}
