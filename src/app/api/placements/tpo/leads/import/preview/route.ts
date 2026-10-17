import { tpoCrmTablesReady } from "@/modules/placements/tpo-crm-storage-readiness";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { previewTpoLeadImportCollisions } from "@/modules/placements/tpo-lead-csv-import-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Read-only preview uses POST to keep up to 5000 contacts out of query strings. */
export async function POST(request: Request) {
  if (!await tpoCrmTablesReady()) {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    if (!context.membership) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 403 });
    }
    return NextResponse.json(await previewTpoLeadImportCollisions(
      context, context.membership.collegeId, await request.json(),
    ), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("CSV_")) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return tpoCrmApiErrorResponse(error);
  }
}
