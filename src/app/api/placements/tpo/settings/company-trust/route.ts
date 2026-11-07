import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  TpoCompanyTrustConflict,
  updateConfirmedTpoCompanyTrust,
} from "@/modules/placements/tpo-company-trust-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
return NextResponse.json(await updateConfirmedTpoCompanyTrust(
      context, await boundedRequestJson(request),
    ));
} catch (error) {
    if (error instanceof TpoCompanyTrustConflict) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return apiErrorResponse(error);
  }
  },
);
