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
    // This endpoint saves STAGED results only. A separate scoped Apply whole
    // round action notifies learners; never infer "applied" from staging.
    const result=await confirmTpoBulkRoundResults(
      context, roundId, await request.json(),
    );
    return NextResponse.json({
      ...result,
      phase:"STAGED",
      applied:0,
      staged:result.counts.staged,
      skipped:result.counts.ineligible,
      skippedRows:result.results.filter(item=>item.status==="ineligible")
        .map(item=>({applicationId:item.applicationId,reason:item.reason??"NOT_ELIGIBLE"})),
      nextAction:"Review pending results and apply the whole round separately.",
    },{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
