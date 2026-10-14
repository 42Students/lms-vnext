import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { TpoCompanyLifecycleError, saveTpoCompanyLifecycle } from "@/modules/placements/tpo-company-lifecycle-service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    return NextResponse.json(await saveTpoCompanyLifecycle(
      await getCurrentRequestContext(), await request.json(),
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
}
