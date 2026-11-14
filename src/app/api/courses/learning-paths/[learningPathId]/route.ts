import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { updateLearningPath } from "@/modules/courses/learning-path-service";

export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "courses.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { learningPathId } = params;
    const body = await boundedRequestJson(request);
    const learningPath =
      await updateLearningPath(
        context,
        learningPathId,
        body,
      );
    return NextResponse.json({ learningPath });
  },
);
