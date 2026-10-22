import "server-only";

import {and,eq,isNull,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,colleges,collegeMemberships,membershipRoles} from "@/db/schema";
import {profilePrivateDocumentReceipts} from "@/db/schema/profile-verification";
import {createPrivateReadGrant,createPrivateUploadGrant,readPrivateObjectAttestation} from "@/modules/storage/private-object-storage";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission,type PermissionTransaction} from "@/modules/permissions/persisted-actor";
import {facultyProfileDocumentStorageReady} from "./faculty-profile-readiness";
import {emptyFacultyProfileDocument,facultyProfileDocumentSchema} from "./faculty-profile-document";
import {facultySelfSectionPatchSchema,updateFacultyProfileSection} from "./faculty-self-section-model";
import {PeopleServiceError} from "./errors";

const targetSchema=z.string().uuid();
type DocumentRow={profile_document:unknown;profile_document_version:number};

async function requireFacultyTarget(
 tx:PermissionTransaction,
 context:RequestContext,membershipId:string,
) {
 const [target]=await tx.select({
  id:collegeMemberships.id,userId:collegeMemberships.userId,
  collegeId:collegeMemberships.collegeId,organizationId:colleges.organizationId,
 }).from(collegeMemberships)
  .innerJoin(colleges,eq(colleges.id,collegeMemberships.collegeId))
  .where(eq(collegeMemberships.id,membershipId)).for("share").limit(1);
 if(!target)throw new PeopleServiceError("FACULTY_ROLE_REQUIRED");
 const scope={collegeId:target.collegeId,organizationId:target.organizationId};
 requirePermission(context,"people.manage",scope);
 const persisted=await assertPersistedPlatformPermission(tx,context,"people.manage",scope);
 const roles=await tx.select({role:membershipRoles.role}).from(membershipRoles)
  .where(eq(membershipRoles.membershipId,membershipId)).for("share");
 if(!roles.some(item=>item.role==="FACULTY"))throw new PeopleServiceError("FACULTY_ROLE_REQUIRED");
 if(!isSuperAdmin(persisted)&&persisted.membership?.collegeId!==target.collegeId)
  throw new AuthorizationError("people.manage");
 return {target,roles:roles.map(item=>item.role),persisted};
}

/** This scoped adapter is distinct from the faculty self endpoint. A college
 * administrator cannot use the self API to edit another person's document. */
export async function getFacultyDocumentForAdmin(context:RequestContext,idRaw:unknown) {
 const id=targetSchema.parse(idRaw);
 return getDb().transaction(async tx=>{
  await requireFacultyTarget(tx,context,id);
  if(!await facultyProfileDocumentStorageReady(tx))
   throw new PeopleServiceError("PRIVATE_IDENTITY_STORAGE_NOT_READY");
  const rows=await tx.execute<DocumentRow>(sql`
   select profile_document,profile_document_version from faculty_profiles
   where membership_id=${id} for share
  `);
  const row=rows.rows[0];
  return {document:facultyProfileDocumentSchema.parse(row?.profile_document??emptyFacultyProfileDocument),
   version:row?.profile_document_version??0};
 });
}

export async function patchFacultyDocumentForAdmin(
 context:RequestContext,idRaw:unknown,rawPatch:unknown,
) {
 const id=targetSchema.parse(idRaw);
 const patch=facultySelfSectionPatchSchema.parse(rawPatch);
 return getDb().transaction(async tx=>{
  const {roles,persisted}=await requireFacultyTarget(tx,context,id);
  if(!isSuperAdmin(persisted)&&(roles.includes("COLLEGE_ADMIN")||roles.includes("TPO")))
   throw new AuthorizationError("people.manage");
  if(!await facultyProfileDocumentStorageReady(tx))
   throw new PeopleServiceError("PRIVATE_IDENTITY_STORAGE_NOT_READY");
  const rows=await tx.execute<DocumentRow>(sql`
   select profile_document,profile_document_version from faculty_profiles
   where membership_id=${id} for update
  `);
  const row=rows.rows[0];
  const current=facultyProfileDocumentSchema.parse(row?.profile_document??emptyFacultyProfileDocument);
  const version=row?.profile_document_version??0;
  if(version!==patch.expectedVersion)
   throw new PeopleServiceError("FACULTY_PROFILE_VERSION_CONFLICT");
  const document=updateFacultyProfileSection(current,patch);
  const updated=await tx.execute<DocumentRow>(sql`
   insert into faculty_profiles
    (membership_id,profile_document,profile_document_version,created_at,updated_at)
   values (${id},${JSON.stringify(document)}::jsonb,1,clock_timestamp(),clock_timestamp())
   on conflict (membership_id) do update
    set profile_document=excluded.profile_document,
      profile_document_version=faculty_profiles.profile_document_version+1,
      updated_at=clock_timestamp()
   where faculty_profiles.profile_document_version=${version}
   returning profile_document,profile_document_version
  `);
  const next=updated.rows[0];
  if(!next)throw new PeopleServiceError("FACULTY_PROFILE_VERSION_CONFLICT");
  return {document:facultyProfileDocumentSchema.parse(next.profile_document),
   version:next.profile_document_version};
 });
}

