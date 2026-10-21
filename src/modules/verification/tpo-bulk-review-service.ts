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
import {requireTpoVerificationActor} from "./tpo-staff-auth";

/** Deliberate legacy route compatibility: a single authorized POST replaces
 * the numeric /verify-many endpoint. Settings are managed separately, so this
 * mapping never exposes a client-selected college or reviewer's privileges.
 * Each item reports its own persisted result or actionable stale/denied status.
 */
export const TPO_VERIFICATION_LEGACY_ROUTE_MAP=[
 {legacy:"POST /tpo/profile-verification/verify-many",
  current:"POST /api/tpo/verification/bulk-review",
  method:"POST",authorization:"TPO active college membership + row-level review permission",
  scope:"UUID learner membership and verified section per item",
  result:"200 with outcomes[] and summary {attempted,succeeded,failed}; partial failures are per item"},
 {legacy:"GET /tpo/profile-verification/settings",
  current:"GET /api/tpo/verification/settings",
  method:"GET",authorization:"TPO active college membership",
  scope:"server-selected college",result:"current settings or an explicit authorization error"},
 {legacy:"PUT /tpo/profile-verification/settings",
  current:"PUT /api/tpo/verification/settings",
  method:"PUT",authorization:"TPO settings permission and same-origin request",
  scope:"server-selected college",result:"saved settings or validation error"},
] as const;

/** TPO grants, receipt evidence, row versions, auditing and notifications are
 * revalidated by the locked verification writer for every learner section. */
export async function reviewTpoVerificationBulk(context:RequestContext,raw:unknown){
 const input=bulkVerificationInput.parse(raw);
 await requireTpoVerificationActor(context);
 const repository=createProfileVerificationRepository(verifyPrivateDocumentReceipt);
 const outcomes:BulkReviewOutcome[]=[];
 for(const item of input.items){
  await requireTpoVerificationActor(context);
  try{
   const saved=await reviewProfileVerification(context,{
    ...item,action:input.action,
    ...(input.action==="SEND_BACK"?{reason:input.reason}:{}),
   },repository);
   outcomes.push({learnerMembershipId:item.learnerMembershipId,section:item.section,
    result:saved.status==="VERIFIED"?"VERIFIED":"SENT_BACK"});
  }catch(error){
   const code=error instanceof AuthorizationError||
    (error instanceof VerificationStateError&&error.code==="NOT_ALLOWED")
    ?"NOT_AVAILABLE":error instanceof VerificationStateError?error.code:null;
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
