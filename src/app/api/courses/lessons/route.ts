import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { isSuperAdmin } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { getCollegeLessonSearchStats, getGlobalLessonSearchStats, searchCollegeLessons } from "@/modules/courses/college-learning-directory-service";
import {
  createCourseLesson,
  listCourseLessons,
  resolveLegacyLessonLearningPath,
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
      const rawQuery=url.searchParams.get("query")??"";
      const rawLimit=url.searchParams.get("limit")??"15";
      const courseId = url.searchParams.get("courseId") ?? undefined;
      const valid=z.strictObject({
        query:z.string().trim().max(100),
        limit:z.coerce.number().int().min(1).max(200),
        courseId:z.string().uuid().optional(),
      }).safeParse({query:rawQuery,limit:rawLimit,...(courseId?{courseId}:{})});
      if(!valid.success)return NextResponse.json({
        error:"INVALID_LESSON_SEARCH_FILTERS",
        message:"Use a query of at most 100 characters, a limit from 1 to 200, and a scoped course UUID (not a legacy numeric ID).",
      },{status:400,headers:noStore});
      if (!courseId && !isSuperAdmin(context)) {
        return NextResponse.json({
          error: "COURSE_ID_REQUIRED",
          message: "courseId is required for scoped lesson search",
        }, { status: 403, headers: noStore });
      }
      const result = await searchCollegeLessons(context, {
        query: valid.data.query,
        limit: valid.data.limit,
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
      // Legacy /stats is GLOBAL Super Admin only; a selected college or
      // organization scope never enumerates other tenants.
      const globalScope = isSuperAdmin(context) &&
        !context.adminScope?.collegeId && !context.adminScope?.organizationId;
      const stats = globalScope
        ? await getGlobalLessonSearchStats(context)
        : await getCollegeLessonSearchStats(context);
      return NextResponse.json({
        status: "success", message: "Stats retrieved", data: stats,
      }, { headers: noStore });
    }
    if (view !== null) {
      return NextResponse.json({ error: "INVALID_LESSON_VIEW" },
        { status: 400, headers: noStore });
    }
    const isLegacyFetch=url.searchParams.has("courseSlug")||
      url.searchParams.has("courseId");
    const learningPathId=isLegacyFetch
      ?await resolveLegacyLessonLearningPath(context,{
        courseSlug:url.searchParams.get("courseSlug"),
        courseId:url.searchParams.get("courseId"),
      })
      :url.searchParams.get("learningPathId");
    if(!learningPathId)
      return NextResponse.json({error:"COURSE_SCOPE_AMBIGUOUS",
        message:"Select the class, semester and course to open its lessons."},
        {status:400,headers:noStore});
    const lessons = await listCourseLessons(
      context,
      learningPathId,
      url.searchParams.get("deliveryId"),
      url.searchParams.get("includeArchived") ===
        "true",
    );

    // Keep the modern "lessons" array stable. Legacy consumers that expect
    // Response(status,message,data) may use the same authenticated scoped
    // endpoint without another unprotected /api/v1 namespace.
    return NextResponse.json({
      lessons,status:"success",message:"Lessons retrieved",data:lessons,
    }, { headers: noStore });
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
    const body:unknown=await request.json();
    if(!body||typeof body!=="object"||Array.isArray(body))
      return NextResponse.json({error:"INVALID_LESSON_REQUEST"},{
        status:400,headers:noStore,
      });
    const raw=body as Record<string,unknown>;
    // Legacy lesson_name and sequence=0 semantics are mapped, but the
    // learning path must always resolve to the caller's authorized offering.
    // Course slugs/legacy numeric IDs alone are not trusted parent IDs.
    if(!raw["learningPathId"]&&(raw["course_id"]||raw["courseId"]||raw["slug"]))
      return NextResponse.json({
        error:"LEARNING_PATH_REQUIRED",
        message:"Select an authorized course offering and its learningPathId. Legacy numeric course IDs and slugs cannot identify a tenant on their own.",
      },{status:400,headers:noStore});
    const {lesson_name:legacyLessonName,...modern}=raw;
    const mapped=(legacyLessonName!==undefined && modern["name"]===undefined)
      ?{...modern,name:legacyLessonName}:modern;
    const lesson = await createCourseLesson(context,mapped);

    return NextResponse.json(
      { lesson,status:"success",message:"Lesson created",data:lesson },
      { status: 201, headers: noStore },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