/** Staff-read private Faculty evidence is a separate permission boundary from
 * self-profile editing. A known receipt UUID never authorizes its own read;
 * the current Faculty document must still reference that same receipt. */
const evidenceRead=z.strictObject({
 receiptId:z.uuid(),
 purpose:z.enum(["AADHAAR","PAN","EDUCATION_CERTIFICATE","CERTIFICATION",
   "EXPERIENCE_CERTIFICATE","OFFER_LETTER"]),
 entryId:z.uuid().optional(),
});
export async function openFacultyDocumentForAdmin(
 context:RequestContext,membershipIdRaw:unknown,inputRaw:unknown,
){
 const membershipId=targetSchema.parse(membershipIdRaw);
 const input=evidenceRead.parse(inputRaw);
 const proof=await getDb().transaction(async tx=>{
  const {target}=await requireFacultyTarget(tx,context,membershipId);
  if(!await facultyProfileDocumentStorageReady(tx))
   throw new PeopleServiceError("PRIVATE_IDENTITY_STORAGE_NOT_READY");
  const profileRows=await tx.execute<DocumentRow>(sql`
   select profile_document,profile_document_version from faculty_profiles
   where membership_id=${membershipId} for share
  `);
  const profile=profileRows.rows[0];
  const document=facultyProfileDocumentSchema.parse(profile?.profile_document??emptyFacultyProfileDocument);
  let currentId:string|null=null;
  switch(input.purpose){
   case "AADHAAR": currentId=document.identitySummary.aadhaarDocumentId;break;
   case "PAN": currentId=document.identitySummary.panDocumentId;break;
   case "EDUCATION_CERTIFICATE":
    currentId=document.education.find(row=>row.id===input.entryId)?.certificateDocumentId??null;
    break;
   case "CERTIFICATION":
    currentId=document.certifications.find(row=>row.id===input.entryId)?.certificateDocumentId??null;
    break;
   case "EXPERIENCE_CERTIFICATE":
    currentId=document.experiences.find(row=>row.id===input.entryId)?.experienceCertificateDocumentId??null;
    break;
   case "OFFER_LETTER":
    currentId=document.experiences.find(row=>row.id===input.entryId)?.offerLetterDocumentId??null;
    break;
  }
  if(currentId!==input.receiptId)throw new AuthorizationError("people.manage");
  const [receipt]=await tx.select().from(profilePrivateDocumentReceipts).where(and(
    eq(profilePrivateDocumentReceipts.id,input.receiptId),
    eq(profilePrivateDocumentReceipts.owningMembershipId,membershipId),
    eq(profilePrivateDocumentReceipts.purpose,input.purpose),
    ...(input.entryId?[eq(profilePrivateDocumentReceipts.relatedEntryId,input.entryId)]:[
      isNull(profilePrivateDocumentReceipts.relatedEntryId),
    ]),
    eq(profilePrivateDocumentReceipts.scanStatus,"CLEAN"),
    isNull(profilePrivateDocumentReceipts.revokedAt),
  )).limit(1);
  if(!receipt||receipt.retentionUntil&&receipt.retentionUntil<=new Date())
   throw new AuthorizationError("people.manage");
  await tx.insert(activityEvents).values({
   module:"IDENTITY",eventType:"identity.faculty_private_document.opened",
   collegeId:target.collegeId,organizationId:target.organizationId,
   actorUserId:context.user.id,
   actorMembershipId:context.membership&&context.membership.collegeId===target.collegeId?
    context.membership.id:null,
   subjectType:"faculty_profile",subjectId:membershipId,
   summary:"Administrator requested a signed Faculty document",
   metadata:{purpose:input.purpose,receiptId:receipt.id},
  });
  return {receipt,scope:target};
 });
 const grant=await createPrivateReadGrant({
  objectKey:proof.receipt.privateObjectKey,
  collegeId:proof.scope.collegeId,
  ownerMembershipId:membershipId,expiresInMs:5*60*1000,
 });
 return {readUrl:grant.readUrl,expiresAt:grant.expiresAt,purpose:input.purpose};
}

