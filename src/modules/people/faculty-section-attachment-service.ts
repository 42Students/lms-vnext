import "server-only";
import {and,eq,isNull,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,facultyProfiles} from "@/db/schema";
import {profilePrivateDocumentReceipts} from "@/db/schema/profile-verification";
import type {RequestContext} from "@/modules/identity/context";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {createPrivateUploadGrant,createPrivateReadGrant,readPrivateObjectAttestation}
 from "@/modules/storage/private-object-storage";
import {facultyProfileDocumentSchema,type FacultyProfileDocument} from "./faculty-profile-document";
import {facultyProfileDocumentStorageReady} from "./faculty-profile-readiness";

const purposes={
 EDUCATION_CERTIFICATE:{collection:"education",field:"certificateDocumentId"},
 CERTIFICATION:{collection:"certifications",field:"certificateDocumentId"},
 EXPERIENCE_CERTIFICATE:{collection:"experiences",field:"experienceCertificateDocumentId"},
 OFFER_LETTER:{collection:"experiences",field:"offerLetterDocumentId"},
} as const;
type Purpose=keyof typeof purposes;
const purpose=z.enum(["EDUCATION_CERTIFICATE","CERTIFICATION",
 "EXPERIENCE_CERTIFICATE","OFFER_LETTER"]);
const mimes=["application/pdf","image/jpeg","image/png","image/webp"] as const;
const key=z.strictObject({purpose,entryId:z.uuid()});
const begin=key.extend({contentType:z.enum(mimes),
 sizeBytes:z.number().int().min(1).max(10*1024*1024)});
const complete=key.extend({objectKey:z.string().min(20).max(1024),
 expectedVersion:z.number().int().nonnegative()});
const read=key.extend({receiptId:z.uuid()});
const remove=key.extend({expectedVersion:z.number().int().nonnegative()});
function memberFor(context:RequestContext){
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||!member.roles.includes("FACULTY")||
    context.user.platformStatus!=="ACTIVE")
  throw new Error("FACULTY_ROLE_REQUIRED");
 return member;
}
async function requireOwner(context:RequestContext){
 const member=memberFor(context);
 await getDb().transaction(tx=>assertPersistedPlatformPermission(tx,context,
  "profile.self.manage",{collegeId:member.collegeId,organizationId:member.organizationId}));
 return member;
}
function existingReceipt(document:FacultyProfileDocument,kind:Purpose,entryId:string){
 const spec=purposes[kind];
 const entry=document[spec.collection].find(row=>row.id===entryId);
 if(!entry)throw new Error("FACULTY_ATTACHMENT_PARENT_NOT_FOUND");
 const value=(entry as Record<string,unknown>)[spec.field];
 return typeof value==="string"?value:null;
}
function withReceipt(document:FacultyProfileDocument,kind:Purpose,entryId:string,id:string|null){
 const spec=purposes[kind];
 if(!document[spec.collection].some(row=>row.id===entryId))
  throw new Error("FACULTY_ATTACHMENT_PARENT_NOT_FOUND");
 const rows=document[spec.collection].map(row=>row.id===entryId?
  {...row,[spec.field]:id}:row);
 return facultyProfileDocumentSchema.parse({...document,[spec.collection]:rows});
}

export async function issueOwnFacultyAttachmentUpload(context:RequestContext,raw:unknown){
 const member=await requireOwner(context),input=begin.parse(raw);
 const [profile]=await getDb().select({document:facultyProfiles.profileDocument})
  .from(facultyProfiles).where(eq(facultyProfiles.membershipId,member.id)).limit(1);
 existingReceipt(facultyProfileDocumentSchema.parse(profile?.document??{}),input.purpose,input.entryId);
 const grant=await createPrivateUploadGrant({
  collegeId:member.collegeId,ownerMembershipId:member.id,
  namespace:"profile-verification",contentType:input.contentType,
  expectedSizeBytes:input.sizeBytes,maxSizeBytes:10*1024*1024,
 });
 return {grant,status:"UPLOADING" as const,purpose:input.purpose,entryId:input.entryId};
}

