import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {reviewSuperAdminVerificationBulk} from "@/modules/verification/super-admin-bulk-review-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const _p=await readBoundedJsonRequest(request,16384);
  if(!_p.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const payload=_p.value;
  const payloadObj=payload as Record<string,unknown>;
  const collegeId=z.uuid().parse(payloadObj.collegeId);
  const {collegeId:_,...body}=payloadObj;
  const result=await reviewSuperAdminVerificationBulk(await getCurrentRequestContext(),collegeId,body);
  // Every selected learner/section has one explicit persisted result or a
  // specific retry reason. A partial batch never reports unconditional success.
  const receipts=result.outcomes.map(item=>({
   learnerMembershipId:item.learnerMembershipId,
   section:item.section,status:item.result,
   success:item.result==="VERIFIED"||item.result==="SENT_BACK",
  }));
  return NextResponse.json({...result,receipts,
   status:result.summary.failed>0?"PARTIAL":"COMPLETE",
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof VerificationUnavailableError)return NextResponse.json({error:"VERIFICATION_STORAGE_PENDING"},{status:503});
  return apiErrorResponse(error);
 }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
