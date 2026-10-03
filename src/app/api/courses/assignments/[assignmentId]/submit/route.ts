import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  submitCourseAssignment,
} from "@/modules/courses/assignment-submission-service";

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
    const submission =
      await submitCourseAssignment(
        context,
        assignmentId,
        body,
      );

    return NextResponse.json(
      { submission },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
