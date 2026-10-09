/**
 * DB08: latest legacy V188 inheritance contract, intentionally independent
 * of the database writer. The service that loads the active section/cohort,
 * membership and decisions must still enforce tenant scope and authorization.
 *
 * Do not substitute job-specific eligibility for this placement participation gate.
 */
export type PlacementParticipationStatus =
  | "ELIGIBLE"
  | "INELIGIBLE"
  | "NOT_DECIDED";

export type PlacementDecisionLevel = "LEARNER" | "CLASS" | "BATCH";

export type PlacementScopeDecision = {
  status: Exclude<PlacementParticipationStatus, "NOT_DECIDED">;
  reason: string | null;
  note: string | null;
  decidedAt: Date;
};

export type PlacementDecisionHierarchy = {
  learner: PlacementScopeDecision | null;
  section: PlacementScopeDecision | null;
  cohort: PlacementScopeDecision | null;
};

export type ResolvedPlacementParticipation = {
  status: PlacementParticipationStatus;
  level: PlacementDecisionLevel | null;
  reason: string | null;
  note: string | null;
  decidedAt: Date | null;
};

const EMPTY_DECISION: ResolvedPlacementParticipation = {
  status: "NOT_DECIDED",
  level: null,
  reason: null,
  note: null,
  decidedAt: null,
};

/** Learner > class/section > academic batch/cohort; absent means NOT_DECIDED. */
export function resolvePlacementParticipation(
  hierarchy: PlacementDecisionHierarchy,
): ResolvedPlacementParticipation {
  const winner = hierarchy.learner
    ? { level: "LEARNER" as const, value: hierarchy.learner }
    : hierarchy.section
      ? { level: "CLASS" as const, value: hierarchy.section }
      : hierarchy.cohort
        ? { level: "BATCH" as const, value: hierarchy.cohort }
        : null;

  if (!winner) return { ...EMPTY_DECISION };
  return {
    status: winner.value.status,
    level: winner.level,
    reason: winner.value.reason,
    note: winner.value.note,
    decidedAt: winner.value.decidedAt,
  };
}

/**
 * Only non-sensitive booleans may be exposed to the learner.
 * Reasons and decision levels are for authorized placement administrators only.
 *
 * A finished cohort is historical: a manager may explicitly add a student to a
 * drive, but the learner cannot self-apply to new drives.
 */
export function getLearnerPlacementAccess(input: {
  collegeModuleEnabled: boolean;
  decision: ResolvedPlacementParticipation;
  batchFinished: boolean;
}): {
  showPlacements: boolean;
  canSelfApply: boolean;
} {
  const showPlacements =
    input.collegeModuleEnabled &&
    input.decision.status === "ELIGIBLE";
  return {
    showPlacements,
    canSelfApply: showPlacements && !input.batchFinished,
  };
}

/**
 * Coordinators have a separate **limited** Drive Day authorization; it must
 * never grant general placement self-service or management permissions.
 */
export function canUseCoordinatorDriveDay(input: {
  collegeModuleEnabled: boolean;
  hasActiveCoordinatorAssignment: boolean;
}): boolean {
  return input.collegeModuleEnabled && input.hasActiveCoordinatorAssignment;
}
