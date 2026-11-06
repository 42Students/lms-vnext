import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { placementTableExists } from "@/modules/placements/staged-tables";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { saveTpoCompanyPerson, TpoCompanyPersonStale } from "@/modules/placements/tpo-company-person-service";
import { TpoCrmError } from "@/modules/placements/tpo-crm-service";

export const runtime = "nodejs";
type Context = { params: Promise<{ companyId: string }> };

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { companyId } = params;
    await requirePlacementManageScope(context,context.membership?.collegeId??"");
    if(!(await placementTableExists("placement_tpo_leads"))||
       !(await placementTableExists("placement_tpo_lead_activities")))
      return NextResponse.json({error:"TPO_CRM_SCHEMA_NOT_REGISTERED"},{status:503});
    const result = await saveTpoCompanyPerson(context, companyId, await request.json());
    return NextResponse.json({ result });
  },
);
