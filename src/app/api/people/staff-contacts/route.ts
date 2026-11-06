import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listCollegeStaffContacts } from "@/modules/people/college-contacts-service";

export const runtime = "nodejs";

/**
 * Authenticated read-only staff contacts. Authorization, faculty-department
 * scope and learner exclusion are all enforced in the service transaction.
 * No caller-provided college identifier or unmasked phone lookup is accepted.
 */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const params = new URL(request.url).searchParams;
    const result = await listCollegeStaffContacts(__ctx, {
      q: params.get("q") ?? undefined,
      departmentId: params.get("departmentId") ?? undefined,
      limit: params.get("limit") ?? undefined,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  },
);
