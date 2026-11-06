import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { updateLearningPath } from "@/modules/courses/learning-path-service";

export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { learningPathId } = params;
    const body = await request.json();
    const learningPath =
      await updateLearningPath(
        context,
        learningPathId,
        body,
      );
    return NextResponse.json({ learningPath });
  },
);
