import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getMyQuizAttempts,
} from "@/modules/courses/quiz-attempt-service";

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
    const attempts = await getMyQuizAttempts(
      context,
      quizId,
      url.searchParams.get("deliveryId") ?? "",
    );

    return NextResponse.json({ attempts });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
