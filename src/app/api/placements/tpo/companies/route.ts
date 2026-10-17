import { NextResponse } from "next/server";
import { placementTableExists } from "@/modules/placements/staged-tables";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { getCurrentRequestContext } from "@/auth/request-context";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { listTpoCompanies } from "@/modules/placements/tpo-company-memory-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const collegeId = new URL(request.url).searchParams.get("collegeId") ?? "";
    await requirePlacementManageScope(context,collegeId);
    if(!(await placementTableExists("placement_tpo_leads"))||
       !(await placementTableExists("placement_tpo_lead_activities")))
      return NextResponse.json({error:"TPO_CRM_SCHEMA_NOT_REGISTERED"},{status:503});
    return NextResponse.json({
      companies: await listTpoCompanies(context, collegeId),
    });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
