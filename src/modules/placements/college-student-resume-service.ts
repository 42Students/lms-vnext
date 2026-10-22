import "server-only";
import {and,eq,gt,isNull,or} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProfiles,membershipRoles,users} from "@/db/schema";
import {profilePrivateDocumentReceipts} from "@/db/schema/profile-verification";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {verifyPrivateDocumentReceipt} from "@/modules/profile-verification/private-receipts";
import {createPrivateReadGrant} from "@/modules/storage/private-object-storage";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";

/** Authorized, short-lived read of the learner's explicitly selected resume.
 * No raw storage path, unverified legacy URL or unselected older upload is used.
 */
export async function grantCollegeStudentPlacementResume(
 context:RequestContext,rawMembershipId:unknown,
){
 const membershipId=z.string().uuid().parse(rawMembershipId);
 const collegeId=await requireCollegePlacementAdmin(context);
 const db=getDb();
 const [student]=await db.select({objectPath:learnerProfiles.resumeObjectPath,
  scanStatus:learnerProfiles.resumeScanStatus})
  .from(collegeMemberships)
  .innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER")))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
  .where(and(eq(collegeMemberships.id,membershipId),
   eq(collegeMemberships.collegeId,collegeId),
   eq(collegeMemberships.status,"ACTIVE"),
   eq(users.platformStatus,"ACTIVE"))).limit(1);
 if(!student?.objectPath||student.scanStatus!=="CLEAN")
  throw new AuthorizationError("placements.manage");
 const now=new Date();
 const [receipt]=await db.select().from(profilePrivateDocumentReceipts)
  .where(and(
   eq(profilePrivateDocumentReceipts.owningMembershipId,membershipId),
   eq(profilePrivateDocumentReceipts.privateObjectKey,student.objectPath),
   eq(profilePrivateDocumentReceipts.purpose,"RESUME"),
   eq(profilePrivateDocumentReceipts.scanStatus,"CLEAN"),
   isNull(profilePrivateDocumentReceipts.revokedAt),
   or(isNull(profilePrivateDocumentReceipts.retentionUntil),
      gt(profilePrivateDocumentReceipts.retentionUntil,now))))
  .limit(1);
 if(!receipt||receipt.mimeType!=="application/pdf"||
    receipt.sizeBytes<=0||receipt.sizeBytes>10*1024*1024)
  throw new AuthorizationError("placements.manage");
 const evidence={...receipt,purpose:"RESUME" as const,scanStatus:"CLEAN" as const};
 if(!await verifyPrivateDocumentReceipt(evidence))
  throw new AuthorizationError("placements.manage");
 const grant=await createPrivateReadGrant({
  objectKey:receipt.privateObjectKey,collegeId,
  ownerMembershipId:membershipId,expiresInMs:120_000,
 });
 if(grant.generation!==receipt.objectGeneration||
    grant.sha256Hex.toLowerCase()!==receipt.sha256Hex.toLowerCase()||
    grant.contentType!=="application/pdf")
  throw new AuthorizationError("placements.manage");
 return {url:grant.readUrl,expiresAt:grant.expiresAt.toISOString()};
}
