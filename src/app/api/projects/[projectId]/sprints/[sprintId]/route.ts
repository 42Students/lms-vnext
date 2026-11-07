import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,mentorProjectBodyFailureMessage}
 from "@/modules/projects/mentor-command-body";
import { updateMentorSprintDetails } from "@/modules/projects/mentor-sprint-details-service";
import {deleteMentorProjectSprint} from "@/modules/projects/mentor-sprint-delete-service";

export const runtime = "nodejs";
type RouteContext={params:Promise<{projectId:string;sprintId:string}>};

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const path=params;
const body=await readMentorProjectCommandBody(request);
const sprint=await updateMentorSprintDetails(context,path,body);
return NextResponse.json({sprint});
} catch(error) {
    if(error instanceof MentorProjectCommandBodyError)
      return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
        {status:error.status});
    return apiErrorResponse(error);
  }
  },
);

export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const result=await deleteMentorProjectSprint(__ctx,
      params,await readMentorProjectCommandBody(request));
return NextResponse.json(result);
} catch(error) {
    if(error instanceof MentorProjectCommandBodyError)
      return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
        {status:error.status});
    return apiErrorResponse(error);
  }
  },
);
