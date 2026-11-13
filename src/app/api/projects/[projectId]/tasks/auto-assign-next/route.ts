import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,
  mentorProjectBodyFailureMessage} from "@/modules/projects/mentor-command-body";
import {autoAssignMentorNextSprint} from
  "@/modules/projects/mentor-auto-assign-service";

import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const {projectId}=params;
const result=await autoAssignMentorNextSprint(
   context,projectId,await readMentorProjectCommandBody(request));
return privateJson(result);
} catch(error){
  if(error instanceof MentorProjectCommandBodyError)
   return NextResponse.json({error:error.code,
     message:mentorProjectBodyFailureMessage(error.status)},
     {status:error.status});
  return apiErrorResponse(error);
 }
  },
);
