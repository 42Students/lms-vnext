import "server-only";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import { listOwnPlacementRequests } from "./request-service";
import { ownLearnerSupportRequestList,learnerUnifiedPersonalRequestPage } from "./learner-support-request-model";
import { listOwnTpoGeneralRequests } from "./tpo-general-request-service";
import { placementTableExists } from "./staged-tables";
/** Personal persisted placement request history, not a general helpdesk ticket feed. */
export async function getOwnLearnerSupportRequests(context:RequestContext,query:unknown) {
  const membership=await requireLearnerPlacementAccess(context);
  requirePermission(context,"placements.read",{collegeId:membership.collegeId,organizationId:membership.organizationId});
  const rows=await listOwnPlacementRequests(context);
  return ownLearnerSupportRequestList(rows,query);
}
/** Two independently scoped learner feeds, combined before pagination. */
export async function getOwnUnifiedLearnerRequests(context:RequestContext,query:unknown){
 const membership=await requireLearnerPlacementAccess(context);
 requirePermission(context,"placements.read",{
  collegeId:membership.collegeId,organizationId:membership.organizationId});
 const [placement,generalReady]=await Promise.all([
  listOwnPlacementRequests(context),
  placementTableExists("placement_learner_general_requests"),
 ]);
 const general=generalReady?await listOwnTpoGeneralRequests(context):[];
 return {...learnerUnifiedPersonalRequestPage(placement,general,query),
  generalAvailable:generalReady};
}
