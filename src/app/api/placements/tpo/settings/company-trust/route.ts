import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  TpoCompanyTrustConflict,
  updateConfirmedTpoCompanyTrust,
} from "@/modules/placements/tpo-company-trust-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handlePOST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    return NextResponse.json(await updateConfirmedTpoCompanyTrust(
      context, await request.json(),
    ));
  } catch (error) {
    if (error instanceof TpoCompanyTrustConflict) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return apiErrorResponse(error);
  }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
