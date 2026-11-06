import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readMentorProjectCommandBody, MentorProjectCommandBodyError,
  mentorProjectBodyFailureMessage } from "@/modules/projects/mentor-command-body";
import { changeProjectSoftDeleteState } from "@/modules/projects/project-soft-delete-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ projectId: string }> };
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const { projectId } = params;
const body = await readMentorProjectCommandBody(request);
return NextResponse.json(await changeProjectSoftDeleteState(
      __ctx, projectId, body, true,
    ));
} catch (error) {
    if (error instanceof MentorProjectCommandBodyError)
      return NextResponse.json({
        error: error.code, message: mentorProjectBodyFailureMessage(error.status),
      }, { status: error.status });
    return apiErrorResponse(error);
  }
  },
);
