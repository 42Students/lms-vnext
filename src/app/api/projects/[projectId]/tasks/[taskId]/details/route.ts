import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,mentorProjectBodyFailureMessage}
 from "@/modules/projects/mentor-command-body";
import { updateMentorTaskDetails } from "@/modules/projects/mentor-task-details-service";

export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string;taskId:string}>};
export async function PATCH(request:Request,{params}:RouteContext){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try {
    const context=await getCurrentRequestContext();
    const path=await params;
    const raw=await readMentorProjectCommandBody(request);
    const task=await updateMentorTaskDetails(context,path,raw);
    return NextResponse.json({task});
  } catch(error) {
    if(error instanceof MentorProjectCommandBodyError)
      return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
        {status:error.status});
    return apiErrorResponse(error);
  }
}
