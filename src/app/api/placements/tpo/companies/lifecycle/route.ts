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
    try {
return NextResponse.json(await saveTpoCompanyLifecycle(
      __ctx, await request.json(),
    ));
} catch (error) {
    if (error instanceof TpoCompanyLifecycleError) {
      return NextResponse.json({ error: error.message }, {
        status: error.code === "STALE" ? 409 :
          error.code === "ACTIVE_DRIVES" ? 422 : 404,
      });
    }
    return apiErrorResponse(error);
  }
  },
);
