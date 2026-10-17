import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {mutateIndependentAuditFinding} from "@/modules/bug-tracker/independent-audit-findings-service";
export const runtime="nodejs";
type Params={params:Promise<{publicId:string}>};
export async function PATCH(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {publicId}=await params;
  const result=await mutateIndependentAuditFinding(await getCurrentRequestContext(),publicId,await request.json());
  if(!result.ok)return NextResponse.json({error:"CONFLICT",message:"The finding changed or cannot be updated. Refresh and retry."},
   {status:result.reason==="NOT_FOUND"?404:result.reason==="NOT_READY"?503:409});
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
