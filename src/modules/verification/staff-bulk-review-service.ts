import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {VerificationStateError} from "@/modules/profile-verification/domain";
import {reviewProfileVerification} from "@/modules/profile-verification/service";
import {createProfileVerificationRepository} from "@/modules/profile-verification/repository";
import {verifyPrivateDocumentReceipt} from "@/modules/profile-verification/private-receipts";
import {bulkVerificationInput} from "./bulk-review-input";
import type {BulkReviewOutcome} from "./bulk-outcome";
import {summarizeBulkReviews} from "./bulk-outcome";
import {requireCollegeVerificationActor,requireVerificationTables} from "./staff-auth";

/** Each candidate passes the EXISTING locked DB04 writer, which commits audit and
 * recipient notification atomically with the decision. One bad candidate cannot
 * roll back previous successful candidates or hide failures. */
export async function reviewCollegeVerificationBulk(context:RequestContext,raw:unknown){
 const input=bulkVerificationInput.parse(raw);
 await requireCollegeVerificationActor(context);
 await requireVerificationTables();
 const repository=createProfileVerificationRepository(verifyPrivateDocumentReceipt);
 const outcomes:BulkReviewOutcome[]=[];
 for(const item of input.items){
  // A grant revoked mid-batch stops additional writes.
  await requireCollegeVerificationActor(context);
  try{
   const saved=await reviewProfileVerification(context,{
    ...item,action:input.action,...(input.action==="SEND_BACK"&&input.reason!==undefined?{reason:input.reason}:{})
   },repository);
   outcomes.push({learnerMembershipId:item.learnerMembershipId,section:item.section,
    result:saved.status==="VERIFIED"?"VERIFIED":"SENT_BACK"});
  }catch(error){
   const code=error instanceof AuthorizationError||error instanceof VerificationStateError&&error.code==="NOT_ALLOWED"
    ?"NOT_AVAILABLE"
    :error instanceof VerificationStateError?error.code:null;
   if(code==="NOT_AVAILABLE"||code==="STALE_VERSION"||code==="INCOMPLETE_DOCUMENTS"||
    code==="INVALID_TRANSITION"||code==="REASON_REQUIRED"){
    outcomes.push({learnerMembershipId:item.learnerMembershipId,section:item.section,result:code});
    continue;
   }
   throw error;
  }
 }
 return {outcomes,summary:summarizeBulkReviews(outcomes)};
}
