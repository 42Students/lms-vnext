import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { executeCollegeRecurringSchedule, CollegeRecurringExecutionError }
  from "@/modules/academics/college-recurring-execute-service";
export const runtime = "nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    return NextResponse.json(await executeCollegeRecurringSchedule(
      __ctx, await request.json(),
    ),{status:201});
  },
);
