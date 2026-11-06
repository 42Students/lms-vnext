import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,
  mentorProjectBodyFailureMessage} from "@/modules/projects/mentor-command-body";
import {autoAssignMentorNextSprint} from
  "@/modules/projects/mentor-auto-assign-service";

export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {projectId}=params;
    const result=await autoAssignMentorNextSprint(
   context,projectId,await readMentorProjectCommandBody(request));
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
