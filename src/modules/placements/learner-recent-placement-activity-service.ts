import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { getLearnerPlacementJourney } from "./learner-journey-service";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import { buildLearnerRecentPlacementActivity } from "./learner-recent-placement-activity-model";

/** Use only verified own-membership journeys and publicly applied results. */
export async function getLearnerPlacementJourneyWithActivity(
  context: RequestContext,
) {
  const membership = await requireLearnerPlacementAccess(context);
  requirePermission(context, "placements.read", {
    collegeId: membership.collegeId,
  });
  const rows = await getLearnerPlacementJourney(context);
  return {
    rows,
    activity: buildLearnerRecentPlacementActivity(rows),
  };
}
