import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getTpoActorAudit } from "@/modules/placements/tpo-actor-audit-service";
import { tpoActorAuditCsv, tpoActorAuditQuerySchema } from "@/modules/placements/tpo-actor-audit-model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const raw = Object.fromEntries(new URL(request.url).searchParams.entries());
    const query = tpoActorAuditQuerySchema.parse(raw);
    const data = await getTpoActorAudit(context, query, { exportLimit: 2000 });
    return new Response("\uFEFF" + tpoActorAuditCsv(data.rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="' + gridExportFilename("tpo-actor-entity-audit", "csv") + '"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        Vary: "Cookie",
        "X-Export-Truncated": data.truncated ? "true" : "false",
      },
    });
  } catch (error) {
    const response = apiErrorResponse(error);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }
}
