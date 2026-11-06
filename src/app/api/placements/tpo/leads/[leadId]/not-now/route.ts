import { tpoCrmTablesReady } from "@/modules/placements/tpo-crm-storage-readiness";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { confirmedMarkTpoNotNowSchema } from "@/modules/placements/tpo-crm-validation";
import { markTpoLeadNotNow } from "@/modules/placements/tpo-crm-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ leadId: string }> };

async function handlePOST(request: Request, { params }: RouteContext) {
  if (!await tpoCrmTablesReady()) return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503});

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { leadId } = await params;
    const payload = confirmedMarkTpoNotNowSchema.parse(await request.json());
    const lead = await markTpoLeadNotNow(
      context, leadId, payload.decision,
    );
    return NextResponse.json({ lead });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
