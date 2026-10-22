import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {updateLegacyCourseBulkFlags} from "@/modules/courses/legacy-course-bulk-flags-service";

export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return Response.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const result=await updateLegacyCourseBulkFlags(
   await getCurrentRequestContext(),await request.json());
  return Response.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
