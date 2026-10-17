import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {setTpoJobTypeCountsAsPlaced,TpoConfigError} from "@/modules/placements/tpo-job-type-write-service";
export const runtime="nodejs";
export async function PATCH(request:Request,{params}:{params:Promise<{jobTypeId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {jobTypeId}=await params;
  const body=await request.json() as {countsAsPlaced?:unknown;expectedVersion?:unknown};
  return NextResponse.json(await setTpoJobTypeCountsAsPlaced(await getCurrentRequestContext(),{
   jobTypeId,countsAsPlaced:body?.countsAsPlaced,expectedVersion:body?.expectedVersion,
  }),{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TpoConfigError)return NextResponse.json({error:error.code},{
   status:error.code==="TPO_SETTINGS_STALE"||error.code==="TPO_JOB_TYPE_BUILTIN"?409:error.code==="TPO_SETTINGS_PENDING"?503:404});
  return apiErrorResponse(error);}
}
