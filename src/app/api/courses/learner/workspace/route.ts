import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  getLearnerCourseWorkspace,
} from "@/modules/courses/learner-course-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "courses.manage" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const url = new URL(request.url);
    const workspace =
      await getLearnerCourseWorkspace(
        context,
        url.searchParams.get("deliveryId") ??
          "",
      );
    return NextResponse.json({ workspace }, {headers:{"Cache-Control":"private, no-store"}});
  },
);
