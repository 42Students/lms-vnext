import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import {
  createConfirmedTpoCompanyInteraction,
  TpoCompanyInteractionConflict,
} from "@/modules/placements/tpo-company-interaction-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ companyId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  if (process.env["DB09_TPO_API_READY"] !== "DB09_VERIFIED") {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { companyId } = await params;
    const created = await createConfirmedTpoCompanyInteraction(
      context, companyId, await request.json(),
    );
    return NextResponse.json({ activity: created }, { status: 201 });
  } catch (error) {
    if (error instanceof TpoCompanyInteractionConflict) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return tpoCrmApiErrorResponse(error);
  }
}
