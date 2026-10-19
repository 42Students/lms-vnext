import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {tpoReportHasRepeatedSearchParams} from "@/modules/placements/tpo-report-url-guard";
import {NextResponse} from "next/server";
import { getTpoPerformanceIntelligence } from "@/modules/placements/tpo-intelligence-service";
import {
  tpoIntelligenceCsv,
  tpoIntelligenceFiltersSchema,
} from "@/modules/placements/tpo-intelligence-model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    if(tpoReportHasRepeatedSearchParams(params))return NextResponse.json({error:"INVALID_QUERY"},{
      status:400,headers:{"Cache-Control":"private, no-store"},
    });
    const raw = Object.fromEntries(params.entries());
    const query = tpoIntelligenceFiltersSchema.parse(raw);
    const context = await getCurrentRequestContext();
    const data = await getTpoPerformanceIntelligence(context, query);
    return new Response("\uFEFF" + tpoIntelligenceCsv(data.companies, data.compensation), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="' + gridExportFilename("tpo-company-funnel-compensation", "csv") + '"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    const response = apiErrorResponse(error);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }
}
