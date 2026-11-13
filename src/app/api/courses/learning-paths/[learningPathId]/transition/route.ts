import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { transitionLearningPath } from "@/modules/courses/learning-path-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { learningPathId } = params;
    const body = await boundedRequestJson(request);
    const learningPath =
      await transitionLearningPath(
        context,
        learningPathId,
        body,
      );
    return NextResponse.json({ learningPath });
  },
);
