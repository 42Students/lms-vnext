import { NextResponse } from "next/server";
import { placementTableExists } from "@/modules/placements/staged-tables";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { getCurrentRequestContext } from "@/auth/request-context";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { getTpoCompanyMemory } from "@/modules/placements/tpo-company-memory-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    await requirePlacementManageScope(context,url.searchParams.get("collegeId")??"");
    if(!(await placementTableExists("placement_tpo_leads"))||
       !(await placementTableExists("placement_tpo_lead_activities")))
      return NextResponse.json({
        error:"TPO_CRM_SCHEMA_NOT_REGISTERED",
        message:"Company details are temporarily unavailable while placement data storage is being prepared.",
        retryable:true,
      },{status:503,headers:{"Cache-Control":"private, no-store","Retry-After":"60"}});
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
