import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { transitionLessonContent } from "@/modules/courses/lesson-content-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ contentId: string }>;
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
    const { contentId } = await params;
    const body = await request.json();
    const content =
      await transitionLessonContent(
        context,
        contentId,
        body,
      );

    return NextResponse.json({ content });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
