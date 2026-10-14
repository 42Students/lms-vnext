import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { bulkWithdrawPlacementOffers } from "@/modules/placements/bulk-offer-withdrawal-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    return NextResponse.json(
      await bulkWithdrawPlacementOffers(context, jobId, await request.json()),
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
