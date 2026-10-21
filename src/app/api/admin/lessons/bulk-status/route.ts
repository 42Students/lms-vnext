import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {bulkSuperAdminLessonVisibility} from "@/modules/courses/super-admin-lesson-bulk-visibility";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return Response.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const body:unknown=await request.json();
  // Legacy flags active/enabled changed LESSON rows. This endpoint currently
  // changes only published content items, and must not silently accept either.
  if(body&&typeof body==="object"&&!Array.isArray(body)&&
     ("active" in body||"enabled" in body))
   return Response.json({error:"LESSON_STATUS_UNSUPPORTED",
    message:"Bulk lesson status is not supported here. Use published content visibility instead."},
    {status:422,headers:{"Cache-Control":"private, no-store"}});
  const result=await bulkSuperAdminLessonVisibility(await getCurrentRequestContext(),body);
  return Response.json({...result,operation:"PUBLISHED_CONTENT_VISIBILITY",
   lessonStatusChanged:false,
   message:"Published lesson content visibility updated; lesson active status is unchanged."},
   {headers:{"Cache-Control":"private, no-store"}});
 }
 catch(error){return apiErrorResponse(error);}
}
