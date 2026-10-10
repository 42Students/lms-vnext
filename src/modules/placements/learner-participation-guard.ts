import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  cohorts,
  collegeMemberships,
  departments,
  learnerProgramEnrollments,
  membershipRoles,
  programs,
  sectionEnrollments,
  sections,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import {
  type ModuleAccessScope,
  resolveOptionalModuleAccessForChain,
} from "@/modules/module-access/service";
import { AuthorizationError } from "@/modules/permissions/policy";
import { resolveLearnerPlacementParticipation } from "./access-service";

type PlacementMembership = NonNullable<RequestContext["membership"]>;

/**
 * Legacy V188: the paid college Placements module AND inherited placement
 * eligibility must both allow access. A job-level INCLUDE override is never
 * sufficient to turn on the learner's Placements area.
 */
export function canUseLearnerPlacements(input: {
  moduleEnabled: boolean;
  participation: "ELIGIBLE" | "INELIGIBLE" | "NOT_DECIDED";
}): boolean {
  return input.moduleEnabled && input.participation === "ELIGIBLE";
}

/**
 * A pre-DB08-migration fail-closed guard for all learner placement reads and
 * writes. Uses the already journaled 0035 current eligibility decisions;
 * no unregistered DB08 table is needed.
 *
 * The caller must separately enforce the job/application's own state and,
 * after W01's DB08 lifecycle migration, the finished-batch self-apply rule.
 * This is NOT a coordinator Drive Day entitlement.
 */
export async function requireLearnerPlacementAccess(
  context: RequestContext,
): Promise<PlacementMembership> {
  const membership = context.membership;
  if (
    !membership ||
    !hasMembershipRole(context, "LEARNER") ||
    membership.status !== "ACTIVE" ||
    context.user.platformStatus !== "ACTIVE"
  ) {
    throw new AuthorizationError("placements.read");
  }

  const db = getDb();
  const [authorized] = await db.select({
    collegeId: collegeMemberships.collegeId,
    userId: collegeMemberships.userId,
    status: collegeMemberships.status,
  }).from(collegeMemberships)
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(eq(collegeMemberships.id, membership.id))
    .limit(1);
  if (!authorized || authorized.status !== "ACTIVE" ||
      authorized.userId !== context.user.id ||
      authorized.collegeId !== membership.collegeId) {
    throw new AuthorizationError("placements.read");
  }

  // Two active enrollments, a missing enrollment or a cross-college program
  // are ambiguous; do not pick one with LIMIT 1 and expose another batch.
  const enrollments = await db.select({
    id: learnerProgramEnrollments.id,
    cohortId: learnerProgramEnrollments.cohortId,
    programId: programs.id,
    departmentId: departments.id,
    collegeId: departments.collegeId,
  }).from(learnerProgramEnrollments)
    .innerJoin(cohorts, and(
      eq(cohorts.id, learnerProgramEnrollments.cohortId),
      eq(cohorts.programId, learnerProgramEnrollments.programId),
    ))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .where(and(
      eq(learnerProgramEnrollments.membershipId, membership.id),
      eq(learnerProgramEnrollments.status, "ACTIVE"),
    )).limit(2);
  if (enrollments.length !== 1 ||
      enrollments[0].collegeId !== membership.collegeId) {
    throw new AuthorizationError("placements.read");
  }
  const current = enrollments[0];

  const currentSections = await db.select({
    id: sections.id,
    cohortId: sections.cohortId,
  }).from(sectionEnrollments)
    .innerJoin(sections, and(
      eq(sections.id, sectionEnrollments.sectionId),
      eq(sections.academicPeriodId, sectionEnrollments.academicPeriodId),
    ))
    .where(and(
      eq(sectionEnrollments.learnerEnrollmentId, current.id),
      eq(sectionEnrollments.status, "ACTIVE"),
    )).limit(2);
  if (currentSections.length > 1 ||
      (currentSections[0] &&
       currentSections[0].cohortId !== current.cohortId)) {
    throw new AuthorizationError("placements.read");
  }

  const chain: ModuleAccessScope[] = [
    { scopeType: "MEMBERSHIP", scopeId: membership.id },
    ...(currentSections[0] ? [{
      scopeType: "SECTION" as const, scopeId: currentSections[0].id,
    }] : []),
    { scopeType: "COHORT", scopeId: current.cohortId },
    { scopeType: "PROGRAM", scopeId: current.programId },
    { scopeType: "DEPARTMENT", scopeId: current.departmentId },
    { scopeType: "COLLEGE", scopeId: membership.collegeId },
    { scopeType: "ORGANIZATION", scopeId: membership.organizationId },
    { scopeType: "GLOBAL", scopeId: null },
  ];

  const [modules, participation] = await Promise.all([
    resolveOptionalModuleAccessForChain(chain),
    resolveLearnerPlacementParticipation(context, chain),
  ]);
  if (!canUseLearnerPlacements({
    moduleEnabled: modules.placements.enabled,
    participation: participation.status,
  })) {
    // A learner must never receive the internal eligibility reason or note.
    throw new AuthorizationError("placements.read");
  }
  return membership;
}