/** College-admin document attachments are not a raw JSON PATCH. The
 * separately authorized object upload, scan attestation and CAS binding
 * must all identify the SAME faculty membership and specific saved row.
 */
const adminReceiptPurpose=z.enum([
 "AADHAAR","PAN","EDUCATION_CERTIFICATE","CERTIFICATION",
 "EXPERIENCE_CERTIFICATE","OFFER_LETTER",
]);
type AdminReceiptPurpose=z.infer<typeof adminReceiptPurpose>;
const adminReceiptKey=z.strictObject({
 purpose:adminReceiptPurpose,entryId:z.uuid().optional(),
});
const adminBeginReceipt=adminReceiptKey.extend({
 contentType:z.enum(["application/pdf","image/jpeg","image/png","image/webp"]),
 sizeBytes:z.number().int().min(1).max(10*1024*1024),
});
const adminCompleteReceipt=adminReceiptKey.extend({
 objectKey:z.string().min(20).max(1024),
 expectedVersion:z.number().int().min(0),
});
const adminRemoveReceipt=adminReceiptKey.extend({
 expectedVersion:z.number().int().min(0),
});

function facultyReceiptField(
 document:z.infer<typeof facultyProfileDocumentSchema>,
 purpose:AdminReceiptPurpose,
 entryId:string|undefined,
):string|null{
 if(purpose==="AADHAAR"||purpose==="PAN"){
  if(entryId)throw new PeopleServiceError("FACULTY_PROFILE_DOCUMENT_INVALID");
  return purpose==="AADHAAR"?
   document.identitySummary.aadhaarDocumentId:document.identitySummary.panDocumentId;
 }
 if(!entryId)throw new PeopleServiceError("FACULTY_PROFILE_DOCUMENT_INVALID");
 switch(purpose){
  case "EDUCATION_CERTIFICATE":{
   const item=document.education.find(x=>x.id===entryId);
   if(!item)throw new PeopleServiceError("FACULTY_PROFILE_DOCUMENT_INVALID");
   return item.certificateDocumentId;
  }
  case "CERTIFICATION":{
   const item=document.certifications.find(x=>x.id===entryId);
   if(!item)throw new PeopleServiceError("FACULTY_PROFILE_DOCUMENT_INVALID");
   return item.certificateDocumentId;
  }
  case "EXPERIENCE_CERTIFICATE":
  case "OFFER_LETTER":{
   const item=document.experiences.find(x=>x.id===entryId);
   if(!item)throw new PeopleServiceError("FACULTY_PROFILE_DOCUMENT_INVALID");
   return purpose==="OFFER_LETTER"?item.offerLetterDocumentId:
    item.experienceCertificateDocumentId;
  }
 }
}

function withFacultyAdminReceipt(
 document:z.infer<typeof facultyProfileDocumentSchema>,
 purpose:AdminReceiptPurpose,entryId:string|undefined,receiptId:string|null,
){
 // The precondition also rejects an entry from another Faculty profile.
 facultyReceiptField(document,purpose,entryId);
 if(purpose==="AADHAAR"||purpose==="PAN")
  return facultyProfileDocumentSchema.parse({...document,
   identitySummary:{...document.identitySummary,
    [purpose==="AADHAAR"?"aadhaarDocumentId":"panDocumentId"]:receiptId}});
 if(purpose==="EDUCATION_CERTIFICATE")
  return facultyProfileDocumentSchema.parse({...document,
   education:document.education.map(item=>item.id===entryId?
    {...item,certificateDocumentId:receiptId}:item)});
 if(purpose==="CERTIFICATION")
  return facultyProfileDocumentSchema.parse({...document,
   certifications:document.certifications.map(item=>item.id===entryId?
    {...item,certificateDocumentId:receiptId}:item)});
 return facultyProfileDocumentSchema.parse({...document,
  experiences:document.experiences.map(item=>item.id===entryId?
   {...item,[purpose==="OFFER_LETTER"?
    "offerLetterDocumentId":"experienceCertificateDocumentId"]:receiptId}:item)});
}

/** In addition to the persisted permission, administrators cannot overwrite
 * a college administrator's own faculty document via ordinary staff tools.
 */
async function scopedAdminReceiptTarget(context:RequestContext,id:string){
 return getDb().transaction(async tx=>{
  const scope=await requireFacultyTarget(tx,context,id);
  if(!isSuperAdmin(scope.persisted)&&
     (scope.roles.includes("COLLEGE_ADMIN")||scope.roles.includes("TPO")))
   throw new AuthorizationError("people.manage");
  if(!await facultyProfileDocumentStorageReady(tx))
   throw new PeopleServiceError("PRIVATE_IDENTITY_STORAGE_NOT_READY");
  return scope.target;
 });
}

