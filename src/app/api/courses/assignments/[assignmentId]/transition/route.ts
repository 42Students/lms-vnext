import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  transitionCourseAssignment,
} from "@/modules/courses/assignment-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    assignmentId: string;
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
    const context =
      await getCurrentRequestContext();
    const { assignmentId } = await params;
    const body = await request.json();
    const assignment =
      await transitionCourseAssignment(
        context,
        assignmentId,
        body,
      );

    return NextResponse.json({ assignment });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
