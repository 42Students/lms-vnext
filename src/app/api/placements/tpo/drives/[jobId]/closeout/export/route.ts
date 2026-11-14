import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getTpoDriveCloseout } from "@/modules/placements/tpo-drive-closeout-service";
import { tpoDriveCloseoutCsv } from "@/modules/placements/tpo-drive-closeout-model";
import { route } from "@/security/route";
import { CACHE } from "@/security/responses";
import { attachmentHeader } from "@/security/downloads";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handleGET(_request: Request, { params }: {
  params: Promise<{ jobId: string }>;
}) {
  try {
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    const data = await getTpoDriveCloseout(context, jobId);
    return new Response("\uFEFF" + tpoDriveCloseoutCsv(data.job.title, data.counts), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": attachmentHeader(gridExportFilename("tpo-drive-closeout", "csv")),
        "Cache-Control": CACHE.PRIVATE,
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
export const GET = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);
