import "server-only";
import {and,eq,isNull,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,facultyProfiles} from "@/db/schema";
import {profilePrivateDocumentReceipts} from "@/db/schema/profile-verification";
import type {RequestContext} from "@/modules/identity/context";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {createPrivateReadGrant,createPrivateUploadGrant,readPrivateObjectAttestation} from "@/modules/storage/private-object-storage";
import {facultyProfileDocumentSchema} from "./faculty-profile-document";
import {facultyProfileDocumentStorageReady} from "./faculty-profile-readiness";

const kind=z.enum(["AADHAAR","PAN"]);
const mimes=["application/pdf","image/jpeg","image/png","image/webp"] as const;
const issueSchema=z.strictObject({kind,contentType:z.enum(mimes),
 sizeBytes:z.number().int().min(1).max(10*1024*1024)});
const completeSchema=z.strictObject({kind,objectKey:z.string().min(20).max(1024),
 expectedVersion:z.number().int().nonnegative()});
const readSchema=z.strictObject({kind,receiptId:z.uuid()});
const removeSchema=z.strictObject({kind,expectedVersion:z.number().int().nonnegative()});
function memberFor(context:RequestContext){
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||!member.roles.includes("FACULTY")||
    context.user.platformStatus!=="ACTIVE")throw new Error("FACULTY_ROLE_REQUIRED");
 return member;
}
async function requireOwner(context:RequestContext){
 const member=memberFor(context);
 await getDb().transaction(tx=>assertPersistedPlatformPermission(tx,context,
  "profile.self.manage",{collegeId:member.collegeId,organizationId:member.organizationId}));
 return member;
}
const field=(type:"AADHAAR"|"PAN")=>type==="AADHAAR"?"aadhaarDocumentId":"panDocumentId";

export async function issueOwnFacultyIdentityUpload(context:RequestContext,raw:unknown){
 const member=await requireOwner(context),input=issueSchema.parse(raw);
 const grant=await createPrivateUploadGrant({
  collegeId:member.collegeId,ownerMembershipId:member.id,
  namespace:"profile-verification",contentType:input.contentType,
  expectedSizeBytes:input.sizeBytes,maxSizeBytes:10*1024*1024,
 });
 return {grant,kind:input.kind,status:"UPLOADING" as const};
}

/** Attestation happens before CAS; the receipt and previous revocation commit
 * in one transaction. No client URL, scan verdict, or tenant ID is trusted. */
export async function completeOwnFacultyIdentityUpload(context:RequestContext,raw:unknown){
 const member=memberFor(context),input=completeSchema.parse(raw);
 const verified=await readPrivateObjectAttestation(input.objectKey,{
  collegeId:member.collegeId,ownerMembershipId:member.id,
 });
 if(!(mimes as readonly string[]).includes(verified.contentType)||
    verified.sizeBytes>10*1024*1024)
  throw new Error("FACULTY_IDENTITY_DOCUMENT_INVALID");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"profile.self.manage",{
   collegeId:member.collegeId,organizationId:member.organizationId});
  if(!await facultyProfileDocumentStorageReady(tx))
   throw new Error("PRIVATE_IDENTITY_STORAGE_NOT_READY");
  await tx.insert(facultyProfiles).values({membershipId:member.id}).onConflictDoNothing();
  const [profile]=await tx.select({document:facultyProfiles.profileDocument,
   version:facultyProfiles.profileDocumentVersion}).from(facultyProfiles)
   .where(eq(facultyProfiles.membershipId,member.id)).for("update").limit(1);
  if(!profile||profile.version!==input.expectedVersion)
   throw new Error("FACULTY_PROFILE_VERSION_CONFLICT");
  const original=facultyProfileDocumentSchema.parse(profile.document);
  const previous=original.identitySummary[field(input.kind)];
  const [receipt]=await tx.insert(profilePrivateDocumentReceipts).values({
   owningMembershipId:member.id,purpose:input.kind,
   privateObjectKey:verified.objectKey,objectGeneration:verified.generation,
   sha256Hex:verified.sha256Hex,mimeType:verified.contentType,
   sizeBytes:verified.sizeBytes,scanStatus:"CLEAN",uploadedByUserId:context.user.id,
  }).onConflictDoNothing().returning({id:profilePrivateDocumentReceipts.id});
  if(!receipt)throw new Error("FACULTY_IDENTITY_RECEIPT_EXISTS");
  const document=facultyProfileDocumentSchema.parse({...original,
   identitySummary:{...original.identitySummary,[field(input.kind)]:receipt.id}});
  const [saved]=await tx.update(facultyProfiles).set({
   profileDocument:document,updatedAt:new Date(),
   profileDocumentVersion:sql`${facultyProfiles.profileDocumentVersion}+1`,
  }).where(and(eq(facultyProfiles.membershipId,member.id),
   eq(facultyProfiles.profileDocumentVersion,input.expectedVersion)))
   .returning({version:facultyProfiles.profileDocumentVersion});
  if(!saved)throw new Error("FACULTY_PROFILE_VERSION_CONFLICT");
  if(previous)await tx.update(profilePrivateDocumentReceipts).set({revokedAt:new Date()})
   .where(and(eq(profilePrivateDocumentReceipts.id,previous),
    eq(profilePrivateDocumentReceipts.owningMembershipId,member.id),
    eq(profilePrivateDocumentReceipts.purpose,input.kind),
    isNull(profilePrivateDocumentReceipts.revokedAt)));
  await tx.insert(activityEvents).values({
   organizationId:member.organizationId,collegeId:member.collegeId,
   actorUserId:context.user.id,actorMembershipId:member.id,module:"PEOPLE",
   eventType:"people.faculty_identity_evidence.updated",
   subjectType:"faculty_profile",subjectId:member.id,
   summary:"Faculty private identity document updated",
   metadata:{purpose:input.kind,replaced:Boolean(previous),cleanup:"RETENTION_REVIEW"},
  });
  return {saved:true,version:saved.version,receiptId:receipt.id,
   kind:input.kind,status:"CLEAN" as const,replaced:Boolean(previous)};
 });
}

