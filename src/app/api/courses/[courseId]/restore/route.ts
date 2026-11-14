import { route } from "@/security/route";

import {restoreCourse} from "@/modules/courses/course-service";

import { privateJson } from "@/security/responses";
export const runtime="nodejs";
/** Legacy POST /api/v1/course/restore/{id} maps to an authenticated,
 * department-owned UUID. The service locks the archived record, verifies
 * the active college and department, and rejects name/code collisions. */
export const POST = route(
  { auth: "user", permission: "courses.manage" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const {courseId}=params;
    const course=await restoreCourse(context,courseId);
    return privateJson({course,status:"RESTORED"});
  },
);
