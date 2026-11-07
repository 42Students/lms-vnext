import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { placementTableExists } from "@/modules/placements/staged-tables";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { getCurrentRequestContext } from "@/auth/request-context";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { listTpoCompanies } from "@/modules/placements/tpo-company-memory-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
// Default to the actor's own college; a missing or malformed id is a bad request, not a database error (SEC-08).
const requested = new URL(request.url).searchParams.get("collegeId");
const collegeId = requested?.trim() || context.membership?.collegeId || "";
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(collegeId))
  return NextResponse.json({ error: "INVALID_COLLEGE_ID" }, { status: 400 });
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
  },
);
