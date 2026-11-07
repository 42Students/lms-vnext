import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  submitCourseQuiz,
} from "@/modules/courses/quiz-attempt-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "courses.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { quizId } = params;
    const body = await boundedRequestJson(request);
    const attempt = await submitCourseQuiz(
      context,
      quizId,
      body,
    );
    return NextResponse.json(
      { attempt, message: `Attempt ${attempt.attemptNumber} submitted successfully.`, resultsVisible: false },
      { status: 200 },
    );
  },
);
