import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
 bulkCollegeLessonStudentVisibility,
 updateCollegeLessonStudentVisibility,
} from "@/modules/courses/college-lesson-visibility-service";

export const runtime="nodejs";

export async function PATCH(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  return NextResponse.json(await updateCollegeLessonStudentVisibility(context,await request.json()));
 }catch(error){return apiErrorResponse(error);}
}

export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  return NextResponse.json(await bulkCollegeLessonStudentVisibility(context,await request.json()));
 }catch(error){return apiErrorResponse(error);}
}
