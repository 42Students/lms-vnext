import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getTpoDriveCloseout } from "@/modules/placements/tpo-drive-closeout-service";
import { tpoDriveCloseoutCsv } from "@/modules/placements/tpo-drive-closeout-model";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: {
  params: Promise<{ jobId: string }>;
}) {
  try {
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    const data = await getTpoDriveCloseout(context, jobId);
    return new Response("\uFEFF" + tpoDriveCloseoutCsv(data.job.title, data.counts), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="' + gridExportFilename("tpo-drive-closeout", "csv") + '"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Vary": "Cookie",
      },
    });
  } catch (error) {
    const response = apiErrorResponse(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
