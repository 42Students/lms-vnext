import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  listQuizAttempts,
} from "@/modules/courses/quiz-attempt-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context =
      await getCurrentRequestContext();
    const url = new URL(request.url);
    const attempts = await listQuizAttempts(
      context,
      url.searchParams.get("quizId") ?? "",
      url.searchParams.get("deliveryId") ?? "",
    );

    return NextResponse.json({ attempts });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