export async function openOwnFacultyIdentityEvidence(context:RequestContext,raw:unknown){
 const member=await requireOwner(context),input=readSchema.parse(raw);
 const [profile]=await getDb().select({document:facultyProfiles.profileDocument})
  .from(facultyProfiles).where(eq(facultyProfiles.membershipId,member.id)).limit(1);
 const document=facultyProfileDocumentSchema.parse(profile?.document??{});
 if(document.identitySummary[field(input.kind)]!==input.receiptId)
  throw new Error("FACULTY_IDENTITY_DOCUMENT_NOT_CURRENT");
 const [receipt]=await getDb().select().from(profilePrivateDocumentReceipts).where(and(
  eq(profilePrivateDocumentReceipts.id,input.receiptId),
  eq(profilePrivateDocumentReceipts.owningMembershipId,member.id),
  eq(profilePrivateDocumentReceipts.purpose,input.kind),
  eq(profilePrivateDocumentReceipts.scanStatus,"CLEAN"),
  isNull(profilePrivateDocumentReceipts.revokedAt),
 )).limit(1);
 if(!receipt||receipt.retentionUntil&&receipt.retentionUntil<=new Date())
  throw new Error("FACULTY_IDENTITY_DOCUMENT_NOT_CURRENT");
 const grant=await createPrivateReadGrant({
  objectKey:receipt.privateObjectKey,collegeId:member.collegeId,
  ownerMembershipId:member.id,expiresInMs:5*60*1000});
 return {readUrl:grant.readUrl,expiresAt:grant.expiresAt};
}

export async function revokeOwnFacultyIdentityEvidence(context:RequestContext,raw:unknown){
 const member=memberFor(context),input=removeSchema.parse(raw);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"profile.self.manage",{
   collegeId:member.collegeId,organizationId:member.organizationId});
  const [profile]=await tx.select({document:facultyProfiles.profileDocument,
   version:facultyProfiles.profileDocumentVersion}).from(facultyProfiles)
   .where(eq(facultyProfiles.membershipId,member.id)).for("update").limit(1);
  if(!profile||profile.version!==input.expectedVersion)
   throw new Error("FACULTY_PROFILE_VERSION_CONFLICT");
  const original=facultyProfileDocumentSchema.parse(profile.document);
  const receiptId=original.identitySummary[field(input.kind)];
  if(!receiptId)return {saved:false,version:profile.version};
  const document=facultyProfileDocumentSchema.parse({...original,
   identitySummary:{...original.identitySummary,[field(input.kind)]:null}});
  const [saved]=await tx.update(facultyProfiles).set({
   profileDocument:document,updatedAt:new Date(),
   profileDocumentVersion:sql`${facultyProfiles.profileDocumentVersion}+1`,
  }).where(and(eq(facultyProfiles.membershipId,member.id),
   eq(facultyProfiles.profileDocumentVersion,input.expectedVersion)))
   .returning({version:facultyProfiles.profileDocumentVersion});
  if(!saved)throw new Error("FACULTY_PROFILE_VERSION_CONFLICT");
  await tx.update(profilePrivateDocumentReceipts).set({revokedAt:new Date()})
   .where(and(eq(profilePrivateDocumentReceipts.id,receiptId),
    eq(profilePrivateDocumentReceipts.owningMembershipId,member.id),
    eq(profilePrivateDocumentReceipts.purpose,input.kind),
    isNull(profilePrivateDocumentReceipts.revokedAt)));
  await tx.insert(activityEvents).values({
   organizationId:member.organizationId,collegeId:member.collegeId,
   actorUserId:context.user.id,actorMembershipId:member.id,module:"PEOPLE",
   eventType:"people.faculty_identity_evidence.revoked",
   subjectType:"faculty_profile",subjectId:member.id,
   summary:"Faculty private identity evidence revoked",
   metadata:{purpose:input.kind,cleanup:"RETENTION_REVIEW"},
  });
  return {saved:true,version:saved.version};
 });
}
