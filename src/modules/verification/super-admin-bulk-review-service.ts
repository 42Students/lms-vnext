import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {VerificationStateError} from "@/modules/profile-verification/domain";
import {reviewProfileVerification} from "@/modules/profile-verification/service";
import {createProfileVerificationRepository} from "@/modules/profile-verification/repository";
import {verifyPrivateDocumentReceipt} from "@/modules/profile-verification/private-receipts";
import {bulkVerificationInput} from "./bulk-review-input";
import {summarizeBulkReviews,type BulkReviewOutcome} from "./bulk-outcome";
import {requireSuperAdminVerificationCollege} from "./super-admin-scope";
import {requireVerificationTables} from "./staff-auth";

/** Every entry goes through the canonical locked verification writer and audit.
 * Cross-college requests are rejected by the persisted target scope. */
export async function reviewSuperAdminVerificationBulk(
 ctx:RequestContext,rawCollegeId:unknown,raw:unknown,
){
 const scope=await requireSuperAdminVerificationCollege(ctx,rawCollegeId);
 await requireVerificationTables();
 const input=bulkVerificationInput.parse(raw);
 const repository=createProfileVerificationRepository(verifyPrivateDocumentReceipt);
 const results:BulkReviewOutcome[]=[];
 for(const item of input.items){
  await requireSuperAdminVerificationCollege(ctx,scope.collegeId);
  try{
   const target=await repository.resolveLearner(item.learnerMembershipId);
   if(!target||target.collegeId!==scope.collegeId||target.organizationId!==scope.organizationId)
    throw new AuthorizationError("profile-verification.review");
   const saved=await reviewProfileVerification(ctx,{
    ...item,action:input.action,...(input.action==="SEND_BACK"&&input.reason!==undefined?{reason:input.reason}:{})
   },repository);
   results.push({learnerMembershipId:item.learnerMembershipId,section:item.section,
    result:saved.status==="VERIFIED"?"VERIFIED":"SENT_BACK"});
  }catch(error){
   const code=error instanceof AuthorizationError||
      error instanceof VerificationStateError&&error.code==="NOT_ALLOWED"?"NOT_AVAILABLE":
      error instanceof VerificationStateError?error.code:null;
   if(code==="NOT_AVAILABLE"||code==="STALE_VERSION"||code==="INCOMPLETE_DOCUMENTS"||
      code==="INVALID_TRANSITION"||code==="REASON_REQUIRED"){
     results.push({learnerMembershipId:item.learnerMembershipId,section:item.section,result:code});
     continue;
   }
   throw error;
  }
 }
 return {outcomes:results,summary:summarizeBulkReviews(results)};
}
