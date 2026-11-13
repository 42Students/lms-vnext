import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { hasMembershipRole, isSuperAdmin } from "@/modules/identity/context";
import { resetLoginOtpLockout } from "@/modules/auth/admin-otp-lockout-reset-service";

import { ROLE } from "@/modules/identity/roles";
import { noStoreJson } from "@/security/responses";
export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    if (!isSuperAdmin(context) && !hasMembershipRole(context, ROLE.COLLEGE_ADMIN))
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const input: unknown = await boundedRequestJson(request);
    const result = await resetLoginOtpLockout(context, input);
    return noStoreJson(result);
  },
);
