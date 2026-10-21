import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  archiveCourseLesson,
  updateCourseLesson,
} from "@/modules/courses/lesson-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ lessonId: string }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { lessonId } = await params;
    const body: unknown = await request.json();
    // Lessons remain children of an immutable learning path/offering in vNext.
    // An implicit legacy course reassignment could strand child contents,
    // submissions and learner progress. Reject a move instead of dropping it.
    if (body && typeof body === "object" &&
        ["courseId","offeringId","learningPathId"].some(key=>key in body)) {
      return NextResponse.json({
        error:"LESSON_PARENT_IMMUTABLE",
        message:"A lesson cannot be moved to a different course. Create a new lesson in the destination course.",
      },{status:409,headers:{"Cache-Control":"private, no-store"}});
    }
    const lesson = await updateCourseLesson(
      context,
      lessonId,
      body,
    );

    return NextResponse.json({ lesson });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/** Legacy API bridge: DELETE /api/v1/lesson/delete/:id used a soft-delete
 * flag on both lesson and lesson content, while restore used a separate POST.
 * This same-origin vNext endpoint intentionally ARCHIVES the parent instead.
 * archiveCourseLesson marks only its published children deletedWithLesson,
 * retains their independent statuses, files, submissions and learner history,
 * and does not hard-delete objects from storage. The authorized restore action
 * in lesson-service reverses only this parent's archival tombstone: previously
 * DRAFT or individually ARCHIVED content remains hidden, and deleted files
 * are never re-exposed just because a parent was restored.
 *
 * Legacy bookmarks are a migration concern; do not blindly forward an old
 * integer lesson ID as a UUID or bypass courses.manage via an API alias.
 * Client notifications use the same-origin route and the existing toast,
 * not the old Spring/Axios API or a third-party messaging channel.
 */
export async function DELETE(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { lessonId } = await params;
    const lesson = await archiveCourseLesson(
      context,
      lessonId,
    );

    return NextResponse.json({ lesson });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
