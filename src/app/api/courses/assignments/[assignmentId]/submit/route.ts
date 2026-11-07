import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  submitCourseAssignment,
} from "@/modules/courses/assignment-submission-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "courses.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { assignmentId } = params;
    const body = await boundedRequestJson(request);
    const submission =
      await submitCourseAssignment(
        context,
        assignmentId,
        body,
      );
    return NextResponse.json(
      { submission },
      { status: 201 },
    );
  },
);
