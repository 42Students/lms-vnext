import { boundedRequestJson } from "@/lib/bounded-request-json";
import { tpoCrmTablesReady } from "@/modules/placements/tpo-crm-storage-readiness";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { finishTpoFollowup } from "@/modules/placements/tpo-crm-service";
import { route } from "@/security/route";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ followupId: string }> };

async function handlePOST(request: Request, { params }: RouteContext) {
  if (!await tpoCrmTablesReady()) return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503});

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { followupId } = await params;
    const body = await boundedRequestJson(request);
    const followup = await finishTpoFollowup(
      context, body.collegeId, followupId,
    );
    return NextResponse.json({ followup });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
export const POST = route(
  { auth: "user", permission: "placements.manage" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
