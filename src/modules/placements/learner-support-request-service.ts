import "server-only";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import { listOwnPlacementRequests } from "./request-service";
import { ownLearnerSupportRequestList } from "./learner-support-request-model";
/** Personal persisted placement request history, not a general helpdesk ticket feed. */
export async function getOwnLearnerSupportRequests(context:RequestContext,query:unknown) {
  const membership=await requireLearnerPlacementAccess(context);
  requirePermission(context,"placements.read",{collegeId:membership.collegeId,organizationId:membership.organizationId});
  const rows=await listOwnPlacementRequests(context);
  return ownLearnerSupportRequestList(rows,query);
}