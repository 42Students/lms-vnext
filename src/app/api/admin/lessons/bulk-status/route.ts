import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {bulkSuperAdminLessonVisibility} from "@/modules/courses/super-admin-lesson-bulk-visibility";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return Response.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const _p=await readBoundedJsonRequest(request,16384);
  if(!_p.ok)return Response.json({error:"INVALID_REQUEST"},{status:400});
  const body:unknown=_p.value;
  // Legacy active/enabled act on lesson rows; visibleToStudents is the
  // compatible vNext alias for enabled, not an instruction to edit content.
  const result=await bulkSuperAdminLessonVisibility(await getCurrentRequestContext(),body);
  return Response.json({...result,operation:"LESSON_STATUS_UPDATE",
   lessonStatusChanged:result.changed>0},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST);
