import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getTpoCalendarRoundExport } from "@/modules/placements/tpo-calendar-export-service";
import { tpoCalendarRoundsCsv } from "@/modules/placements/tpo-calendar-export-model";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
import { attachmentHeader } from "@/security/downloads";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handleGET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const data = await getTpoCalendarRoundExport(
      await getCurrentRequestContext(), Object.fromEntries(params.entries()),
    );
    return new Response("\uFEFF" + tpoCalendarRoundsCsv(data.rows, data.truncated), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": attachmentHeader(gridExportFilename("tpo-upcoming-rounds", "csv")),
        "Cache-Control": CACHE.PRIVATE,
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
export const GET = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);
