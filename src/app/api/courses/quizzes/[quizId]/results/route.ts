import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  setCourseQuizResults,
} from "@/modules/courses/quiz-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ quizId: string }>;
};

async function handlePOST(
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
    const quiz = await setCourseQuizResults(
      context,
      quizId,
      body,
    );

    return NextResponse.json({ quiz });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const POST = secured(handlePOST);

/** Legacy PATCH results maps to the same authorized results transition as POST. */
async function handlePATCH(request: Request, route: RouteContext) {
  if (!isSameOriginRequest(request)) return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  return POST(request, route);
}
export const PATCH = secured(handlePATCH, { csrf: "enforce" });
