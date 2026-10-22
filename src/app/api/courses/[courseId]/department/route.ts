import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {moveCourseDepartmentInputSchema} from "@/modules/courses/validation";
import {moveCourseDepartment} from "@/modules/courses/course-service";

export const runtime="nodejs";

/** A same-college department reassignment is possible only without any
 * offering history. The service locks, authorizes and audits the move. */
export async function POST(request:Request,{params}:{
  params:Promise<{courseId:string}>;
}){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    const {courseId}=await params;
    const body:unknown=await request.json();
    const input=moveCourseDepartmentInputSchema.parse(body);
    const course=await moveCourseDepartment(context,courseId,
      input.departmentId,input.expectedUpdatedAt);
    return NextResponse.json({course},{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return apiErrorResponse(error);}
}
