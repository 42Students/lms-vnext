import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { moveCollegeCourseLesson } from "@/modules/courses/lesson-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const moved = await moveCollegeCourseLesson(context, await boundedRequestJson(request));
    return NextResponse.json({ moved });
  },
);
