import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  endSectionFacultyAssignment,
} from "@/modules/academics/faculty-assignment-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ assignmentId: string }>;
};

export async function DELETE(
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
    const { assignmentId } = await params;
    const assignment =
      await endSectionFacultyAssignment(
        context,
        assignmentId,
      );

    return NextResponse.json({ assignment });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
