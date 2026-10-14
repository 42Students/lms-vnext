import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { confirmTpoBulkRoundResults } from "@/modules/placements/tpo-bulk-round-result-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ roundId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { roundId } = await params;
    return NextResponse.json(await confirmTpoBulkRoundResults(
      context, roundId, await request.json(),
    ));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
