import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,mentorProjectBodyFailureMessage}
 from "@/modules/projects/mentor-command-body";
import { createMentorProjectSprint } from "@/modules/projects/mentor-sprint-write-service";

export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string}>};
export async function POST(request:Request,{params}:RouteContext) {
  if(!isSameOriginRequest(request)) {
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  }
  try {
    const context=await getCurrentRequestContext();
    const path=await params;
    const body=await readMentorProjectCommandBody(request);
    const sprint=await createMentorProjectSprint(context,path,body);
    return NextResponse.json({sprint},{status:201});
  } catch(error) {
    if(error instanceof MentorProjectCommandBodyError)
      return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
        {status:error.status});
    return apiErrorResponse(error);
  }
}
