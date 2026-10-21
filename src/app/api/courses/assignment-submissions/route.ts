import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { courseAssignments } from "@/db/schema";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  listAssignmentSubmissions,
} from "@/modules/courses/assignment-submission-service";
import { facultyLegacySubmissionPagingSchema } from "@/modules/courses/faculty-assignment-submissions-model";

export const runtime = "nodejs";

/**
 * Legacy AssignmentController GET /api/v1/assignment/fetchSubmissions
 * supplied lessonContentId (imported numeric identifier) and optional paired
 * zero-based page/size. vNext uses an assignment UUID plus the authorized
 * delivery UUID; the immutable ID crosswalk is scoped again by the submission
 * reader. POST submissions have moved to the separately authorized
 * /api/courses/assignments/:assignmentId/submit endpoint.
 */
export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const params = url.searchParams;
    const legacyId = params.get("lessonContentId");
    const suppliedAssignmentId = params.get("assignmentId");
    const deliveryId = params.get("deliveryId") ?? "";
    if (!deliveryId || Boolean(legacyId) === Boolean(suppliedAssignmentId)) {
      return NextResponse.json({ error: "INVALID_ASSIGNMENT_SCOPE" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } });
    }
    let assignmentId = suppliedAssignmentId ?? "";
    if (legacyId !== null) {
      if (!/^[1-9][0-9]{0,9}$/.test(legacyId)) {
        return NextResponse.json({ error: "ASSIGNMENT_NOT_FOUND" },
          { status: 404, headers: { "Cache-Control": "private, no-store" } });
      }
      const [mapped] = await getDb().select({ id: courseAssignments.id })
        .from(courseAssignments)
        .where(eq(courseAssignments.legacyLessonContentId, Number(legacyId)))
        .limit(1);
      if (!mapped) {
        return NextResponse.json({ error: "ASSIGNMENT_NOT_FOUND" },
          { status: 404, headers: { "Cache-Control": "private, no-store" } });
      }
      assignmentId = mapped.id;
    }
    const pagination = facultyLegacySubmissionPagingSchema.parse({
      page: params.get("page") ?? undefined,
      size: params.get("size") ?? undefined,
    });
    // Legacy unpaged readers saw up to 50 rows; canonical UUID callers retain
    // their prior array contract unless explicit bounded paging is requested.
    const paging = pagination.page !== undefined && pagination.size !== undefined
      ? { limit: pagination.size, offset: pagination.page * pagination.size }
      : legacyId !== null ? { limit: 50, offset: 0 } : undefined;
    const submissions = await listAssignmentSubmissions(
      context, assignmentId, deliveryId, paging,
    );
    return NextResponse.json({ submissions }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
