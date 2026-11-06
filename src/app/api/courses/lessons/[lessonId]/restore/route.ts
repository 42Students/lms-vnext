import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {restoreCourseLesson} from "@/modules/courses/lesson-service";

export const runtime = "nodejs";

/** COL-course-tabs-15: a deliberate POST, never a GET side effect. */
export const POST = route(
  { auth: "user", permission: "courses.manage" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const {lessonId}=params;
    const lesson=await restoreCourseLesson(context,lessonId);
    return NextResponse.json({lesson});
  },
);
