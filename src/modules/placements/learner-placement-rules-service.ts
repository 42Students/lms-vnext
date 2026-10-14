import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { getCandidatePreferences } from "./candidate-preferences-service";
import {getLearnerPlacementJourney} from "./learner-journey-service";
import { getOwnAcademicEvidence } from "./eligibility-service";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import {
  learnerPlacementPreparation,
  learnerRuleChangeApplicability,
  placementRulesBackLink,
} from "./learner-placement-rules-model";

/**
 * No college-wide rule inference. These reads are self-only through the
 * verified live learner membership and optional-module participation guard.
 */
export async function getOwnLearnerPlacementRulesView(
  context: RequestContext,
  rawQuery: unknown,
) {
  const back = placementRulesBackLink(rawQuery);
  const membership = await requireLearnerPlacementAccess(context);
  requirePermission(context, "placements.read", {
    collegeId: membership.collegeId,
    organizationId: membership.organizationId,
  });
  const [evidence, preferences, applications] = await Promise.all([
    getOwnAcademicEvidence(context),
    getCandidatePreferences(context),
    getLearnerPlacementJourney(context),
  ]);
  return {
    back,
    evidence,
    preferences,
    ruleApplicability:learnerRuleChangeApplicability(applications),
    preparation: learnerPlacementPreparation({
      evidence: evidence
        ? {
            cgpa: evidence.cgpa,
            activeBacklogs: evidence.activeBacklogs,
            gapYears: evidence.gapYears,
            source: evidence.source,
          }
        : null,
      preferences: {
        preferredRoleTitles: preferences.preferredRoleTitles,
        preferredLocations: preferences.preferredLocations,
      },
    }),
  };
}
