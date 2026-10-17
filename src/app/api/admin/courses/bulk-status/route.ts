import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {bulkSuperAdminCourseVisibility} from "@/modules/courses/super-admin-course-bulk-visibility";

export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return Response.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const result=await bulkSuperAdminCourseVisibility(await getCurrentRequestContext(),await request.json());
  return Response.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
