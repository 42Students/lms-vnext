import { boundedRequestJson } from "@/lib/request-body";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { completeConfirmedTpoFollowup } from "@/modules/placements/tpo-followup-queue-service";
import { route } from "@/security/route";

import { featureReady } from "@/config/features";
export const runtime = "nodejs";
type RouteContext = { params: Promise<{ followupId: string }> };

async function handlePOST(request: Request, { params }: RouteContext) {
  if (!featureReady("tpoApi")) {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { followupId } = await params;
    const result = await completeConfirmedTpoFollowup(
      context, followupId, await boundedRequestJson(request),
    );
    return NextResponse.json({ followup: result });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
