import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readMentorProjectCommandBody, MentorProjectCommandBodyError,
  mentorProjectBodyFailureMessage } from "@/modules/projects/mentor-command-body";
import { saveProjectSprintPlan } from "@/modules/projects/project-sprint-plan-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ projectId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const { projectId } = await params;
    const input = await readMentorProjectCommandBody(request);
    const result = await saveProjectSprintPlan(await getCurrentRequestContext(), projectId, input);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof MentorProjectCommandBodyError) {
      return NextResponse.json({
        error: error.code, message: mentorProjectBodyFailureMessage(error.status),
      }, { status: error.status });
    }
    return apiErrorResponse(error);
  }
}