export async function issueFacultyAdminDocumentUpload(
 context:RequestContext,membershipIdRaw:unknown,raw:unknown,
){
 const membershipId=targetSchema.parse(membershipIdRaw);
 const input=adminBeginReceipt.parse(raw);
 const target=await scopedAdminReceiptTarget(context,membershipId);
 const current=await getDb().execute<DocumentRow>(sql`
  select profile_document,profile_document_version from faculty_profiles
  where membership_id=${membershipId}
 `);
 const document=facultyProfileDocumentSchema.parse(
  current.rows[0]?.profile_document??emptyFacultyProfileDocument);
 facultyReceiptField(document,input.purpose,input.entryId);
 const grant=await createPrivateUploadGrant({
  collegeId:target.collegeId,ownerMembershipId:membershipId,
  namespace:"profile-verification",contentType:input.contentType,
  expectedSizeBytes:input.sizeBytes,maxSizeBytes:10*1024*1024,
 });
 return {grant,purpose:input.purpose,entryId:input.entryId??null,
  status:"UPLOADING" as const};
}

/** Scan attestation reads the real object metadata, never client-reported
 * scan state. The incoming replacement and old receipt revocation use one
 * locked transaction, with an audit record for every successful change. */
export async function completeFacultyAdminDocumentUpload(
 context:RequestContext,membershipIdRaw:unknown,raw:unknown,
){
 const membershipId=targetSchema.parse(membershipIdRaw);
 const input=adminCompleteReceipt.parse(raw);
 const target=await scopedAdminReceiptTarget(context,membershipId);
 const object=await readPrivateObjectAttestation(input.objectKey,{
  collegeId:target.collegeId,ownerMembershipId:membershipId,
 });
 if(!["application/pdf","image/jpeg","image/png","image/webp"].includes(object.contentType)||
    object.sizeBytes>10*1024*1024)
  throw new PeopleServiceError("FACULTY_PROFILE_DOCUMENT_INVALID");
 return getDb().transaction(async tx=>{
  const scope=await requireFacultyTarget(tx,context,membershipId);
  if(!isSuperAdmin(scope.persisted)&&
     (scope.roles.includes("COLLEGE_ADMIN")||scope.roles.includes("TPO")))
   throw new AuthorizationError("people.manage");
  if(!await facultyProfileDocumentStorageReady(tx))
   throw new PeopleServiceError("PRIVATE_IDENTITY_STORAGE_NOT_READY");
  const rows=await tx.execute<DocumentRow>(sql`
   select profile_document,profile_document_version from faculty_profiles
   where membership_id=${membershipId} for update
  `);
  if((rows.rows[0]?.profile_document_version??0)!==input.expectedVersion)
   throw new PeopleServiceError("FACULTY_PROFILE_VERSION_CONFLICT");
  const previousDocument=facultyProfileDocumentSchema.parse(
   rows.rows[0]?.profile_document??emptyFacultyProfileDocument);
  const oldReceipt=facultyReceiptField(previousDocument,input.purpose,input.entryId);
  const [receipt]=await tx.insert(profilePrivateDocumentReceipts).values({
   owningMembershipId:membershipId,purpose:input.purpose,
   relatedEntryId:input.entryId??null,
   privateObjectKey:object.objectKey,objectGeneration:object.generation,
   sha256Hex:object.sha256Hex,mimeType:object.contentType,
   sizeBytes:object.sizeBytes,scanStatus:"CLEAN",
   uploadedByUserId:context.user.id,
  }).onConflictDoNothing().returning({id:profilePrivateDocumentReceipts.id});
  if(!receipt)throw new PeopleServiceError("FACULTY_PROFILE_DOCUMENT_INVALID");
  const document=withFacultyAdminReceipt(
   previousDocument,input.purpose,input.entryId,receipt.id);
  const saved=await tx.execute<DocumentRow>(sql`
   insert into faculty_profiles
    (membership_id,profile_document,profile_document_version,created_at,updated_at)
   values (${membershipId},${JSON.stringify(document)}::jsonb,1,clock_timestamp(),clock_timestamp())
   on conflict (membership_id) do update
    set profile_document=excluded.profile_document,
      profile_document_version=faculty_profiles.profile_document_version+1,
      updated_at=clock_timestamp()
   where faculty_profiles.profile_document_version=${input.expectedVersion}
   returning profile_document,profile_document_version
  `);
  const next=saved.rows[0];
  if(!next)throw new PeopleServiceError("FACULTY_PROFILE_VERSION_CONFLICT");
  if(oldReceipt)await tx.update(profilePrivateDocumentReceipts).set({
   revokedAt:new Date(),retentionUntil:new Date(Date.now()+7*86400000),
  }).where(and(eq(profilePrivateDocumentReceipts.id,oldReceipt),
   eq(profilePrivateDocumentReceipts.owningMembershipId,membershipId),
   eq(profilePrivateDocumentReceipts.purpose,input.purpose),
   input.entryId?eq(profilePrivateDocumentReceipts.relatedEntryId,input.entryId):
    isNull(profilePrivateDocumentReceipts.relatedEntryId),
   isNull(profilePrivateDocumentReceipts.revokedAt)));
  await tx.insert(activityEvents).values({
   collegeId:target.collegeId,organizationId:target.organizationId,
   actorUserId:context.user.id,
   actorMembershipId:context.membership?.collegeId===target.collegeId?
    context.membership.id:null,
   module:"IDENTITY",eventType:"people.faculty_admin_attachment.updated",
   subjectType:"faculty_profile",subjectId:membershipId,
   summary:"Administrator updated a private Faculty attachment",
   metadata:{purpose:input.purpose,entryId:input.entryId??null,
    replaced:Boolean(oldReceipt),cleanup:"RETENTION_REVIEW"},
  });
  return {saved:true,version:next.profile_document_version,
   receiptId:receipt.id,purpose:input.purpose,entryId:input.entryId??null};
 });
}