/** Profile revision, owner/entry/purpose receipt, audit and old evidence
 * revocation must commit atomically. A raw R2 object path cannot be bound by
 * a user-provided PATCH to any other row or college. */
export async function completeOwnFacultyAttachmentUpload(context:RequestContext,raw:unknown){
 const member=memberFor(context),input=complete.parse(raw);
 const object=await readPrivateObjectAttestation(input.objectKey,{
  collegeId:member.collegeId,ownerMembershipId:member.id,
 });
 if(!(mimes as readonly string[]).includes(object.contentType)||object.sizeBytes>10*1024*1024)
  throw new Error("FACULTY_ATTACHMENT_INVALID_FILE");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"profile.self.manage",{
   collegeId:member.collegeId,organizationId:member.organizationId});
  if(!await facultyProfileDocumentStorageReady(tx))
   throw new Error("FACULTY_PROFILE_STORAGE_NOT_READY");
  const [profile]=await tx.select({
   document:facultyProfiles.profileDocument,
   version:facultyProfiles.profileDocumentVersion,
  }).from(facultyProfiles).where(eq(facultyProfiles.membershipId,member.id))
   .for("update").limit(1);
  if(!profile||profile.version!==input.expectedVersion)
   throw new Error("FACULTY_PROFILE_VERSION_CONFLICT");
  const old=facultyProfileDocumentSchema.parse(profile.document);
  const previous=existingReceipt(old,input.purpose,input.entryId);
  const [receipt]=await tx.insert(profilePrivateDocumentReceipts).values({
   owningMembershipId:member.id,purpose:input.purpose,relatedEntryId:input.entryId,
   privateObjectKey:object.objectKey,objectGeneration:object.generation,
   sha256Hex:object.sha256Hex,mimeType:object.contentType,
   sizeBytes:object.sizeBytes,scanStatus:"CLEAN",uploadedByUserId:context.user.id,
  }).onConflictDoNothing().returning({id:profilePrivateDocumentReceipts.id});
  if(!receipt)throw new Error("FACULTY_ATTACHMENT_RECEIPT_EXISTS");
  const next=withReceipt(old,input.purpose,input.entryId,receipt.id);
  const [saved]=await tx.update(facultyProfiles).set({
   profileDocument:next,updatedAt:new Date(),
   profileDocumentVersion:sql`${facultyProfiles.profileDocumentVersion}+1`,
  }).where(and(eq(facultyProfiles.membershipId,member.id),
   eq(facultyProfiles.profileDocumentVersion,input.expectedVersion)))
   .returning({version:facultyProfiles.profileDocumentVersion});
  if(!saved)throw new Error("FACULTY_PROFILE_VERSION_CONFLICT");
  if(previous)await tx.update(profilePrivateDocumentReceipts).set({
   revokedAt:new Date(),retentionUntil:new Date(Date.now()+7*86400000),
  }).where(and(eq(profilePrivateDocumentReceipts.id,previous),
   eq(profilePrivateDocumentReceipts.owningMembershipId,member.id),
   eq(profilePrivateDocumentReceipts.purpose,input.purpose),
   eq(profilePrivateDocumentReceipts.relatedEntryId,input.entryId),
   isNull(profilePrivateDocumentReceipts.revokedAt)));
  await tx.insert(activityEvents).values({
   collegeId:member.collegeId,organizationId:member.organizationId,
   actorUserId:context.user.id,actorMembershipId:member.id,module:"PEOPLE",
   eventType:"people.faculty_attachment.updated",subjectType:"faculty_profile",
   subjectId:member.id,summary:"Faculty private profile attachment updated",
   metadata:{purpose:input.purpose,entryId:input.entryId,replaced:Boolean(previous)},
  });
  return {saved:true,version:saved.version,purpose:input.purpose,
   entryId:input.entryId,receiptId:receipt.id,replaced:Boolean(previous)};
 });
}

