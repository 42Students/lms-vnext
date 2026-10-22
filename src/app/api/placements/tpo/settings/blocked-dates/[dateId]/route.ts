import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {deleteBlockedDate,BlockedDateError} from "@/modules/placements/tpo-blocked-date-write-service";
export const runtime="nodejs";
export async function DELETE(request:Request,{params}:{params:Promise<{dateId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {dateId}=await params;
  const body=await request.json() as unknown;
  if(!body||typeof body!=="object"||Array.isArray(body))
   return NextResponse.json({error:"INVALID_INPUT"},{status:400});
  const input=body as Record<string,unknown>;
  const result=await deleteBlockedDate(await getCurrentRequestContext(),{id:dateId,expectedVersion:input["expectedVersion"]});
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof BlockedDateError)return NextResponse.json({error:error.code},{
   status:error.code==="DATE_STALE"?409:error.code==="DATE_PENDING"?503:404});
  return apiErrorResponse(error);
 }
}
