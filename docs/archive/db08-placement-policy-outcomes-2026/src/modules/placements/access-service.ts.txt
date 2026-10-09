import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementEligibilityDecisions } from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import type { ModuleAccessScope } from "@/modules/module-access/service";
import { AuthorizationError } from "@/modules/permissions/policy";

export type PlacementParticipationStatus =
  | "ELIGIBLE"
  | "INELIGIBLE"
  | "NOT_DECIDED";

export type PlacementEligibilityDecision = {
  scopeType: string;
  scopeId: string;
  status: string;
  reason: string | null;
  note: string | null;
};

export type ResolvedPlacementParticipation = {
  status: PlacementParticipationStatus;
  level: "MEMBERSHIP" | "SECTION" | "COHORT" | null;
  reason: string | null;
  note: string | null;
};

const ELIGIBILITY_LEVELS = new Set([
  "MEMBERSHIP",
  "SECTION",
  "COHORT",
]);

export function resolvePlacementParticipationFromDecisions(
  chain: readonly ModuleAccessScope[],
  decisions: readonly PlacementEligibilityDecision[],
): ResolvedPlacementParticipation {
  // Legacy V188: the most specific decision wins. Do not rely on
  // callers to supply the module-access chain in precedence order.
  for (const level of ["MEMBERSHIP", "SECTION", "COHORT"] as const) {
    const scope = chain.find(
      (item) => item.scopeType === level && Boolean(item.scopeId),
    );
    if (!scope) continue;

    const decision = decisions.find(
      (item) =>
        item.scopeType === level && item.scopeId === scope.scopeId,
    );

    if (
      decision?.status === "ELIGIBLE" ||
      decision?.status === "INELIGIBLE"
    ) {
      return {
        status: decision.status,
        level,
        reason: decision.reason,
        note: decision.note,
      };
    }
  }

  return {
    status: "NOT_DECIDED",
    level: null,
    reason: null,
    note: null,
  };
}

export async function resolveLearnerPlacementParticipation(
  context: RequestContext,
  chain: readonly ModuleAccessScope[],
) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "LEARNER")
  ) {
    throw new AuthorizationError("placements.read");
  }

  const ids = chain
    .filter(
      (scope) =>
        ELIGIBILITY_LEVELS.has(scope.scopeType) &&
        Boolean(scope.scopeId),
    )
    .map((scope) => scope.scopeId!);

  if (ids.length === 0) {
    return resolvePlacementParticipationFromDecisions(chain, []);
  }

  const rows = await getDb()
    .select({
      scopeType: placementEligibilityDecisions.scopeType,
      scopeId: placementEligibilityDecisions.scopeId,
      status: placementEligibilityDecisions.status,
      reason: placementEligibilityDecisions.reason,
      note: placementEligibilityDecisions.note,
    })
    .from(placementEligibilityDecisions)
    .where(
      and(
        eq(
          placementEligibilityDecisions.collegeId,
          context.membership.collegeId,
        ),
        inArray(placementEligibilityDecisions.scopeId, ids),
      ),
    );

  return resolvePlacementParticipationFromDecisions(chain, rows);
}
