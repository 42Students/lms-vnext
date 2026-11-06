import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { TpoCompanyLifecycleError, saveTpoCompanyLifecycle } from "@/modules/placements/tpo-company-lifecycle-service";

export const runtime = "nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    return NextResponse.json(await saveTpoCompanyLifecycle(
      __ctx, await request.json(),
    ));
  },
);
