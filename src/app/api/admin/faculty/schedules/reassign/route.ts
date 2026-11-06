import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {reassignSuperAdminFacultySchedules,SuperAdminFacultyScheduleReassignError}
  from "@/modules/admin-ui/super-admin-faculty-schedule-reassign-service";
import { secured } from "@/security/secure-handler";

export const runtime="nodejs";
async function handlePOST(request:Request){
  if(!isSameOriginRequest(request))return Response.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const parsed=await readBoundedJsonRequest(request,8192);
    if(!parsed.ok)return Response.json({error:"INVALID_REQUEST"},{status:400});
    const context=await getCurrentRequestContext();
    const report=await reassignSuperAdminFacultySchedules(context,parsed.value);
    return Response.json({report},{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){
    if(error instanceof SuperAdminFacultyScheduleReassignError)
      return Response.json({error:error.code},{status:409});
    return apiErrorResponse(error);
  }
}
export const POST = secured(handlePOST);
