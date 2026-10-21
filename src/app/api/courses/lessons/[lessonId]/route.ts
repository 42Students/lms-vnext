import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  archiveCourseLesson,
  updateCourseLesson,
} from "@/modules/courses/lesson-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ lessonId: string }>;
};

export async function PATCH(
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
    const { lessonId } = await params;
    const body: unknown = await request.json();
    // Lessons remain children of an immutable learning path/offering in vNext.
    // An implicit legacy course reassignment could strand child contents,
    // submissions and learner progress. Reject a move instead of dropping it.
    if (body && typeof body === "object" &&
        ["courseId","offeringId","learningPathId"].some(key=>key in body)) {
      return NextResponse.json({
        error:"LESSON_PARENT_IMMUTABLE",
        message:"A lesson cannot be moved to a different course. Create a new lesson in the destination course.",
      },{status:409,headers:{"Cache-Control":"private, no-store"}});
    }
    const lesson = await updateCourseLesson(
      context,
      lessonId,
      body,
    );

    return NextResponse.json({ lesson });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

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
    const { lessonId } = await params;
    const lesson = await archiveCourseLesson(
      context,
      lessonId,
    );

    return NextResponse.json({ lesson });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