export async function revokeFacultyAdminDocumentAttachment(
 context:RequestContext,membershipIdRaw:unknown,raw:unknown,
){
 const membershipId=targetSchema.parse(membershipIdRaw);
 const input=adminRemoveReceipt.parse(raw);
 return getDb().transaction(async tx=>{
  const scope=await requireFacultyTarget(tx,context,membershipId);
  if(!isSuperAdmin(scope.persisted)&&
     (scope.roles.includes("COLLEGE_ADMIN")||scope.roles.includes("TPO")))
   throw new AuthorizationError("people.manage");
  if(!await facultyProfileDocumentStorageReady(tx))
   throw new PeopleServiceError("PRIVATE_IDENTITY_STORAGE_NOT_READY");
  const rows=await tx.execute<DocumentRow>(sql`
   select profile_document,profile_document_version from faculty_profiles
   where membership_id=${membershipId} for update
  `);
  const row=rows.rows[0];
  if(!row||row.profile_document_version!==input.expectedVersion)
   throw new PeopleServiceError("FACULTY_PROFILE_VERSION_CONFLICT");
  const current=facultyProfileDocumentSchema.parse(row.profile_document);
  const receiptId=facultyReceiptField(current,input.purpose,input.entryId);
  if(!receiptId)return {saved:false,version:row.profile_document_version};
  const next=withFacultyAdminReceipt(current,input.purpose,input.entryId,null);
  const saved=await tx.execute<DocumentRow>(sql`
   update faculty_profiles set
    profile_document=${JSON.stringify(next)}::jsonb,
    profile_document_version=profile_document_version+1,
    updated_at=clock_timestamp()
   where membership_id=${membershipId}
    and profile_document_version=${input.expectedVersion}
   returning profile_document,profile_document_version
  `);
  if(!saved.rows[0])throw new PeopleServiceError("FACULTY_PROFILE_VERSION_CONFLICT");
  await tx.update(profilePrivateDocumentReceipts).set({
   revokedAt:new Date(),retentionUntil:new Date(Date.now()+7*86400000),
  }).where(and(eq(profilePrivateDocumentReceipts.id,receiptId),
   eq(profilePrivateDocumentReceipts.owningMembershipId,membershipId),
   eq(profilePrivateDocumentReceipts.purpose,input.purpose),
   input.entryId?eq(profilePrivateDocumentReceipts.relatedEntryId,input.entryId):
    isNull(profilePrivateDocumentReceipts.relatedEntryId),
   isNull(profilePrivateDocumentReceipts.revokedAt)));
  await tx.insert(activityEvents).values({
   collegeId:scope.target.collegeId,organizationId:scope.target.organizationId,
   actorUserId:context.user.id,
   actorMembershipId:context.membership?.collegeId===scope.target.collegeId?
    context.membership.id:null,
   module:"IDENTITY",eventType:"people.faculty_admin_attachment.revoked",
   subjectType:"faculty_profile",subjectId:membershipId,
   summary:"Administrator revoked a private Faculty attachment",
   metadata:{purpose:input.purpose,entryId:input.entryId??null,cleanup:"RETENTION_REVIEW"},
  });
  return {saved:true,version:saved.rows[0].profile_document_version};
 });
}