export async function openOwnFacultyAttachment(context:RequestContext,raw:unknown){
 const member=await requireOwner(context),input=read.parse(raw);
 const [profile]=await getDb().select({document:facultyProfiles.profileDocument})
  .from(facultyProfiles).where(eq(facultyProfiles.membershipId,member.id)).limit(1);
 const document=facultyProfileDocumentSchema.parse(profile?.document??{});
 if(existingReceipt(document,input.purpose,input.entryId)!==input.receiptId)
  throw new Error("FACULTY_ATTACHMENT_NOT_CURRENT");
 const [receipt]=await getDb().select().from(profilePrivateDocumentReceipts)
  .where(and(eq(profilePrivateDocumentReceipts.id,input.receiptId),
   eq(profilePrivateDocumentReceipts.owningMembershipId,member.id),
   eq(profilePrivateDocumentReceipts.purpose,input.purpose),
   eq(profilePrivateDocumentReceipts.relatedEntryId,input.entryId),
   eq(profilePrivateDocumentReceipts.scanStatus,"CLEAN"),
   isNull(profilePrivateDocumentReceipts.revokedAt))).limit(1);
 if(!receipt||receipt.retentionUntil&&receipt.retentionUntil<=new Date())
  throw new Error("FACULTY_ATTACHMENT_NOT_CURRENT");
 const grant=await createPrivateReadGrant({
  objectKey:receipt.privateObjectKey,collegeId:member.collegeId,
  ownerMembershipId:member.id,expiresInMs:5*60*1000,
 });
 return {readUrl:grant.readUrl,expiresAt:grant.expiresAt};
}
export async function revokeOwnFacultyAttachment(context:RequestContext,raw:unknown){
 const member=memberFor(context),input=remove.parse(raw);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"profile.self.manage",{
   collegeId:member.collegeId,organizationId:member.organizationId});
  const [profile]=await tx.select({
   document:facultyProfiles.profileDocument,version:facultyProfiles.profileDocumentVersion,
  }).from(facultyProfiles).where(eq(facultyProfiles.membershipId,member.id))
   .for("update").limit(1);
  if(!profile||profile.version!==input.expectedVersion)
   throw new Error("FACULTY_PROFILE_VERSION_CONFLICT");
  const old=facultyProfileDocumentSchema.parse(profile.document);
  const previous=existingReceipt(old,input.purpose,input.entryId);
  if(!previous)return {saved:false,version:profile.version};
  const next=withReceipt(old,input.purpose,input.entryId,null);
  const [saved]=await tx.update(facultyProfiles).set({
   profileDocument:next,updatedAt:new Date(),
   profileDocumentVersion:sql`${facultyProfiles.profileDocumentVersion}+1`,
  }).where(and(eq(facultyProfiles.membershipId,member.id),
   eq(facultyProfiles.profileDocumentVersion,input.expectedVersion)))
   .returning({version:facultyProfiles.profileDocumentVersion});
  if(!saved)throw new Error("FACULTY_PROFILE_VERSION_CONFLICT");
  await tx.update(profilePrivateDocumentReceipts).set({
   revokedAt:new Date(),retentionUntil:new Date(Date.now()+7*86400000),
  }).where(and(eq(profilePrivateDocumentReceipts.id,previous),
   eq(profilePrivateDocumentReceipts.owningMembershipId,member.id),
   eq(profilePrivateDocumentReceipts.purpose,input.purpose),
   eq(profilePrivateDocumentReceipts.relatedEntryId,input.entryId),
   isNull(profilePrivateDocumentReceipts.revokedAt)));
  await tx.insert(activityEvents).values({
   collegeId:member.collegeId,organizationId:member.organizationId,
   actorUserId:context.user.id,actorMembershipId:member.id,module:"PEOPLE",
   eventType:"people.faculty_attachment.revoked",subjectType:"faculty_profile",
   subjectId:member.id,summary:"Faculty private profile attachment revoked",
   metadata:{purpose:input.purpose,entryId:input.entryId},
  });
  return {saved:true,version:saved.version,purpose:input.purpose,entryId:input.entryId};
 });
}
