import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {verificationReviewInput} from "@/modules/verification/review-input";
import {requireVerificationTables,VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {requireTpoVerificationActor} from "@/modules/verification/tpo-staff-auth";
import {VerificationStateError} from "@/modules/profile-verification/domain";
import {reviewProfileVerification} from "@/modules/profile-verification/service";
import {createProfileVerificationRepository} from "@/modules/profile-verification/repository";
import {verifyPrivateDocumentReceipt} from "@/modules/profile-verification/private-receipts";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  await requireTpoVerificationActor(context);
  await requireVerificationTables();
  const input=verificationReviewInput.parse(await request.json());
  const record=await reviewProfileVerification(context,input,
   createProfileVerificationRepository(verifyPrivateDocumentReceipt));
  // The locked writer persists an immutable activity event AND an in-app notification
  // in the decision transaction. TODO(messaging): queue email/SMS intent via the
  // shared src/modules/messaging delivery interface once its outbox lands on main.
  const sectionLabel=record.section==="EDUCATION"?"Education":"Identity";
  const message=input.action==="VERIFY"?sectionLabel+" verified":
   record.status==="VERIFIED"
    ?sectionLabel+" update sent back. The previous verified snapshot remains in effect."
    :sectionLabel+" sent back for changes";
  return NextResponse.json({decision:{learnerMembershipId:record.learnerMembershipId,
   section:record.section,status:record.status,version:record.version},message},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof VerificationUnavailableError)
   return NextResponse.json({error:error.message},{status:503});
  if(error instanceof VerificationStateError){
   const status=error.code==="NOT_ALLOWED"?404:
     error.code==="REASON_REQUIRED"?400:error.code==="STALE_VERSION"?409:409;
   return NextResponse.json({error:error.code==="NOT_ALLOWED"?"NOT_FOUND":error.code},{status});
  }
  return apiErrorResponse(error);
 }
}
