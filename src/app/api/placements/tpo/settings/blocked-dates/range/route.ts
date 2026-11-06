import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {removeBlockedRange,BlockedDateError} from "@/modules/placements/tpo-blocked-date-write-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handleDELETE(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  return NextResponse.json(await removeBlockedRange(await getCurrentRequestContext(),await request.json()),{
   headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof BlockedDateError)return NextResponse.json({error:error.code},{
   status:error.code==="DATE_STALE"?409:error.code==="DATE_PENDING"?503:422});
  return apiErrorResponse(error);
 }
}
export const DELETE = secured(handleDELETE, { csrf: "enforce" });
