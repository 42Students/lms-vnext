import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { createPlacementCompany } from "@/modules/placements/company-service";
import { tpoCreateCompanySchema } from "@/modules/placements/tpo-company-create-model";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    if (!context.membership || !hasMembershipRole(context, "TPO")) {
      throw new AuthorizationError("placements.manage");
    }
    const collegeId = context.membership.collegeId;
    if (!can(context, "placements.manage", { collegeId })) {
      throw new AuthorizationError("placements.manage");
    }
    requirePermission(context, "placements.manage", { collegeId });
    await requirePlacementManageScope(context, collegeId);
    const { confirmed: _confirmed, ...input } =
      tpoCreateCompanySchema.parse(await request.json());
    void _confirmed;
    const result = await createPlacementCompany(context, {
      ...input, collegeId, isTrusted: false,
    });
    return NextResponse.json({
      companyId: result.company.id,
      relationshipId: result.relationship.id,
      companyName: result.company.name,
    }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
