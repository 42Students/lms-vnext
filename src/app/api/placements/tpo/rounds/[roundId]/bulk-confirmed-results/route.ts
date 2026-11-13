import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { confirmTpoBulkRoundResults } from "@/modules/placements/tpo-bulk-round-result-service";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { roundId } = params;
    const result=await confirmTpoBulkRoundResults(
      context, roundId, await boundedRequestJson(request, 8 * 1024 * 1024),
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
    },{headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
