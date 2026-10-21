import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getMyQuizAttempts,resolveOwnQuizDeliveryId,
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
    const explicit=url.searchParams.get("deliveryId");
    // Legacy quiz history URLs carried quizId only. Resolve only a uniquely
    // authorized current delivery and fail closed for ambiguous enrollments.
    const deliveryId=explicit||await resolveOwnQuizDeliveryId(context,quizId);
    const attempts = await getMyQuizAttempts(context,quizId,deliveryId);

    return NextResponse.json({ attempts,deliveryId }, {headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
