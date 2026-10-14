import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { exportTpoSeasonPipelineCsv } from "@/modules/placements/tpo-season-pipeline-model";
import { getTpoSeasonPipeline } from "@/modules/placements/tpo-season-pipeline-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const query = Object.fromEntries(new URL(request.url).searchParams.entries());
    const report = await getTpoSeasonPipeline(context, query);
    const result = exportTpoSeasonPipelineCsv(
      report.season?.name ?? "No season selected", report.totals, report.rows,
    );
    return new Response("\uFEFF" + result.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="tpo-season-pipeline.csv"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        Vary: "Cookie",
        "X-Export-Truncated": String(result.truncated),
      },
    });
  } catch (caught) {
    const response = apiErrorResponse(caught);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }
}
