import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {bulkSuperAdminCourseVisibility} from "@/modules/courses/super-admin-course-bulk-visibility";

export const runtime="nodejs";

/** College Admin bulk visibility adapter. The shared service resolves and
 * verifies the actor's live college, applies course and published-content
 * visibility with per-course failures, and never accepts a client college ID.
 * This route is not an escalation into the Super Admin workspace. */
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const report=await bulkSuperAdminCourseVisibility(context,await boundedRequestJson(request, 8 * 1024 * 1024));
    return NextResponse.json(report,{headers:{"Cache-Control":"private, no-store"}});
  },
);
