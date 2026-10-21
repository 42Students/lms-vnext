import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {learnerProgramEnrollments,placementCollegeRules} from "@/db/schema";
import {placementBatchLifecycles} from "@/db/schema/placement-batches";
import {effectiveTpoBatchRuleFields,tpoBatchRuleOverridesSchema} from "./tpo-batch-rules-model";
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
  const [evidence, preferences, applications,policyRows,activeEnrollments] = await Promise.all([
    getOwnAcademicEvidence(context),
    getCandidatePreferences(context),
    getLearnerPlacementJourney(context),
    getDb().select({
      countsAsPlacedAt:placementCollegeRules.countsAsPlacedAt,
      maxHeldOffers:placementCollegeRules.maxHeldOffers,
      upliftPct:placementCollegeRules.upliftPct,
      minResponseHours:placementCollegeRules.minResponseHours,
    }).from(placementCollegeRules).where(eq(placementCollegeRules.collegeId,membership.collegeId)).limit(1),
    getDb().select({cohortId:learnerProgramEnrollments.cohortId})
      .from(learnerProgramEnrollments).where(and(
        eq(learnerProgramEnrollments.membershipId,membership.id),
        eq(learnerProgramEnrollments.status,"ACTIVE"),
      )).limit(2),
  ]);
  const cohortId=activeEnrollments.length===1?activeEnrollments[0]!.cohortId:null;
  const [batch]=cohortId?await getDb().select({
    rulesOverride:placementBatchLifecycles.rulesOverride,
    updatedAt:placementBatchLifecycles.updatedAt,
  }).from(placementBatchLifecycles).where(and(
    eq(placementBatchLifecycles.cohortId,cohortId),
    eq(placementBatchLifecycles.collegeId,membership.collegeId),
  )).limit(1):[];
  const basePolicy=policyRows[0]??null;
  const validatedOverride=tpoBatchRuleOverridesSchema.safeParse(batch?.rulesOverride??null);
  const hasOverride=validatedOverride.success&&Object.keys(validatedOverride.data).length>0;
  const policy=basePolicy?effectiveTpoBatchRuleFields(basePolicy,batch?.rulesOverride):null;
  const ownHeldOffers=policy?await loadPlacementHeldOfferFacts(membership.collegeId,membership.id):[];
  const policyView=policy?learnerCollegePlacementRulePoints(policy,ownHeldOffers):null;
  return {
    back,policyView,
    effectivePolicySource:hasOverride?"BATCH_OVERRIDE":"COLLEGE",
    effectivePolicyUpdatedAt:hasOverride?batch?.updatedAt.toISOString()??null:null,
    evidence,
    preferences,
    ruleApplicability:policy?{
      ...learnerRuleChangeApplicability(applications),
      message:hasOverride?"Your placement batch's rules override the college defaults where specified. Saved applications are not changed retroactively.":"Your college's current placement policy is recorded below. Any rule changes must be reviewed by the placement cell; this view does not infer retroactive changes to saved applications.",
    }:learnerRuleChangeApplicability(applications),
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
