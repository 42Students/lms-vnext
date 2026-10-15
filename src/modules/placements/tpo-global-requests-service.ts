import "server-only";
import { z } from "zod";
import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { listTpoStudentRequests } from "@/modules/placements/tpo-students-service";

export const globalTpoRequestsQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).default("PENDING"),
  search: z.string().trim().max(150).default(""),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().refine(value => [25, 50, 100].includes(value)).default(25),
}).strict();

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
    search: query.search,
    page: query.page,
    pageSize: query.pageSize,
  });
  return { query, ...result };
}
