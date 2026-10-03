import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createCourseAssignment,
  listCourseAssignments,
} from "@/modules/courses/assignment-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context =
      await getCurrentRequestContext();
    const url = new URL(request.url);
    const assignments =
      await listCourseAssignments(
        context,
        url.searchParams.get("lessonId") ??
          "",
        url.searchParams.get("deliveryId"),
        url.searchParams.get(
          "includeArchived",
        ) === "true",
      );

    return NextResponse.json({ assignments });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const body = await request.json();
    const assignment =
      await createCourseAssignment(
        context,
        body,
      );

    return NextResponse.json(
      { assignment },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
