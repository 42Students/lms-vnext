import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { getTpoLead, updateTpoLead } from "@/modules/placements/tpo-crm-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ leadId: string }> };

// Keep W01's migration release gate: these handlers are non-executable
// until DB09 tables, constraints and integration checks are verified.
function pending() {
  return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
}

export async function GET(request: Request, { params }: RouteContext) {
  if (process.env.DB09_TPO_API_READY !== "DB09_VERIFIED") return pending();
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

export async function PATCH(request: Request, { params }: RouteContext) {
  if (process.env.DB09_TPO_API_READY !== "DB09_VERIFIED") return pending();
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { leadId } = await params;
    const lead = await updateTpoLead(context, leadId, await request.json());
    return NextResponse.json({ lead });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
