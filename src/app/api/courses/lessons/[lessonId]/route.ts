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
    const body = await request.json();
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
