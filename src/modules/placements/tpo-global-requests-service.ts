import "server-only";
import {eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {departments} from "@/db/schema";
import {globalTpoRequestsQuerySchema,tpoRequestDateBounds} from "@/modules/placements/tpo-global-requests-model";
import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { listTpoStudentRequests } from "@/modules/placements/tpo-students-service";
import {requirePersistedTpoMembership} from "@/modules/placements/tpo-persisted-actor-service";



export async function getTpoGlobalRequestsInbox(context: RequestContext, rawQuery: unknown) {
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "TPO") ||
      member.status !== "ACTIVE" || context.user.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("placements.manage");
  }
  const query = globalTpoRequestsQuerySchema.parse(rawQuery);
  await requirePersistedTpoMembership(context,member.collegeId);
  await requirePlacementManageScope(context, member.collegeId);
  const result = await listTpoStudentRequests(context, {
    collegeId: member.collegeId,
    status: query.status==="ALL"?undefined:query.status,
    requestType:query.requestType==="ALL"?undefined:query.requestType,
    sort:query.sort,
    requestedBefore:tpoRequestDateBounds(query.age,new Date()).before,
    requestedAfter:tpoRequestDateBounds(query.age,new Date()).after,
    search: query.search,
    urgentOnly:query.urgentOnly ?? false,
    jobId:query.jobId,
    proof:query.proof,branchId:query.branchId,
    registration:query.registration,afterCollege:query.afterCollege,
    page: query.page,
    pageSize: query.pageSize,
  });
  const branches=await getDb().select({id:departments.id,name:departments.name})
    .from(departments).where(eq(departments.collegeId,member.collegeId))
    .orderBy(departments.name);
  return { query, branches, ...result };
}
