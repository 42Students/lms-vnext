import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,mentorProjectBodyFailureMessage}
 from "@/modules/projects/mentor-command-body";
import {
  scheduleProjectMeeting,
} from "@/modules/projects/meeting-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
    meetingId: string;
  }>;
};

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const { projectId, meetingId } =
      params;
const body = await readMentorProjectCommandBody(request);
const meeting = await scheduleProjectMeeting(
      context,
      projectId,
      meetingId,
      body,
    );
return NextResponse.json({ meeting });
} catch (error) {
    if(error instanceof MentorProjectCommandBodyError)
      return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
        {status:error.status});
    return apiErrorResponse(error);
  }
  },
);
