import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { hasMembershipRole, isSuperAdmin } from "@/modules/identity/context";
import { apiErrorResponse } from "@/lib/api-error";
import { resetLoginOtpLockout } from "@/modules/auth/admin-otp-lockout-reset-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    if (!isSuperAdmin(context) && !hasMembershipRole(context, "COLLEGE_ADMIN"))
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const input: unknown = await request.json();
    const result = await resetLoginOtpLockout(context, input);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
