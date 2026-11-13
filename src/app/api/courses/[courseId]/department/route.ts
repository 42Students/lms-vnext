import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";

import {moveCourseDepartmentInputSchema} from "@/modules/courses/validation";
import {moveCourseDepartment} from "@/modules/courses/course-service";

import { privateJson } from "@/security/responses";
export const runtime="nodejs";

/** A same-college department reassignment is possible only without any
 * offering history. The service locks, authorizes and audits the move. */
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {courseId}=params;
    const body:unknown=await boundedRequestJson(request);
    const input=moveCourseDepartmentInputSchema.parse(body);
    const course=await moveCourseDepartment(context,courseId,
      input.departmentId,input.expectedUpdatedAt);
    return privateJson({course});
  },
);
