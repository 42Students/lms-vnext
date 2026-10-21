import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {mutateIndependentAuditFinding} from "@/modules/bug-tracker/independent-audit-findings-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Params={params:Promise<{publicId:string}>};
export async function PATCH(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {publicId}=await params;
  const result=await mutateIndependentAuditFinding(await getCurrentRequestContext(),publicId,await request.json());
  if(!result.ok)return NextResponse.json({
   error:result.reason,
   message:result.reason==="INVALID_STATUS_TRANSITION"?"This status change is not allowed. Check the finding history and choose a valid next step.":
    result.reason==="SEVERITY_UNCHANGED"?"It is already this severity":
    result.reason==="ASSIGNEE_UNCHANGED"?"The assignee has not changed":
    result.reason==="INVALID_DUPLICATE"?"Choose the finding this repeats":
    "The finding changed or cannot be updated. Refresh and retry.",
  },{status:result.reason==="NOT_FOUND"?404:result.reason==="NOT_READY"?503:
    result.reason==="INVALID_STATUS_TRANSITION"?422:409,headers:{"Cache-Control":"private, no-store"}});
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
