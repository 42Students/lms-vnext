import "server-only";
import {and,eq,isNotNull,lte} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,colleges,facultyProfiles,membershipRoles} from "@/db/schema";
import {profilePrivateDocumentReceipts} from "@/db/schema/profile-verification";
import type {RequestContext} from "@/modules/identity/context";
import {isSuperAdmin} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {facultyProfileDocumentSchema} from "./faculty-profile-document";
import {validatePrivateReadRequest} from "@/modules/storage/private-object-storage";
import {deleteObject} from "@/modules/storage/s3-client";
import {getPrivateR2Config} from "@/modules/storage/r2-config";

/** Only privileged operators may physically erase an already revoked
 * Faculty identity object AFTER retention expires. Never accept an object
 * key, college ID or file URL from the browser. Receipt metadata remains
 * immutable for historical audit, and replaying the same purge is safe. */
const requestSchema=z.strictObject({receiptId:z.uuid(),confirmed:z.literal(true)});
export async function purgeExpiredFacultyIdentityEvidence(
 context:RequestContext,raw:unknown,now=new Date(),
){
 if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE")
  throw new AuthorizationError("college.manage");
 const input=requestSchema.parse(raw);
 const authorized=await getDb().transaction(async tx=>{
  const [candidate]=await tx.select({
   receipt:profilePrivateDocumentReceipts,
   collegeId:collegeMemberships.collegeId,
   membershipId:collegeMemberships.id,
   organizationId:colleges.organizationId,
   document:facultyProfiles.profileDocument,
  }).from(profilePrivateDocumentReceipts)
   .innerJoin(collegeMemberships,eq(
    collegeMemberships.id,profilePrivateDocumentReceipts.owningMembershipId))
   .innerJoin(colleges,eq(colleges.id,collegeMemberships.collegeId))
   .innerJoin(facultyProfiles,eq(
    facultyProfiles.membershipId,collegeMemberships.id))
   .innerJoin(membershipRoles,and(
    eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"FACULTY")))
   .where(and(eq(profilePrivateDocumentReceipts.id,input.receiptId),
    isNotNull(profilePrivateDocumentReceipts.revokedAt),
    isNotNull(profilePrivateDocumentReceipts.retentionUntil),
    lte(profilePrivateDocumentReceipts.retentionUntil,now)))
   .for("update",{of:profilePrivateDocumentReceipts}).limit(1);
  if(!candidate||!["AADHAAR","PAN","EDUCATION_CERTIFICATE","CERTIFICATION",
    "EXPERIENCE_CERTIFICATE","OFFER_LETTER"].includes(candidate.receipt.purpose))
   throw new Error("FACULTY_IDENTITY_RETENTION_NOT_DUE");
  requirePermission(context,"college.manage",{
   collegeId:candidate.collegeId,organizationId:candidate.organizationId,
  });
  await assertPersistedPlatformPermission(tx,context,"college.manage",{
   collegeId:candidate.collegeId,organizationId:candidate.organizationId,
  });
  const current=facultyProfileDocumentSchema.parse(candidate.document);
  const activeRefs=[
   current.identitySummary.aadhaarDocumentId,current.identitySummary.panDocumentId,
   ...current.education.map(row=>row.certificateDocumentId),
   ...current.certifications.map(row=>row.certificateDocumentId),
   ...current.experiences.flatMap(row=>[
     row.experienceCertificateDocumentId,row.offerLetterDocumentId,
   ]),
  ];
  if(activeRefs.includes(candidate.receipt.id))
   throw new Error("FACULTY_PRIVATE_RECEIPT_STILL_REFERENCED");
  validatePrivateReadRequest({
   objectKey:candidate.receipt.privateObjectKey,
   collegeId:candidate.collegeId,
   ownerMembershipId:candidate.membershipId,
  });
  return {objectKey:candidate.receipt.privateObjectKey,
   receiptId:candidate.receipt.id,collegeId:candidate.collegeId,
   organizationId:candidate.organizationId};
 });
 // R2 deletion is not inside PostgreSQL's transaction. On a provider outage
 // no success event is written; an operator can safely retry the SAME receipt.
 await deleteObject(getPrivateR2Config(),authorized.objectKey);
 await getDb().insert(activityEvents).values({
  organizationId:authorized.organizationId,collegeId:authorized.collegeId,
  actorUserId:context.user.id,module:"IDENTITY",
  eventType:"identity.faculty_private_evidence.purged",
  subjectType:"profile_private_document_receipt",subjectId:authorized.receiptId,
  summary:"Expired revoked Faculty identity object physically removed",
  metadata:{retentionVerified:true,purgeReceiptId:authorized.receiptId},
  dedupeKey:"faculty-identity-evidence-purge:"+authorized.receiptId,
 }).onConflictDoNothing();
 return {purged:true,receiptId:authorized.receiptId};
}
