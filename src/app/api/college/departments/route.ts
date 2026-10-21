import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { createCollegeDepartment } from "@/modules/departments/college-department-mutation-service";

export const runtime = "nodejs";
/** Absent/expired login is translated by apiErrorResponse to a 401
 * SESSION_MISSING/SESSION_INVALID with the public sign-in-required message.
 * An API mutation must not redirect anonymous fetch clients to an HTML page.
 */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    return NextResponse.json({ department: await createCollegeDepartment(
      context, await request.json(),
    ) }, { status: 201 });
  } catch (error) { return apiErrorResponse(error); }
}
