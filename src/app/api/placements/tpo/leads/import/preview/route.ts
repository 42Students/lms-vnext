import { boundedRequestJson } from "@/lib/bounded-request-json";
import { tpoCrmTablesReady } from "@/modules/placements/tpo-crm-storage-readiness";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { previewTpoLeadImportCollisions } from "@/modules/placements/tpo-lead-csv-import-service";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Read-only preview uses POST to keep up to 5000 contacts out of query strings. */
async function handlePOST(request: Request) {
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
      context, context.membership.collegeId, await boundedRequestJson(request, 8 * 1024 * 1024),
    ), { headers: { "Cache-Control": CACHE.NONE } });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("CSV_")) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return tpoCrmApiErrorResponse(error);
  }
}
export const POST = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
