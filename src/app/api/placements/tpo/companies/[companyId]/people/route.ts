import { boundedRequestJson } from "@/lib/request-body";
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
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const { companyId } = params;
await requirePlacementManageScope(context,context.membership?.collegeId??"");
if(!(await placementTableExists("placement_tpo_leads"))||
       !(await placementTableExists("placement_tpo_lead_activities")))
      return NextResponse.json({error:"TPO_CRM_SCHEMA_NOT_REGISTERED"},{status:503});
const result = await saveTpoCompanyPerson(context, companyId, await boundedRequestJson(request));
return NextResponse.json({ result });
} catch (error) {
    if (error instanceof TpoCompanyPersonStale) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof TpoCrmError) {
      return NextResponse.json({ error: error.code }, {
        status: error.code === "TPO_CRM_LEAD_DUPLICATE" ? 409 : 404,
      });
    }
    return apiErrorResponse(error);
  }
  },
);
