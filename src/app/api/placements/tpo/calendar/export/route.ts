import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getTpoCalendarRoundExport } from "@/modules/placements/tpo-calendar-export-service";
import { tpoCalendarRoundsCsv } from "@/modules/placements/tpo-calendar-export-model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const data = await getTpoCalendarRoundExport(
      await getCurrentRequestContext(), Object.fromEntries(params.entries()),
    );
    return new Response("\uFEFF" + tpoCalendarRoundsCsv(data.rows, data.truncated), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="' + gridExportFilename("tpo-upcoming-rounds", "csv") + '"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    const response = apiErrorResponse(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
