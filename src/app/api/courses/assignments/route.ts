import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { isDatabaseUnavailableError } from "@/lib/db-outage";
import {
  createCourseAssignment,
  listCourseAssignments,
} from "@/modules/courses/assignment-service";

export const runtime = "nodejs";
/** Legacy FacultyLessonContent ASSIGNMENT dispatch crosswalk:
 * the lesson-content authoring UI selects /api/courses/assignments, not the
 * generic lesson-content writer. Assignment content remains attached through
 * lessonId and a scoped deliveryId; the assignment entity lives separately
 * from reusable lesson_content rows. Validation and ownership remain in
 * assignment-service (no generic bypass of assessment authoring).
 */
export const legacyAssignmentContentRoute="/api/courses/assignments" as const;

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    const url = new URL(request.url);
    const assignments =
      await listCourseAssignments(
        context,
        url.searchParams.get("lessonId") ??
          "",
        url.searchParams.get("deliveryId"),
        url.searchParams.get(
          "includeArchived",
        ) === "true",
      );
    return NextResponse.json({ assignments });
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
const body = await boundedRequestJson(request);
const assignment =
      await createCourseAssignment(
        context,
        body,
      );
return NextResponse.json(
      { assignment, message: "Assignment saved" },
      { status: 201 },
    );
} catch (error) {
    if (isDatabaseUnavailableError(error)) {
      // Preserve the central request ID/status/retry headers while presenting
      // the old LMS actionable offline-writer message.
      const response=apiErrorResponse(error);
      const body=await response.json() as Record<string,unknown>;
      return NextResponse.json({...body,message:"Assignment writer unavailable"},
        {status:503,headers:response.headers});
    }
    return apiErrorResponse(error);
  }
  },
);
