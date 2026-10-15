import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {profilePrivateDocumentReceipts} from "@/db/schema/profile-verification";
import {createPrivateReadGrant} from "@/modules/storage/private-object-storage";
import type {RequestContext} from "@/modules/identity/context";
import {VerificationStateError,type VerificationSection} from "@/modules/profile-verification/domain";
import {getCollegeVerificationDetail} from "./staff-review-detail-service";
import {requireCollegeVerificationActor} from "./staff-auth";
import {requireSuperAdminVerificationCollege} from "./super-admin-scope";

export async function openCollegeVerificationDocument(context:RequestContext,
 membershipId:string,section:VerificationSection,receiptId:string,superAdminCollegeId?:string){
 const scope=superAdminCollegeId ? await requireSuperAdminVerificationCollege(context,superAdminCollegeId) : await requireCollegeVerificationActor(context);
 const detail=await getCollegeVerificationDetail(context,membershipId,section,superAdminCollegeId);
 if(!detail.documents.some(doc=>doc.receiptId===receiptId))
   throw new VerificationStateError("NOT_ALLOWED");
 const [receipt]=await getDb().select().from(profilePrivateDocumentReceipts)
  .where(and(eq(profilePrivateDocumentReceipts.id,receiptId),
   eq(profilePrivateDocumentReceipts.owningMembershipId,membershipId))).limit(1);
 if(!receipt||receipt.scanStatus!=="CLEAN"||receipt.revokedAt||
   (receipt.retentionUntil!==null&&receipt.retentionUntil<=new Date()))
   throw new VerificationStateError("NOT_ALLOWED");
 return createPrivateReadGrant({objectKey:receipt.privateObjectKey,
   collegeId:scope.collegeId,ownerMembershipId:membershipId});
}