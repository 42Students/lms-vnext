import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { transitionLessonContent } from "@/modules/courses/lesson-content-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { contentId } = params;
    const body = await boundedRequestJson(request);
    const content =
      await transitionLessonContent(
        context,
        contentId,
        body,
      );
    return NextResponse.json({ content });
  },
);
