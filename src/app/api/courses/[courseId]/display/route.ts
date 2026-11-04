import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { readBoundedJsonRequest } from "@/lib/bounded-json-request";
import { updateCourseDisplayContentSchema } from "@/modules/courses/course-display-validation";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getAdminCourseDisplayContent,
  updateCourseDisplayContent,
} from "@/modules/courses/course-display-service";
import { courseDisplayRuntimeEnabled } from "@/modules/courses/course-display-readiness";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ courseId: string }>;
};

function pending() {
  return NextResponse.json(
    {
      error:
        "DB05_COURSE_DISPLAY_MIGRATIONS_PENDING",
    },
    { status: 503 },
  );
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  if (!courseDisplayRuntimeEnabled()) {
    return pending();
  }
  try {
    const context =
      await getCurrentRequestContext();
    const { courseId } = await params;
    const display =
      await getAdminCourseDisplayContent(
        context,
        courseId,
      );
    return NextResponse.json({ display });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }
  if (!courseDisplayRuntimeEnabled()) {
    return pending();
  }
  try {
    const context =
      await getCurrentRequestContext();
    const { courseId } = await params;
    // Rich course text and up to 30 takeaways can legitimately be large,
    // but an unbounded request.json() lets a caller allocate arbitrary memory.
    const body = await readBoundedJsonRequest(request, 262144);
    if (!body.ok) return NextResponse.json({ error: "INVALID_REQUEST" }, {
      status: 400, headers: { "Cache-Control": "private, no-store" },
    });
    const input = updateCourseDisplayContentSchema.parse(body.value);
    const display = await updateCourseDisplayContent(context, courseId, input);
    return NextResponse.json({ display });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
