import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {reassignCollegeTeaching,CollegeTeachingReassignError}
  from "@/modules/courses/college-teaching-reassign-service";
export const runtime="nodejs";
type RouteContext={params:Promise<{assignmentId:string}>};
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {assignmentId}=params;
    return NextResponse.json(await reassignCollegeTeaching(
      __ctx,assignmentId,await request.json(),
    ));
  },
);
