import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {profilePrivateDocumentReceipts} from "@/db/schema/profile-verification";
import {createPrivateReadGrant} from "@/modules/storage/private-object-storage";
import type {RequestContext} from "@/modules/identity/context";
import {VerificationStateError,type VerificationSection} from "@/modules/profile-verification/domain";
import {getCollegeVerificationDetail} from "./staff-review-detail-service";

export async function openCollegeVerificationDocument(context:RequestContext,
 membershipId:string,section:VerificationSection,receiptId:string){
 const detail=await getCollegeVerificationDetail(context,membershipId,section);
 if(!detail.documents.some(doc=>doc.receiptId===receiptId))
   throw new VerificationStateError("NOT_ALLOWED");
 const [receipt]=await getDb().select().from(profilePrivateDocumentReceipts)
  .where(and(eq(profilePrivateDocumentReceipts.id,receiptId),
   eq(profilePrivateDocumentReceipts.owningMembershipId,membershipId))).limit(1);
 if(!receipt||receipt.scanStatus!=="CLEAN"||receipt.revokedAt||
   receipt.retentionUntil&&receipt.retentionUntil<=new Date())
   throw new VerificationStateError("NOT_ALLOWED");
 return createPrivateReadGrant({objectKey:receipt.privateObjectKey,
  collegeId:(await import("./staff-auth")).requireCollegeVerificationActor
    ? (await (await import("./staff-auth")).requireCollegeVerificationActor(context)).collegeId : "",
  ownerMembershipId:membershipId});
}
