import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {verificationReviewInput} from "@/modules/verification/review-input";
import {requireCollegeVerificationActor,requireVerificationTables,VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {VerificationStateError} from "@/modules/profile-verification/domain";
import {reviewProfileVerification} from "@/modules/profile-verification/service";
import {createProfileVerificationRepository} from "@/modules/profile-verification/repository";
import {verifyPrivateDocumentReceipt} from "@/modules/profile-verification/private-receipts";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
await requireCollegeVerificationActor(context);
await requireVerificationTables();
const input=verificationReviewInput.parse(await boundedRequestJson(request));
const record=await reviewProfileVerification(context,input,
   createProfileVerificationRepository(verifyPrivateDocumentReceipt));
const sectionLabel=record.section==="EDUCATION"?"Education":"Identity";
const message=input.action==="VERIFY"?sectionLabel+" verified":
   record.status==="VERIFIED"
    ?sectionLabel+" update sent back. The previous verified snapshot remains in effect."
    :sectionLabel+" sent back for changes";
return NextResponse.json({decision:{learnerMembershipId:record.learnerMembershipId,
   section:record.section,status:record.status,version:record.version},message},
   {headers:{"Cache-Control":CACHE.PRIVATE}});
} catch(error){
  if(error instanceof VerificationUnavailableError)
   return NextResponse.json({error:error.message},{status:503});
  if(error instanceof VerificationStateError){
   const status=error.code==="NOT_ALLOWED"?404:
     error.code==="REASON_REQUIRED"?400:error.code==="STALE_VERSION"?409:409;
   const message=error.code==="STALE_VERSION"
    ?"The student changed this after you opened it. Open it again to see what they sent."
    :error.code==="REASON_REQUIRED"?"Say what needs to change"
    :error.code==="INCOMPLETE_DOCUMENTS"?"Before sending: complete all required fields and documents"
    :error.code==="NOT_ALLOWED"?"This verification record is not available."
    :"Could not complete the review. Reload the student and try again.";
   return NextResponse.json({error:error.code==="NOT_ALLOWED"?"NOT_FOUND":error.code,message},
    {status,headers:{"Cache-Control":CACHE.PRIVATE}});
  }
  return apiErrorResponse(error);
 }
  },
);
