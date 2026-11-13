import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {commandFacultyQuizResults} from "@/modules/courses/faculty-quiz-results-command-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {quizId}=params;
    const quiz=await commandFacultyQuizResults(__ctx,
   quizId,await boundedRequestJson(request));
    return NextResponse.json({quiz});
  },
);
