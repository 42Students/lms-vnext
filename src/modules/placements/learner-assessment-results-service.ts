import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";

import { getLearnerPlacementJourney } from "./learner-journey-service";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import {
  buildLearnerAssessmentResults,
  filterLearnerAssessmentResults,
  learnerAssessmentResultsViewSchema,
} from "./learner-assessment-results-model";

/** Never accept college or membership IDs from route/query parameters. */
export async function getOwnLearnerAssessmentResults(
  context: RequestContext,
  rawView: unknown = "all",
) {
  const view = learnerAssessmentResultsViewSchema.parse(rawView);
  const member = await requireLearnerPlacementAccess(context);
  requirePermission(context, "placements.read", { collegeId: member.collegeId });

  const journeys = await getLearnerPlacementJourney(context);
  const all = buildLearnerAssessmentResults(journeys);
  return { view, ...filterLearnerAssessmentResults(all, view) };
}
