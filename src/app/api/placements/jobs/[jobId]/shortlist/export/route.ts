import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getTpoDriveShortlist } from "@/modules/placements/tpo-shortlist-service";
import { tpoShortlistCsv } from "@/modules/placements/tpo-shortlist-model";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
import { attachmentHeader } from "@/security/downloads";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ jobId: string }> };

async function handleGET(_request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    const data = await getTpoDriveShortlist(context, { jobId }, { exportAll: true });
    return new Response("\uFEFF" + tpoShortlistCsv(data.rows), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": attachmentHeader("tpo-drive-shortlist.csv"),
        "Cache-Control": CACHE.PRIVATE_STRICT,
        "X-Content-Type-Options": "nosniff",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    const response = apiErrorResponse(error);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Vary", "Cookie");
    return response;
  }
}
export const GET = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);
