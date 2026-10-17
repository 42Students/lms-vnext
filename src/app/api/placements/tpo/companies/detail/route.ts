import { NextResponse } from "next/server";
import { placementTableExists } from "@/modules/placements/staged-tables";
import { getCurrentRequestContext } from "@/auth/request-context";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { getTpoCompanyMemory } from "@/modules/placements/tpo-company-memory-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!await placementTableExists("placement_tpo_leads") || !await placementTableExists("placement_tpo_lead_activities")) {
    return NextResponse.json({ error: "DATABASE_NOT_READY" }, { status: 503 });
  }
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    return NextResponse.json({
      company: await getTpoCompanyMemory(
        context,
        url.searchParams.get("collegeId") ?? "",
        url.searchParams.get("name") ?? "",
      ),
    });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
