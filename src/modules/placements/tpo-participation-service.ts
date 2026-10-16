import "server-only";

import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  activityEvents,
  cohorts,
  collegeMemberships,
  colleges,
  departments,
  learnerProgramEnrollments,
  membershipRoles,
  programs,
  sectionEnrollments,
  sections,
  users,
  placementEligibilityDecisions,
  placementBatchLifecycles,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  resolvePlacementParticipation,
  type PlacementScopeDecision,
} from "./batch-eligibility-policy";
import {
  canonicalTpoParticipationChange,
  hasTpoDecisionChanged,
  isTpoDecisionSnapshotCurrent,
  snapshotTpoMembershipDecision,
  tpoParticipationChangeSchema,
  type TpoStoredDecision,
} from "./tpo-participation-model";
import { requirePlacementManageScope } from "./scope";
import { placementTableExists } from "./staged-tables";

const uuid = z.string().uuid();
type Client = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Client["transaction"]>[0]>[0];

export class TpoParticipationConflictError extends Error {
  constructor() {
    super("PARTICIPATION_DECISION_CHANGED");
    this.name = "TpoParticipationConflictError";
  }
}

function unavailable(): never {
  throw new AuthorizationError("placements.manage");
}

async function requireTpoCollege(context: RequestContext) {
  if (!context.membership || !hasMembershipRole(context, "TPO") ||
      context.user.platformStatus !== "ACTIVE") {
    return unavailable();
  }
  const college = await requirePlacementManageScope(
    context, context.membership.collegeId,
  );
  return college;
}

function toScopeDecision(
  value: {
    status: string; reason: string | null;
    note: string | null; decidedAt: Date;
  } | undefined,
): PlacementScopeDecision | null {
  if (!value || (value.status !== "ELIGIBLE" && value.status !== "INELIGIBLE")) {
    return null;
  }
  return {
    status: value.status,
    reason: value.reason,
    note: value.note,
    decidedAt: value.decidedAt,
  };
}

/**
 * This changes a registered membership eligibility OVERRIDE, not a
 * higher-studies registration choice. The latter is stored in DB08's
 * unregistered placement_batch_registrations table and is deliberately
 * unavailable until its migration and consent lifecycle are delivered.
 */
export async function getTpoLearnerParticipation(
  context: RequestContext,
  rawMembershipId: unknown,
) {
  const membershipId = uuid.parse(rawMembershipId);
  const college = await requireTpoCollege(context);
  const db = getDb();

  const [member] = await db.select({
    id: collegeMemberships.id,
    name: users.displayName,
  }).from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(and(
      eq(collegeMemberships.id, membershipId),
      eq(collegeMemberships.collegeId, college.id),
      eq(collegeMemberships.status, "ACTIVE"),
      eq(users.platformStatus, "ACTIVE"),
    )).limit(1);
  if (!member) return unavailable();

  const enrollments = await db.select({
    id: learnerProgramEnrollments.id,
    cohortId: learnerProgramEnrollments.cohortId,
    collegeId: departments.collegeId,
  }).from(learnerProgramEnrollments)
    .innerJoin(cohorts, and(
      eq(cohorts.id, learnerProgramEnrollments.cohortId),
      eq(cohorts.programId, learnerProgramEnrollments.programId),
    ))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .where(and(
      eq(learnerProgramEnrollments.membershipId, membershipId),
      eq(learnerProgramEnrollments.status, "ACTIVE"),
    )).limit(2);
  if (enrollments.length !== 1 || enrollments[0].collegeId !== college.id) {
    return unavailable();
  }
  const enrollment = enrollments[0];

  const currentSections = await db.select({
    id: sections.id,
    cohortId: sections.cohortId,
    status: sections.status,
  }).from(sectionEnrollments)
    .innerJoin(sections, and(
      eq(sections.id, sectionEnrollments.sectionId),
      eq(sections.academicPeriodId, sectionEnrollments.academicPeriodId),
    ))
    .where(and(
      eq(sectionEnrollments.learnerEnrollmentId, enrollment.id),
      eq(sectionEnrollments.status, "ACTIVE"),
    )).limit(2);
  if (currentSections.length > 1 ||
      (currentSections[0] &&
        (currentSections[0].cohortId !== enrollment.cohortId ||
         currentSections[0].status !== "ACTIVE"))) {
    return unavailable();
  }
  const sectionId = currentSections[0]?.id ?? null;

  const scopes = [
    { scopeType: "MEMBERSHIP", scopeId: membershipId },
    { scopeType: "COHORT", scopeId: enrollment.cohortId },
    ...(sectionId ? [{ scopeType: "SECTION", scopeId: sectionId }] : []),
  ];

  const decisions = await db.select({
    scopeType: placementEligibilityDecisions.scopeType,
    scopeId: placementEligibilityDecisions.scopeId,
    status: placementEligibilityDecisions.status,
    reason: placementEligibilityDecisions.reason,
    note: placementEligibilityDecisions.note,
    decidedAt: placementEligibilityDecisions.decidedAt,
    updatedAt: placementEligibilityDecisions.updatedAt,
  }).from(placementEligibilityDecisions)
    .where(and(
      eq(placementEligibilityDecisions.collegeId, college.id),
      or(...scopes.map((scope) => and(
        eq(placementEligibilityDecisions.scopeType, scope.scopeType),
        eq(placementEligibilityDecisions.scopeId, scope.scopeId),
      ))),
    ));

  const find = (scopeType: string, scopeId: string | null) =>
    decisions.find(row =>
      row.scopeType === scopeType && row.scopeId === scopeId);

  const direct = find("MEMBERSHIP", membershipId);
  const effective = resolvePlacementParticipation({
    learner: toScopeDecision(direct),
    section: toScopeDecision(find("SECTION", sectionId)),
    cohort: toScopeDecision(find("COHORT", enrollment.cohortId)),
  });

  return {
    membershipId,
    displayName: member.name?.trim() || "Unnamed learner",
    effective,
    direct: snapshotTpoMembershipDecision(
      direct && (direct.status === "ELIGIBLE" || direct.status === "INELIGIBLE")
        ? { ...direct, status: direct.status } : null,
    ),
  };
}

