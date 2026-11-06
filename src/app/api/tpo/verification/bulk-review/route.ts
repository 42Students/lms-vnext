import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {reviewTpoVerificationBulk} from "@/modules/verification/tpo-bulk-review-service";
import { secured } from "@/security/secure-handler";

export const runtime="nodejs";
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const parsed=await readBoundedJsonRequest(request,16384);
  if(!parsed.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const result=await reviewTpoVerificationBulk(context,parsed.value);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof VerificationUnavailableError)
   return NextResponse.json({error:"VERIFICATION_UNAVAILABLE"},{status:503});
  return apiErrorResponse(error);
 }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
