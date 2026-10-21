import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { updateLessonContent } from "@/modules/courses/lesson-content-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ contentId: string }>;
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
    const { contentId } = await params;
    const body = await request.json();
    const content = await updateLessonContent(
      context,
      contentId,
      body,
    );

    return NextResponse.json({ content, status: "OK", reason: "OK" });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/** Legacy clients used PUT; share the same permission-checked update path. */
export const PUT = PATCH;
