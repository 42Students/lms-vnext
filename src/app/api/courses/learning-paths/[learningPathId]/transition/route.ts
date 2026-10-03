import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { transitionLearningPath } from "@/modules/courses/learning-path-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    learningPathId: string;
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
    const context = await getCurrentRequestContext();
    const { learningPathId } = await params;
    const body = await request.json();
    const learningPath =
      await transitionLearningPath(
        context,
        learningPathId,
        body,
      );

    return NextResponse.json({ learningPath });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
