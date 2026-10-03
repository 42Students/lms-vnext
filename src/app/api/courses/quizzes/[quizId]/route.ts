import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getCourseQuiz,
  updateCourseQuiz,
} from "@/modules/courses/quiz-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ quizId: string }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const context =
      await getCurrentRequestContext();
    const { quizId } = await params;
    const url = new URL(request.url);
    const quiz = await getCourseQuiz(
      context,
      quizId,
      url.searchParams.get("deliveryId"),
    );

    return NextResponse.json({ quiz });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

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
    const context =
      await getCurrentRequestContext();
    const { quizId } = await params;
    const body = await request.json();
    const quiz = await updateCourseQuiz(
      context,
      quizId,
      body,
    );

    return NextResponse.json({ quiz });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
