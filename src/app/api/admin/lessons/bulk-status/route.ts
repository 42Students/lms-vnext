import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {bulkSuperAdminLessonVisibility} from "@/modules/courses/super-admin-lesson-bulk-visibility";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return Response.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const body:unknown=await request.json();
  // Legacy active/enabled act on lesson rows; visibleToStudents is the
  // compatible vNext alias for enabled, not an instruction to edit content.
  const result=await bulkSuperAdminLessonVisibility(await getCurrentRequestContext(),body);
  return Response.json({...result,operation:"LESSON_STATUS_UPDATE",
   lessonStatusChanged:result.changed>0},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
