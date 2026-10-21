import {NextResponse} from "next/server";
import {z} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {VerificationStateError} from "@/modules/profile-verification/domain";
import {createProfileVerificationRepository} from "@/modules/profile-verification/repository";
import {verifyPrivateDocumentReceipt} from "@/modules/profile-verification/private-receipts";
import {submitOwnVerification} from "@/modules/profile-verification/service";
export const runtime="nodejs";

const requestSchema=z.strictObject({
 section:z.enum(["EDUCATION","IDENTITY"]),
 expectedVersion:z.number().int().min(0).max(2147483647),
});

/** Only the authenticated active learner may submit their own stored profile snapshot.
 * The DB04 writer locks the row, checks the version and validates CLEAN private receipts.
 */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const input=requestSchema.safeParse(await request.json().catch(()=>null));
 if(!input.success)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
 try{
  const context=await getCurrentRequestContext();
  const record=await submitOwnVerification(context,input.data.section,
   input.data.expectedVersion,createProfileVerificationRepository(verifyPrivateDocumentReceipt));
  return NextResponse.json({status:record.status,version:record.version,
   message:record.status==="UPDATE_PENDING"
    ?"Changes sent for verification. Your previously verified details remain in effect until review."
    :"Sent for verification"});
 }catch(error){
  if(error instanceof AuthorizationError)return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(error instanceof VerificationStateError){
   if(error.code==="NOT_ALLOWED")return NextResponse.json({error:"NOT_FOUND"},{status:404});
   const conflict=error.code==="STALE_VERSION"||error.code==="NOTHING_CHANGED";
   const message=error.code==="NOTHING_CHANGED"
    ?"Nothing has changed since it was verified":
    error.code==="INCOMPLETE_DOCUMENTS"
    ?"Before sending: complete this section and add any required documents":
    error.code==="INVALID_TRANSITION"
    ?"This section cannot be submitted in its current state. Refresh the section and try again.":
    "Your verification could not be submitted. Refresh and check this section.";
   return NextResponse.json({error:error.code,message},{status:conflict?409:422});
  }
  throw error;
 }
}
