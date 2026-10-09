import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { markTpoLeadNotNow } from "@/modules/placements/tpo-crm-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ leadId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { leadId } = await params;
    const lead = await markTpoLeadNotNow(
      context, leadId, await request.json(),
    );
    return NextResponse.json({ lead });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
