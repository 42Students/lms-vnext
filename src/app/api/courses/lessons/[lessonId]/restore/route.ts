import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {restoreCourseLesson} from "@/modules/courses/lesson-service";

export const runtime = "nodejs";
type RouteContext = {params:Promise<{lessonId:string}>};

/** COL-course-tabs-15: a deliberate POST, never a GET side effect. */
export async function POST(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const {lessonId}=await params;
  const lesson=await restoreCourseLesson(context,lessonId);
  return NextResponse.json({lesson});
 }catch(error){return apiErrorResponse(error);}
}
