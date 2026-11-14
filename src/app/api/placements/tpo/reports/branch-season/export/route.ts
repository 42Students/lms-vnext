import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {tpoReportHasRepeatedSearchParams} from "@/modules/placements/tpo-report-url-guard";
import {NextResponse} from "next/server";
import { tpoBranchSeasonQuerySchema, tpoBranchSeasonCsv } from "@/modules/placements/tpo-branch-season-model";
import { getTpoBranchSeasonDashboard } from "@/modules/placements/tpo-branch-season-service";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
import { attachmentHeader } from "@/security/downloads";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleGET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    if(tpoReportHasRepeatedSearchParams(params))return NextResponse.json({error:"INVALID_QUERY"},{
      status:400,headers:{"Cache-Control":CACHE.PRIVATE},
    });
    const query = tpoBranchSeasonQuerySchema.parse(Object.fromEntries(params.entries()));
    const context = await getCurrentRequestContext();
    const data = await getTpoBranchSeasonDashboard(context, query);
    const csv = tpoBranchSeasonCsv(data.season?.name ?? "No season", data.rows);
    return new Response("\uFEFF" + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": attachmentHeader(gridExportFilename("tpo-branch-season", "csv")),
        "Cache-Control": CACHE.PRIVATE_STRICT,
        "X-Content-Type-Options": "nosniff",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);
