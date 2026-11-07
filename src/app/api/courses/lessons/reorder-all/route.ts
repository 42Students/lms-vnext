import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {reorderCollegeCourseLessons} from "@/modules/courses/lesson-service";

export const runtime="nodejs";
/** Drag-and-drop/table full-order equivalent to legacy PUT /lesson/reorder.
 * Input requires learningPathId, the complete orderedIds list and expected
 * [{id,sequence}]. The service locks current ACTIVE lessons, rejects stale
 * snapshots and writes one COURSES_LESSON_REORDERED activity event. */
export const POST = route(
  { auth: "user", permission: "courses.manage" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const moved=await reorderCollegeCourseLessons(context,await boundedRequestJson(request));
    return NextResponse.json({moved,mode:"FULL_ORDER" as const});
  },
);
