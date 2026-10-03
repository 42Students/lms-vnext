import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  transitionProjectMeeting,
} from "@/modules/projects/meeting-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
    meetingId: string;
  }>;
};

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
    const { projectId, meetingId } =
      await params;
    const body = await request.json();
    const meeting =
      await transitionProjectMeeting(
        context,
        projectId,
        meetingId,
        body,
      );

    return NextResponse.json({ meeting });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
