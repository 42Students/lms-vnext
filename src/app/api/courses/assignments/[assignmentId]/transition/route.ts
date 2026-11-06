import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  transitionCourseAssignment,
} from "@/modules/courses/assignment-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { assignmentId } = params;
    const body = await request.json();
    const assignment =
      await transitionCourseAssignment(
        context,
        assignmentId,
        body,
      );
    return NextResponse.json({ assignment });
  },
);
