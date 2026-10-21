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
    // Old /detail?name inferred the active TPO college from the session.
    // An explicit college must match the authenticated membership scope.
    const collegeId=url.searchParams.get("collegeId")??
      context.membership?.collegeId??"";
    await requirePlacementManageScope(context,collegeId);
    const companyName=url.searchParams.get("name")?.trim()??"";
    if(!companyName||companyName.length>200)return NextResponse.json({
      error:"INVALID_COMPANY_NAME",message:"Choose a company from your college directory.",
    },{status:400,headers:{"Cache-Control":"private, no-store"}});
    if(!(await placementTableExists("placement_tpo_leads"))||
       !(await placementTableExists("placement_tpo_lead_activities")))
      return NextResponse.json({
        error:"TPO_CRM_SCHEMA_NOT_REGISTERED",
        message:"Company details are temporarily unavailable while placement data storage is being prepared.",
        retryable:true,
      },{status:503,headers:{"Cache-Control":"private, no-store","Retry-After":"60"}});
    const company=await getTpoCompanyMemory(context,collegeId,companyName);
    return NextResponse.json({
      company,data:company,name:companyName,collegeId,
      countsStatus:"INDEPENDENT",
      countsHref:"/api/placements/tpo/companies/drives/counts",
      message:"Company details loaded",
    },{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
