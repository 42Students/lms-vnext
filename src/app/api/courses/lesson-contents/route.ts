import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createLessonContent,
  listLessonContents,
} from "@/modules/courses/lesson-content-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const contents = await listLessonContents(
      context,
      url.searchParams.get("lessonId") ?? "",
      url.searchParams.get("deliveryId"),
      url.searchParams.get("includeArchived") ===
        "true",
    );

    return NextResponse.json({ contents });
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
    const content = await createLessonContent(
      context,
      body,
    );

    return NextResponse.json(
      { content },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
