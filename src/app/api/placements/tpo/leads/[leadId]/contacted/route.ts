import { tpoCrmTablesReady } from "@/modules/placements/tpo-crm-storage-readiness";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { markTpoLeadContacted } from "@/modules/placements/tpo-crm-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ leadId: string }> };

async function handlePOST(request: Request, { params }: RouteContext) {
  if (!await tpoCrmTablesReady()) {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { leadId } = await params;
    const body = await request.json();
    const lead = await markTpoLeadContacted(context, body.collegeId, leadId);
    return NextResponse.json({ lead });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