export async function decideTpoLearnerParticipation(
  context: RequestContext,
  rawMembershipId: unknown,
  rawInput: unknown,
) {
  const membershipId = uuid.parse(rawMembershipId);
  const input = tpoParticipationChangeSchema.parse(rawInput);
  const college = await requireTpoCollege(context);

  // The complete existing learner/cohort/section check runs before the
  // transaction; membership and enrollment are re-checked under the lock.
  await getTpoLearnerParticipation(context, membershipId);

  const desired = canonicalTpoParticipationChange(input);
  return getDb().transaction(async (tx: Tx) => {
    const [locked] = await tx.select({ id: colleges.id })
      .from(colleges).where(eq(colleges.id, college.id))
      .for("update").limit(1);
    if (!locked) return unavailable();

    const [member] = await tx.select({
      id: collegeMemberships.id,
    }).from(collegeMemberships)
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .innerJoin(membershipRoles, and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "LEARNER"),
      ))
      .where(and(
        eq(collegeMemberships.id, membershipId),
        eq(collegeMemberships.collegeId, college.id),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(users.platformStatus, "ACTIVE"),
      )).limit(1);
    if (!member) return unavailable();

    const enrollments = await tx.select({
      collegeId: departments.collegeId,
      cohortId: learnerProgramEnrollments.cohortId,
    }).from(learnerProgramEnrollments)
      .innerJoin(cohorts, and(
        eq(cohorts.id, learnerProgramEnrollments.cohortId),
        eq(cohorts.programId, learnerProgramEnrollments.programId),
      ))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(and(
        eq(learnerProgramEnrollments.membershipId, membershipId),
        eq(learnerProgramEnrollments.status, "ACTIVE"),
      )).limit(2);
    if (enrollments.length !== 1 || enrollments[0].collegeId !== college.id) {
      return unavailable();
    }

    if (await placementTableExists("placement_batch_lifecycles")) {
      const [batchLifecycle] = await tx.select({finishedAt:placementBatchLifecycles.finishedAt})
        .from(placementBatchLifecycles)
        .where(and(eq(placementBatchLifecycles.collegeId,college.id),
          eq(placementBatchLifecycles.cohortId,enrollments[0].cohortId)))
        .limit(1);
      if (batchLifecycle?.finishedAt) throw new TpoParticipationConflictError();
    }

    const [current] = await tx.select().from(placementEligibilityDecisions)
      .where(and(
        eq(placementEligibilityDecisions.collegeId, college.id),
        eq(placementEligibilityDecisions.scopeType, "MEMBERSHIP"),
        eq(placementEligibilityDecisions.scopeId, membershipId),
      )).limit(1);

    const actual = snapshotTpoMembershipDecision(
      current && (current.status === "ELIGIBLE" || current.status === "INELIGIBLE")
        ? { ...current, status: current.status } : null,
    );

    if (!isTpoDecisionSnapshotCurrent(actual, input.expected)) {
      throw new TpoParticipationConflictError();
    }

    const before: TpoStoredDecision = {
      status: actual.status,
      reason: actual.reason,
      note: actual.note,
    };
    if (!hasTpoDecisionChanged(before, desired)) {
      return { changed: false, direct: actual };
    }

    const timestamp = new Date();
    if (desired.status === null) {
      await tx.delete(placementEligibilityDecisions).where(and(
        eq(placementEligibilityDecisions.collegeId, college.id),
        eq(placementEligibilityDecisions.scopeType, "MEMBERSHIP"),
        eq(placementEligibilityDecisions.scopeId, membershipId),
      ));
    } else {
      await tx.insert(placementEligibilityDecisions).values({
        collegeId: college.id,
        scopeType: "MEMBERSHIP",
        scopeId: membershipId,
        status: desired.status,
        reason: desired.reason,
        note: desired.note,
        decidedByUserId: context.user.id,
        decidedAt: timestamp,
        updatedAt: timestamp,
      }).onConflictDoUpdate({
        target: [
          placementEligibilityDecisions.scopeType,
          placementEligibilityDecisions.scopeId,
        ],
        set: {
          status: desired.status,
          reason: desired.reason,
          note: desired.note,
          decidedByUserId: context.user.id,
          decidedAt: timestamp,
          updatedAt: timestamp,
        },
      });
    }

    // The registered activity log is durable and transactionally atomic
    // with the decision. Never copy free-text reason/note to activity metadata.
    await tx.insert(activityEvents).values({
      collegeId: college.id,
      organizationId: college.organizationId,
      actorUserId: context.user.id,
      actorMembershipId: context.membership!.id,
      module: "PLACEMENTS",
      eventType: "placements.participation.decided",
      importance: "NORMAL",
      subjectType: "COLLEGE_MEMBERSHIP",
      subjectId: membershipId,
      summary: "TPO changed learner placement participation eligibility",
      metadata: {
        scopeType: "MEMBERSHIP",
        previousStatus: before.status ?? "NOT_DECIDED",
        nextStatus: desired.status ?? "NOT_DECIDED",
        reasonChanged: before.reason !== desired.reason,
        noteChanged: before.note !== desired.note,
      },
    });

    return {
      changed: true,
      direct: desired.status === null
        ? snapshotTpoMembershipDecision(null)
        : snapshotTpoMembershipDecision({
          ...desired, updatedAt: timestamp,
        }),
    };
  });
}
