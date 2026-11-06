import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {VerificationStateError} from "@/modules/profile-verification/domain";
import {reviewProfileVerification} from "@/modules/profile-verification/service";
import {createProfileVerificationRepository} from "@/modules/profile-verification/repository";
import {verifyPrivateDocumentReceipt} from "@/modules/profile-verification/private-receipts";
import {verificationReviewInput} from "@/modules/verification/review-input";
import {requireSuperAdminVerificationCollege} from "@/modules/verification/super-admin-scope";
import {requireVerificationTables,VerificationUnavailableError} from "@/modules/verification/staff-auth";
import { secured } from "@/security/secure-handler";

export const runtime="nodejs";
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const _p=await readBoundedJsonRequest(request,8192);
  if(!_p.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const body=_p.value;
  const candidate=z.object({collegeId:z.uuid()}).parse(body);
  const context=await getCurrentRequestContext();
  await requireSuperAdminVerificationCollege(context,candidate.collegeId);
  await requireVerificationTables();
  const reviewBody={...z.record(z.string(),z.unknown()).parse(body)};
  delete reviewBody.collegeId;
  const input=verificationReviewInput.parse(reviewBody);
  const record=await reviewProfileVerification(context,input,
   createProfileVerificationRepository(verifyPrivateDocumentReceipt));
  return NextResponse.json({decision:{
   learnerMembershipId:record.learnerMembershipId,section:record.section,
   status:record.status,version:record.version,
  }},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof VerificationUnavailableError)
   return NextResponse.json({error:error.message},{status:503});
  if(error instanceof VerificationStateError){
   const status=error.code==="NOT_ALLOWED"?404:error.code==="REASON_REQUIRED"?400:409;
   return NextResponse.json({error:error.code==="NOT_ALLOWED"?"NOT_FOUND":error.code},{status});
  }
  return apiErrorResponse(error);
 }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
