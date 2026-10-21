import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {restoreCourse} from "@/modules/courses/course-service";

export const runtime="nodejs";
/** Legacy POST /api/v1/course/restore/{id} maps to an authenticated,
 * department-owned UUID. The service locks the archived record, verifies
 * the active college and department, and rejects name/code collisions. */
export async function POST(request:Request,{params}:{params:Promise<{courseId:string}>}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const {courseId}=await params;
  const course=await restoreCourse(context,courseId);
  return NextResponse.json({course,status:"RESTORED"},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
