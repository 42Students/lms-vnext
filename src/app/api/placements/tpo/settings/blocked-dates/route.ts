import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {createBlockedDate,BlockedDateError} from "@/modules/placements/tpo-blocked-date-write-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const result=await createBlockedDate(await getCurrentRequestContext(),await request.json());
  return NextResponse.json(result,{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof BlockedDateError)return NextResponse.json({error:error.code},{
   status:error.code==="DATE_EXISTS"?409:error.code==="DATE_PENDING"?503:error.code==="DATE_IN_PAST"||error.code==="DATE_RANGE_INVALID"?422:404});
  return apiErrorResponse(error);
 }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
