import "server-only";
import {globalTpoRequestsQuerySchema} from "@/modules/placements/tpo-global-requests-model";
import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { listTpoStudentRequests } from "@/modules/placements/tpo-students-service";



export async function getTpoGlobalRequestsInbox(context: RequestContext, rawQuery: unknown) {
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "TPO") ||
      member.status !== "ACTIVE" || context.user.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("placements.manage");
  }
  const query = globalTpoRequestsQuerySchema.parse(rawQuery);
  await requirePlacementManageScope(context, member.collegeId);
  const result = await listTpoStudentRequests(context, {
    collegeId: member.collegeId,
    status: query.status,
    requestType:query.requestType==="ALL"?undefined:query.requestType,
    search: query.search,
    page: query.page,
    pageSize: query.pageSize,
  });
  return { query, ...result };
}
