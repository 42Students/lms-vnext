import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { createCollegeDepartment } from "@/modules/departments/college-department-mutation-service";

export const runtime = "nodejs";
/** Absent/expired login is translated by apiErrorResponse to a 401
 * SESSION_MISSING/SESSION_INVALID with the public sign-in-required message.
 * An API mutation must not redirect anonymous fetch clients to an HTML page.
 */
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    return NextResponse.json({ department: await createCollegeDepartment(
      context, await boundedRequestJson(request),
    ) }, { status: 201 });
  },
);
