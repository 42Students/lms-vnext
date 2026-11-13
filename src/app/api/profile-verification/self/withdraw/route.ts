import { boundedRequestJson } from "@/lib/request-body";
import {NextResponse} from "next/server";
import {z} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {VerificationStateError} from "@/modules/profile-verification/domain";
import {createProfileVerificationRepository} from "@/modules/profile-verification/repository";
import {verifyPrivateDocumentReceipt} from "@/modules/profile-verification/private-receipts";
import {withdrawOwnPendingVerification} from "@/modules/profile-verification/service";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
export const runtime="nodejs";
const withdrawSchema=z.strictObject({
 section:z.enum(["EDUCATION","IDENTITY"]),
 expectedVersion:z.number().int().min(1).max(2147483647),
});

/** Migration 0081 registers WITHDRAWN; never accept a snapshot or target learner from the caller. */
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const input=withdrawSchema.safeParse(await boundedRequestJson(request).catch(()=>null));
 if(!input.success)
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
 try {
  const context=await getCurrentRequestContext();
  const record=await withdrawOwnPendingVerification(
   context,input.data.section,input.data.expectedVersion,
   createProfileVerificationRepository(verifyPrivateDocumentReceipt),
  );
  return NextResponse.json({status:record.status,version:record.version},
   {headers:{"Cache-Control":CACHE.PRIVATE}});
 }catch(error){
  if(error instanceof AuthorizationError)
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(error instanceof VerificationStateError){
   if(error.code==="NOT_ALLOWED")return NextResponse.json({error:"NOT_FOUND"},{status:404});
   return NextResponse.json({error:error.code},{
    status:error.code==="STALE_VERSION"?409:422,
    headers:{"Cache-Control":CACHE.PRIVATE},
   });
  }
  throw error;
 }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
