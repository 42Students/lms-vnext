import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import { getLearnerPlacementRequestWorkspace } from "./request-service";

/** Own, persisted, scheduled shortlisted rounds only. The shared request
 * reader also enforces application membership and never exposes others. */
export async function getOwnLearnerAssessmentBrowse(context: RequestContext) {
  const membership = await requireLearnerPlacementAccess(context);
  requirePermission(context, "placements.read", {
    collegeId: membership.collegeId,
    organizationId: membership.organizationId,
  });
  return getLearnerPlacementRequestWorkspace(context);
}
