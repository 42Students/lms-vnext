import { NextResponse } from "next/server";
import { placementTableExists } from "@/modules/placements/staged-tables";
import { getCurrentRequestContext } from "@/auth/request-context";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { listTpoCompanies } from "@/modules/placements/tpo-company-memory-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!await placementTableExists("placement_tpo_leads") || !await placementTableExists("placement_tpo_lead_activities")) {
    return NextResponse.json({ error: "DATABASE_NOT_READY" }, { status: 503 });
  }
  try {
    const context = await getCurrentRequestContext();
    const collegeId = new URL(request.url).searchParams.get("collegeId") ?? "";
    return NextResponse.json({
      companies: await listTpoCompanies(context, collegeId),
    });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
