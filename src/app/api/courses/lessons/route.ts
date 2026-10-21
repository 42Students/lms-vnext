import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { isSuperAdmin } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { getCollegeLessonSearchStats, searchCollegeLessons } from "@/modules/courses/college-learning-directory-service";
import {
  createCourseLesson,
  listCourseLessons,
} from "@/modules/courses/lesson-service";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "private, no-store" };

/** The legacy /api/v2/lessons/search and /stats are not mounted here.
 * The UUID-based, scoped replacements are GET ?view=search&courseId=<UUID>
 * and GET ?view=stats (selected-college Super Admin only). Numeric legacy
 * identifiers require a verified import mapping, never a guessed UUID.
 * POST ?view=refresh is intentionally retired: this is a live database read,
 * not an in-process global cache, and does NOT reuse lesson-create rights.
 */

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const view = url.searchParams.get("view");
    if (view === "search") {
      const courseId = url.searchParams.get("courseId") ?? undefined;
      if (!courseId && !isSuperAdmin(context)) {
        return NextResponse.json({
          error: "COURSE_ID_REQUIRED",
          message: "courseId is required for scoped lesson search",
        }, { status: 403, headers: noStore });
      }
      const result = await searchCollegeLessons(context, {
        query: url.searchParams.get("query") ?? "",
        limit: url.searchParams.get("limit") ?? "15",
        ...(courseId ? { courseId } : {}),
      });
      return NextResponse.json({
        status: "success",
        message: "Lessons retrieved",
        data: result.items,
        incomplete: result.incomplete,
        scanned: result.scanned,
      }, { headers: noStore });
    }
    if (view === "stats") {
      const stats = await getCollegeLessonSearchStats(context);
      return NextResponse.json({
        status: "success", message: "Stats retrieved", data: stats,
      }, { headers: noStore });
    }
    if (view !== null) {
      return NextResponse.json({ error: "INVALID_LESSON_VIEW" },
        { status: 400, headers: noStore });
    }
    const lessons = await listCourseLessons(
      context,
      url.searchParams.get("learningPathId") ?? "",
      url.searchParams.get("deliveryId"),
      url.searchParams.get("includeArchived") ===
        "true",
    );

    return NextResponse.json({ lessons }, { headers: noStore });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const view = new URL(request.url).searchParams.get("view");
    if (view !== null) {
      if (view !== "refresh")
        return NextResponse.json({ error: "INVALID_LESSON_VIEW" },
          { status: 400, headers: noStore });
      const context = await getCurrentRequestContext();
      if (!isSuperAdmin(context) || !context.adminScope?.collegeId)
        return NextResponse.json({ error: "FORBIDDEN" },
          { status: 403, headers: noStore });
      requirePermission(context, "courses.manage", {
        collegeId: context.adminScope.collegeId,
        organizationId: context.adminScope.organizationId,
      });
      return NextResponse.json({
        error: "LESSON_SEARCH_CACHE_RETIRED",
        message: "Lesson search reads live scoped data. No cache refresh is performed.",
      }, { status: 410, headers: noStore });
    }
    const context = await getCurrentRequestContext();
    const body = await request.json();
    const lesson = await createCourseLesson(
      context,
      body,
    );

    return NextResponse.json(
      { lesson },
      { status: 201, headers: noStore },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
