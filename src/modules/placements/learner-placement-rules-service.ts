import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import {eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementCollegeRules} from "@/db/schema";
import {loadPlacementHeldOfferFacts} from "./held-offer-facts-service";
import {learnerCollegePlacementRulePoints} from "./learner-college-placement-rules-model";
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
  const [evidence, preferences, applications,policyRows] = await Promise.all([
    getOwnAcademicEvidence(context),
    getCandidatePreferences(context),
    getLearnerPlacementJourney(context),
    getDb().select({
      countsAsPlacedAt:placementCollegeRules.countsAsPlacedAt,
      maxHeldOffers:placementCollegeRules.maxHeldOffers,
      upliftPct:placementCollegeRules.upliftPct,
      minResponseHours:placementCollegeRules.minResponseHours,
    }).from(placementCollegeRules).where(eq(placementCollegeRules.collegeId,membership.collegeId)).limit(1),
  ]);
  const policy=policyRows[0]??null;
  const ownHeldOffers=policy?await loadPlacementHeldOfferFacts(membership.collegeId,membership.id):[];
  const policyView=policy?learnerCollegePlacementRulePoints(policy,ownHeldOffers):null;
  return {
    back,policyView,
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
