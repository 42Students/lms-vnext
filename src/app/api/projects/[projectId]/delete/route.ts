import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readMentorProjectCommandBody, MentorProjectCommandBodyError,
  mentorProjectBodyFailureMessage } from "@/modules/projects/mentor-command-body";
import { changeProjectSoftDeleteState } from "@/modules/projects/project-soft-delete-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ projectId: string }> };
export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const { projectId } = await params;
    const body = await readMentorProjectCommandBody(request);
    return NextResponse.json(await changeProjectSoftDeleteState(
      await getCurrentRequestContext(), projectId, body, false,
    ));
  } catch (error) {
    if (error instanceof MentorProjectCommandBodyError)
      return NextResponse.json({
        error: error.code, message: mentorProjectBodyFailureMessage(error.status),
      }, { status: error.status });
    return apiErrorResponse(error);
  }
}
