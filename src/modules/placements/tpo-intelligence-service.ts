import "server-only";

import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { getPlacementReportDetails } from "./report-service";
import {
  buildTpoCompanyFunnel,
  buildTpoCompensationIntelligence,
  tpoIntelligenceFiltersSchema,
} from "./tpo-intelligence-model";

export async function getTpoPerformanceIntelligence(
  context: RequestContext,
  rawQuery: unknown,
) {
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = context.membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  await requirePlacementManageScope(context, collegeId);
  const query = tpoIntelligenceFiltersSchema.parse(rawQuery);
  const workspace = await getPlacementReportDetails(context, { collegeId, ...query });
  return {
    workspace,
    companies: buildTpoCompanyFunnel(workspace.report.byCompany),
    compensation: buildTpoCompensationIntelligence(workspace.details.ctc, workspace.report.metrics),
  };
}
