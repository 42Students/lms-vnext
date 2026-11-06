import { tpoCrmTablesReady } from "@/modules/placements/tpo-crm-storage-readiness";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { addTpoFollowup, listTpoLeadFollowups } from "@/modules/placements/tpo-crm-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ leadId: string }> };

async function handleGET(request: Request, { params }: RouteContext) {
  if (!await tpoCrmTablesReady()) {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { leadId } = await params;
    const collegeId = new URL(request.url).searchParams.get("collegeId") ?? "";
    const followups = await listTpoLeadFollowups(context, collegeId, leadId);
    return NextResponse.json({ followups });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
export const GET = secured(handleGET);

async function handlePOST(request: Request, { params }: RouteContext) {
  if (!await tpoCrmTablesReady()) return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503});

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { leadId } = await params;
    const followup = await addTpoFollowup(
      context, leadId, await request.json(),
    );
    return NextResponse.json({ followup }, { status: 201 });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
