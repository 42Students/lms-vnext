import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { importTpoLeadsCsv } from "@/modules/placements/tpo-lead-csv-import-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (process.env.DB09_TPO_API_READY !== "DB09_VERIFIED") {
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
    return NextResponse.json(await importTpoLeadsCsv(
      context, context.membership.collegeId, await request.json(),
    ));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("CSV_")) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return tpoCrmApiErrorResponse(error);
  }
}
