import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,mentorProjectBodyFailureMessage}
 from "@/modules/projects/mentor-command-body";
import {
  listProjectMeetings,
  scheduleProjectMeeting,
} from "@/modules/projects/meeting-service";

export const runtime = "nodejs";
/** Old bulk PUT /{projectId}/meetings maps to this GET collection plus
 * individual POST create and scoped /{meetingId} PATCH/DELETE mutations.
 * Never replace an entire meeting list without per-meeting version tokens. */

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { projectId } = await params;
    const meetings = await listProjectMeetings(
      context,
      projectId,
    );

    return NextResponse.json({ meetings });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { projectId } = await params;
    const body = readMentorProjectCommandBody(request);
    const meeting = await scheduleProjectMeeting(
      context,
      projectId,
      null,
      body,
    );

    return NextResponse.json(
      { meeting, message: "Project meeting scheduled" },
      { status: 201 },
    );
  } catch (error) {
    if(error instanceof MentorProjectCommandBodyError)
      return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
        {status:error.status});
    return apiErrorResponse(error);
  }
}
