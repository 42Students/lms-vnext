import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {setTpoJobTypeActive,TpoConfigError} from "@/modules/placements/tpo-job-type-write-service";
export const runtime="nodejs";
export async function PATCH(request:Request,{params}:{params:Promise<{jobTypeId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {jobTypeId}=await params,body=await request.json() as unknown;
  if(!body||typeof body!=="object"||Array.isArray(body))
   return NextResponse.json({error:"INVALID_INPUT"},{status:400});
  const fields=body as Record<string,unknown>;
  const result=await setTpoJobTypeActive(await getCurrentRequestContext(),{
   jobTypeId,active:fields.active,expectedVersion:fields.expectedVersion,
  });
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TpoConfigError)return NextResponse.json({error:error.code},{
   status:error.code==="TPO_SETTINGS_STALE"||error.code==="TPO_JOB_TYPE_LAST_ACTIVE"?409:error.code==="TPO_SETTINGS_PENDING"?503:404});
  return apiErrorResponse(error);
 }
}
