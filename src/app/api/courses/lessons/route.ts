import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createCourseLesson,
  listCourseLessons,
} from "@/modules/courses/lesson-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const lessons = await listCourseLessons(
      context,
      url.searchParams.get("learningPathId") ?? "",
      url.searchParams.get("deliveryId"),
      url.searchParams.get("includeArchived") ===
        "true",
    );

    return NextResponse.json({ lessons });
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
    const context = await getCurrentRequestContext();
    const body = await request.json();
    const lesson = await createCourseLesson(
      context,
      body,
    );

    return NextResponse.json(
      { lesson },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
