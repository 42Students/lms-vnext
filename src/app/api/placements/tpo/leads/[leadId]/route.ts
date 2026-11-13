import { boundedRequestJson } from "@/lib/request-body";
import { tpoCrmTablesReady } from "@/modules/placements/tpo-crm-storage-readiness";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { getTpoLead, updateTpoLead } from "@/modules/placements/tpo-crm-service";
import { route } from "@/security/route";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ leadId: string }> };

// Keep W01's migration release gate: these handlers are non-executable
// until DB09 tables, constraints and integration checks are verified.
function pending() {
  return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
}

async function handleGET(request: Request, { params }: RouteContext) {
  if (!await tpoCrmTablesReady()) return pending();
  try {
    const context = await getCurrentRequestContext();
    const { leadId } = await params;
    const collegeId = new URL(request.url).searchParams.get("collegeId") ?? "";
    const lead = await getTpoLead(context, collegeId, leadId);
    return NextResponse.json({ lead });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);

async function handlePATCH(request: Request, { params }: RouteContext) {
  if (!await tpoCrmTablesReady()) return pending();
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { leadId } = await params;
    const lead = await updateTpoLead(context, leadId, await boundedRequestJson(request));
    return NextResponse.json({ lead });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePATCH(request as Parameters<typeof handlePATCH>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePATCH>[1]),
);
