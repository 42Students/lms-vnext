import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {reassignSuperAdminFacultySchedules,SuperAdminFacultyScheduleReassignError}
  from "@/modules/admin-ui/super-admin-faculty-schedule-reassign-service";

export const runtime="nodejs";
export async function POST(request:Request){
  if(!isSameOriginRequest(request))return Response.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    const report=await reassignSuperAdminFacultySchedules(context,await request.json());
    return Response.json({report},{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){
    if(error instanceof SuperAdminFacultyScheduleReassignError)
      return Response.json({error:error.code},{status:409});
    return apiErrorResponse(error);
  }
}
