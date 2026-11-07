import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { transitionMentorProjectSprint } from "@/modules/projects/mentor-sprint-write-service";

import {readMentorProjectCommandBody,MentorProjectCommandBodyError,mentorProjectBodyFailureMessage}
  from "@/modules/projects/mentor-command-body";
export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string;sprintId:string}>};
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const path=params;
const body=await readMentorProjectCommandBody(request);
const sprint=await transitionMentorProjectSprint(context,path,body);
return NextResponse.json({sprint});
} catch(error) {
    if(error instanceof MentorProjectCommandBodyError)
    return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
      {status:error.status});
  return apiErrorResponse(error);
  }
  },
);
