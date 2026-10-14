import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {reassignCollegeTeaching,CollegeTeachingReassignError}
  from "@/modules/courses/college-teaching-reassign-service";
export const runtime="nodejs";
type RouteContext={params:Promise<{assignmentId:string}>};
export async function PATCH(request:Request,{params}:RouteContext) {
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try {
    const {assignmentId}=await params;
    return NextResponse.json(await reassignCollegeTeaching(
      await getCurrentRequestContext(),assignmentId,await request.json(),
    ));
  }catch(error){
    if(error instanceof CollegeTeachingReassignError)
      return NextResponse.json({error:error.code},{
        status:error.code==="ASSIGNMENT_NOT_FOUND"?404:409,
      });
    return apiErrorResponse(error);
  }
}
