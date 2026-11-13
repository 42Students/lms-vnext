import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  createCourseTeachingAssignment,
  listCourseTeachingAssignments,
} from "@/modules/courses/teaching-assignment-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const url = new URL(request.url);
    const assignments =
      await listCourseTeachingAssignments(
        context,
        url.searchParams.get("deliveryId") ?? "",
        url.searchParams.get("includeEnded") ===
          "true",
      );
    return NextResponse.json({ assignments });
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const body = await boundedRequestJson(request);
    const assignment =
      await createCourseTeachingAssignment(
        context,
        body,
      );
    return NextResponse.json(
      { assignment },
      { status: 201 },
    );
  },
);
