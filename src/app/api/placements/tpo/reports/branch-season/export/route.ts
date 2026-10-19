import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {tpoReportHasRepeatedSearchParams} from "@/modules/placements/tpo-report-url-guard";
import {NextResponse} from "next/server";
import { tpoBranchSeasonQuerySchema, tpoBranchSeasonCsv } from "@/modules/placements/tpo-branch-season-model";
import { getTpoBranchSeasonDashboard } from "@/modules/placements/tpo-branch-season-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    if(tpoReportHasRepeatedSearchParams(params))return NextResponse.json({error:"INVALID_QUERY"},{
      status:400,headers:{"Cache-Control":"private, no-store"},
    });
    const query = tpoBranchSeasonQuerySchema.parse(Object.fromEntries(params.entries()));
    const context = await getCurrentRequestContext();
    const data = await getTpoBranchSeasonDashboard(context, query);
    const csv = tpoBranchSeasonCsv(data.season?.name ?? "No season", data.rows);
    return new Response("\uFEFF" + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="' + gridExportFilename("tpo-branch-season", "csv") + '"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
