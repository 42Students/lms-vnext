import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {moveCourseDepartmentInputSchema} from "@/modules/courses/validation";
import {moveCourseDepartment} from "@/modules/courses/course-service";

export const runtime="nodejs";

/** A same-college department reassignment is possible only without any
 * offering history. The service locks, authorizes and audits the move. */
export const POST = route(
  { auth: "user", permission: "courses.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {courseId}=params;
    const body:unknown=await boundedRequestJson(request);
    const input=moveCourseDepartmentInputSchema.parse(body);
    const course=await moveCourseDepartment(context,courseId,
      input.departmentId,input.expectedUpdatedAt);
    return NextResponse.json({course},{headers:{"Cache-Control":"private, no-store"}});
  },
);
