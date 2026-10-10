import { randomUUID } from "node:crypto";
import {
  and,
  asc,
  desc,
  eq,
  or,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  cohorts,
  collegeMemberships,
  colleges,
  departments,
  learnerProgramEnrollments,
  membershipRoles,
  programs,
  sectionEnrollments,
  sections,
} from "@/db/schema";
import { placementEligibilityDecisions } from "@/db/schema/placement-access";
import {
  placementBatchLifecycles,
  placementEligibilityEvents,
} from "@/db/schema/placement-batches";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { requirePlacementManageScope } from "./scope";
import {
  getLearnerPlacementAccess,
  resolvePlacementParticipation,
  type PlacementScopeDecision,
} from "./batch-eligibility-policy";

const uuid = z.string().uuid();
const scopeType = z.enum(["MEMBERSHIP", "SECTION", "COHORT"]);
const status = z.enum(["ELIGIBLE", "INELIGIBLE", "NOT_DECIDED"]);
const scope = z.object({
  scopeType,
  scopeId: uuid,
}).strict();
const change = scope.extend({
  status,
  reason: z.string().trim().max(200).nullable().optional(),
  note: z.string().trim().max(300).nullable().optional(),
}).strict().superRefine((value, ctx) => {
  if (value.status === "INELIGIBLE" && !value.reason?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Ineligible decisions must include a reason",
      path: ["reason"],
    });
  }
});
const bulkInput = z.object({
  collegeId: uuid,
  changes: z.array(change).min(1).max(2000),
}).strict();
const undoInput = z.object({
  collegeId: uuid,
  actionId: uuid,
}).strict();
const cohortInput = z.object({
  collegeId: uuid,
  cohortId: uuid,
}).strict();
const batchSettingsInput = cohortInput.extend({
  registrationDeadline: z.coerce.date().nullable(),
  // null means inherit the college's placement rules, never an empty override.
  rulesOverride: z.record(z.string(), z.unknown()).nullable(),
}).strict();

type Scope = z.infer<typeof scope>;
type Client = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Client["transaction"]>[0]>[0];
type DecisionRow = typeof placementEligibilityDecisions.$inferSelect;

export class PlacementBatchError extends Error {
  constructor(public readonly code:
    | "DB08_SCOPE_NOT_FOUND"
    | "DB08_SCOPE_COLLEGE_MISMATCH"
    | "DB08_LEARNER_INACTIVE"
    | "DB08_BATCH_NOT_FOUND"
    | "DB08_ACTION_NOT_FOUND"
    | "DB08_ACTION_STALE"
    | "DB08_ACTION_INVALID"
    | "DB08_DUPLICATE_SCOPE"
    | "DB08_ACCESS_DENIED"
    | "DB08_AMBIGUOUS_ENROLLMENT") {
    super(code);
    this.name = "PlacementBatchError";
  }
}

function decisionView(row: DecisionRow | undefined): PlacementScopeDecision | null {
  return row ? {
    status: row.status as "ELIGIBLE" | "INELIGIBLE",
    reason: row.reason,
    note: row.note,
    decidedAt: row.decidedAt,
  } : null;
}

function canonicalDecision(input: z.infer<typeof change>) {
  const normalized: {
    status: "ELIGIBLE" | "INELIGIBLE" | null;
    reason: string | null;
    note: string | null;
  } = {
    status: input.status === "NOT_DECIDED" ? null : input.status,
    reason: input.status === "INELIGIBLE" ? input.reason?.trim() ?? null : null,
    note: input.status === "NOT_DECIDED" ? null : input.note?.trim() || null,
  };
  return normalized;
}

function sameDecision(
  left: { status: string | null; reason: string | null; note: string | null },
  right: { status: string | null; reason: string | null; note: string | null },
) {
  return left.status === right.status &&
    left.reason === right.reason && left.note === right.note;
}

/**
 * One college lock serializes all decision writers and undo operations,
 * including an absent scope row. This is deliberately conservative until
 * verified finer-grained locks and throughput benchmarks exist.
 */
async function lockCollege(tx: Tx, collegeId: string) {
  const [college] = await tx.select({ id: colleges.id })
    .from(colleges)
    .where(eq(colleges.id, collegeId))
    .for("update")
    .limit(1);
  if (!college) throw new PlacementBatchError("DB08_SCOPE_COLLEGE_MISMATCH");
}

async function resolveParentCollege(tx: Tx, item: Scope, requireActiveLearner = true) {
  if (item.scopeType === "MEMBERSHIP") {
    const [member] = await tx
      .select({ collegeId: collegeMemberships.collegeId, status: collegeMemberships.status })
      .from(collegeMemberships)
      .innerJoin(membershipRoles, and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "LEARNER"),
      ))
      .where(eq(collegeMemberships.id, item.scopeId))
      .limit(1);
    if (!member || (requireActiveLearner && member.status !== "ACTIVE")) {
      throw new PlacementBatchError("DB08_LEARNER_INACTIVE");
    }
    return member.collegeId;
  }

  if (item.scopeType === "SECTION") {
    const [row] = await tx.select({ collegeId: departments.collegeId })
      .from(sections)
      .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(eq(sections.id, item.scopeId))
      .limit(1);
    if (!row) throw new PlacementBatchError("DB08_SCOPE_NOT_FOUND");
    return row.collegeId;
  }

  const [row] = await tx.select({ collegeId: departments.collegeId })
    .from(cohorts)
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .where(eq(cohorts.id, item.scopeId))
    .limit(1);
  if (!row) throw new PlacementBatchError("DB08_SCOPE_NOT_FOUND");
  return row.collegeId;
}

async function assertTargetCollege(
  tx: Tx, collegeId: string, item: Scope, requireActiveLearner = true,
) {
  if (await resolveParentCollege(tx, item, requireActiveLearner) !== collegeId) {
    throw new PlacementBatchError("DB08_SCOPE_COLLEGE_MISMATCH");
  }
}

function byScope(item: Scope) {
  return and(
    eq(placementEligibilityDecisions.scopeType, item.scopeType),
    eq(placementEligibilityDecisions.scopeId, item.scopeId),
  );
}

async function readDecision(tx: Tx, collegeId: string, item: Scope) {
  const [row] = await tx.select().from(placementEligibilityDecisions)
    .where(and(
      eq(placementEligibilityDecisions.collegeId, collegeId),
      byScope(item),
    ))
    .limit(1);
  return row;
}

async function writeDecision(
  tx: Tx,
  collegeId: string,
  item: Scope,
  next: { status: "ELIGIBLE" | "INELIGIBLE" | null; reason: string | null; note: string | null },
  userId: string,
) {
  if (next.status === null) {
    await tx.delete(placementEligibilityDecisions).where(
      and(eq(placementEligibilityDecisions.collegeId, collegeId), byScope(item)),
    );
    return;
  }
  await tx.insert(placementEligibilityDecisions).values({
    collegeId,
    scopeType: item.scopeType,
    scopeId: item.scopeId,
    status: next.status,
    reason: next.reason,
    note: next.note,
    decidedByUserId: userId,
    decidedAt: new Date(),
  }).onConflictDoUpdate({
    target: [
      placementEligibilityDecisions.scopeType,
      placementEligibilityDecisions.scopeId,
    ],
    set: {
      status: next.status,
      reason: next.reason,
      note: next.note,
      decidedByUserId: userId,
      decidedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

async function appendEvent(tx: Tx, args: {
  collegeId: string;
  actionId: string;
  reversesActionId?: string;
  scopeType: Scope["scopeType"];
  scopeId: string;
  before: { status: string | null; reason: string | null; note: string | null };
  after: { status: string | null; reason: string | null; note: string | null };
  actorUserId: string;
}) {
  await tx.insert(placementEligibilityEvents).values({
    collegeId: args.collegeId,
    actionId: args.actionId,
    eventKind: args.reversesActionId ? "UNDO" : "DECIDE",
    reversesActionId: args.reversesActionId ?? null,
    scopeType: args.scopeType,
    scopeId: args.scopeId,
    beforeStatus: args.before.status,
    beforeReason: args.before.reason,
    beforeNote: args.before.note,
    afterStatus: args.after.status,
    afterReason: args.after.reason,
    afterNote: args.after.note,
    actorUserId: args.actorUserId,
  });
}

export async function decidePlacementParticipation(
  context: RequestContext,
  raw: unknown,
) {
  const input = bulkInput.parse(raw);
  await requirePlacementManageScope(context, input.collegeId);

  const seen = new Set<string>();
  for (const item of input.changes) {
    const key = `${item.scopeType}:${item.scopeId}`;
    if (seen.has(key)) throw new PlacementBatchError("DB08_DUPLICATE_SCOPE");
    seen.add(key);
  }

  const changes = [...input.changes].sort((a, b) =>
    a.scopeType.localeCompare(b.scopeType) || a.scopeId.localeCompare(b.scopeId));
  const actionId = randomUUID();

  return getDb().transaction(async (tx) => {
    await lockCollege(tx, input.collegeId);
    let changedCount = 0;
    for (const item of changes) {
      await assertTargetCollege(tx, input.collegeId, item);
      const current = await readDecision(tx, input.collegeId, item);
      const before = {
        status: current?.status ?? null,
        reason: current?.reason ?? null,
        note: current?.note ?? null,
      };
      const after = canonicalDecision(item);
      if (sameDecision(before, after)) continue;

      await writeDecision(tx, input.collegeId, item, after, context.user.id);
      await appendEvent(tx, {
        collegeId: input.collegeId,
        actionId,
        scopeType: item.scopeType,
        scopeId: item.scopeId,
        before,
        after,
        actorUserId: context.user.id,
      });
      changedCount++;
    }
    return { actionId: changedCount ? actionId : null, changedCount };
  });
}

/**
 * All-or-nothing bulk undo. A later event for ANY touched scope invalidates
 * the original bulk action; deleting and re-adding a decision does not evade
 * the stale guard because events are durable and monotonically sequenced.
 */
export async function undoPlacementParticipation(
  context: RequestContext,
  raw: unknown,
) {
  const input = undoInput.parse(raw);
  await requirePlacementManageScope(context, input.collegeId);
  return getDb().transaction(async (tx) => {
    await lockCollege(tx, input.collegeId);
    const original = await tx.select().from(placementEligibilityEvents)
      .where(and(
        eq(placementEligibilityEvents.collegeId, input.collegeId),
        eq(placementEligibilityEvents.actionId, input.actionId),
        eq(placementEligibilityEvents.eventKind, "DECIDE"),
      ))
      .orderBy(
        asc(placementEligibilityEvents.scopeType),
        asc(placementEligibilityEvents.scopeId),
      );

    if (!original.length) throw new PlacementBatchError("DB08_ACTION_NOT_FOUND");
    const actionId = randomUUID();

    // Check every touched scope FIRST, before modifying any current state.
    for (const event of original) {
      const [latest] = await tx.select().from(placementEligibilityEvents)
        .where(and(
          eq(placementEligibilityEvents.collegeId, input.collegeId),
          eq(placementEligibilityEvents.scopeType, event.scopeType),
          eq(placementEligibilityEvents.scopeId, event.scopeId),
        ))
        .orderBy(desc(placementEligibilityEvents.sequence))
        .limit(1);
      if (!latest || latest.actionId !== input.actionId || latest.id !== event.id) {
        throw new PlacementBatchError("DB08_ACTION_STALE");
      }
      const current = await readDecision(tx, input.collegeId, {
        scopeType: event.scopeType as Scope["scopeType"],
        scopeId: event.scopeId,
      });
      if (!sameDecision({
        status: current?.status ?? null,
        reason: current?.reason ?? null,
        note: current?.note ?? null,
      }, {
        status: event.afterStatus,
        reason: event.afterReason,
        note: event.afterNote,
      })) {
        throw new PlacementBatchError("DB08_ACTION_STALE");
      }
    }

    for (const event of original) {
      const item = {
        scopeType: event.scopeType as Scope["scopeType"],
        scopeId: event.scopeId,
      };
      // Undo of historic decisions must still work after learner suspension.
      await assertTargetCollege(tx, input.collegeId, item, false);
      const before = {
        status: event.afterStatus,
        reason: event.afterReason,
        note: event.afterNote,
      };
      const after = {
        status: event.beforeStatus,
        reason: event.beforeReason,
        note: event.beforeNote,
      };
      if (after.status !== null && after.status !== "ELIGIBLE" &&
          after.status !== "INELIGIBLE") {
        throw new PlacementBatchError("DB08_ACTION_INVALID");
      }
      await writeDecision(tx, input.collegeId, item, {
        status: after.status,
        reason: after.reason,
        note: after.note,
      }, context.user.id);
      await appendEvent(tx, {
        collegeId: input.collegeId,
        actionId,
        reversesActionId: input.actionId,
        scopeType: item.scopeType,
        scopeId: item.scopeId,
        before,
        after,
        actorUserId: context.user.id,
      });
    }
    return { actionId, reversesActionId: input.actionId, changedCount: original.length };
  });
}

async function assertCohortCollege(tx: Tx, collegeId: string, cohortId: string) {
  await assertTargetCollege(tx, collegeId, { scopeType: "COHORT", scopeId: cohortId });
}

export async function upsertPlacementBatchSettings(
  context: RequestContext,
  raw: unknown,
) {
  const input = batchSettingsInput.parse(raw);
  await requirePlacementManageScope(context, input.collegeId);
  return getDb().transaction(async (tx) => {
    await lockCollege(tx, input.collegeId);
    await assertCohortCollege(tx, input.collegeId, input.cohortId);
    const [current] = await tx.select()
      .from(placementBatchLifecycles)
      .where(eq(placementBatchLifecycles.cohortId, input.cohortId))
      .limit(1);
    if (current?.finishedAt) throw new PlacementBatchError("DB08_ACTION_INVALID");

    const [row] = await tx.insert(placementBatchLifecycles).values({
      cohortId: input.cohortId,
      collegeId: input.collegeId,
      registrationDeadline: input.registrationDeadline,
      rulesOverride: input.rulesOverride,
      createdByUserId: context.user.id,
      updatedByUserId: context.user.id,
    }).onConflictDoUpdate({
      target: placementBatchLifecycles.cohortId,
      set: {
        registrationDeadline: input.registrationDeadline,
        rulesOverride: input.rulesOverride,
        updatedByUserId: context.user.id,
        updatedAt: new Date(),
      },
    }).returning();
    return row;
  });
}

export async function markPlacementBatchInvited(
  context: RequestContext,
  raw: unknown,
) {
  const input = cohortInput.parse(raw);
  await requirePlacementManageScope(context, input.collegeId);
  return getDb().transaction(async (tx) => {
    await lockCollege(tx, input.collegeId);
    await assertCohortCollege(tx, input.collegeId, input.cohortId);
    const [current] = await tx.select().from(placementBatchLifecycles)
      .where(eq(placementBatchLifecycles.cohortId, input.cohortId)).limit(1);
    if (!current) throw new PlacementBatchError("DB08_BATCH_NOT_FOUND");
    if (current.finishedAt) throw new PlacementBatchError("DB08_ACTION_INVALID");
    if (current.invitedAt) return current;
    const [updated] = await tx.update(placementBatchLifecycles).set({
      invitedAt: new Date(),
      updatedByUserId: context.user.id,
      updatedAt: new Date(),
    }).where(eq(placementBatchLifecycles.cohortId, input.cohortId)).returning();
    return updated;
  });
}

export async function markPlacementBatchFinished(
  context: RequestContext,
  raw: unknown,
) {
  const input = cohortInput.parse(raw);
  await requirePlacementManageScope(context, input.collegeId);
  return getDb().transaction(async (tx) => {
    await lockCollege(tx, input.collegeId);
    await assertCohortCollege(tx, input.collegeId, input.cohortId);
    const [current] = await tx.select().from(placementBatchLifecycles)
      .where(eq(placementBatchLifecycles.cohortId, input.cohortId)).limit(1);
    if (!current) throw new PlacementBatchError("DB08_BATCH_NOT_FOUND");
    if (!current.invitedAt) throw new PlacementBatchError("DB08_ACTION_INVALID");
    if (current.finishedAt) return current;
    const [updated] = await tx.update(placementBatchLifecycles).set({
      finishedAt: new Date(),
      updatedByUserId: context.user.id,
      updatedAt: new Date(),
    }).where(eq(placementBatchLifecycles.cohortId, input.cohortId)).returning();
    return updated;
  });
}

/**
 * No eligibility reason, admin note, or scope source is returned to students.
 * This internal policy check does NOT yet wire every legacy application route.
 */
export async function getOwnPlacementParticipationAccess(context: RequestContext) {
  if (!hasMembershipRole(context, "LEARNER") || !context.membership ||
      context.user.platformStatus !== "ACTIVE") {
    throw new PlacementBatchError("DB08_ACCESS_DENIED");
  }
  const collegeId = context.membership.collegeId;
  const membershipId = context.membership.id;
  const [activeMembership] = await getDb()
    .select({
      collegeId: collegeMemberships.collegeId,
      status: collegeMemberships.status,
      userId: collegeMemberships.userId,
    })
    .from(collegeMemberships)
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(eq(collegeMemberships.id, membershipId)).limit(1);
  if (!activeMembership || activeMembership.status !== "ACTIVE" ||
      activeMembership.collegeId !== collegeId ||
      activeMembership.userId !== context.user.id) {
    return { showPlacements: false, canSelfApply: false };
  }
  const enrollments = await getDb().select({
    id: learnerProgramEnrollments.id,
    programId: learnerProgramEnrollments.programId,
    cohortId: learnerProgramEnrollments.cohortId,
    collegeId: departments.collegeId,
  }).from(learnerProgramEnrollments)
    .innerJoin(programs, eq(programs.id, learnerProgramEnrollments.programId))
    .innerJoin(cohorts, and(
      eq(cohorts.id, learnerProgramEnrollments.cohortId),
      eq(cohorts.programId, programs.id),
    ))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .where(and(
      eq(learnerProgramEnrollments.membershipId, membershipId),
      eq(learnerProgramEnrollments.status, "ACTIVE"),
    )).limit(2);
  // A corrupted duplicate active enrollment must never grant eligibility from
  // whichever cohort PostgreSQL happens to return first.
  if (enrollments.length !== 1 || enrollments[0].collegeId !== collegeId) {
    return { showPlacements: false, canSelfApply: false };
  }
  const enrollment = enrollments[0];
  const activeSections = await getDb().select({
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
  // Inconsistency or two current sections is ambiguous. Fail closed.
  if (activeSections.length > 1 ||
      (activeSections[0] &&
       (activeSections[0].cohortId !== enrollment.cohortId ||
        activeSections[0].status !== "ACTIVE"))) {
    return { showPlacements: false, canSelfApply: false };
  }
  const sectionId = activeSections[0]?.id;
  const relevantScopes = [
    { scopeType: "MEMBERSHIP", scopeId: membershipId },
    { scopeType: "COHORT", scopeId: enrollment.cohortId },
    ...(sectionId ? [{ scopeType: "SECTION", scopeId: sectionId }] : []),
  ];
  const eligibleRows = await getDb().select()
    .from(placementEligibilityDecisions)
    .where(and(
      eq(placementEligibilityDecisions.collegeId, collegeId),
      or(...relevantScopes.map((item) => and(
        eq(placementEligibilityDecisions.scopeType, item.scopeType),
        eq(placementEligibilityDecisions.scopeId, item.scopeId),
      ))),
    ));
  const matching = (scopeType: string, scopeId: string | undefined) =>
    decisionView(eligibleRows.find((row) =>
      row.scopeType === scopeType && row.scopeId === scopeId));
  const decision = resolvePlacementParticipation({
    learner: matching("MEMBERSHIP", membershipId),
    section: matching("SECTION", sectionId),
    cohort: matching("COHORT", enrollment.cohortId),
  });
  const [batch] = await getDb().select({
    finishedAt: placementBatchLifecycles.finishedAt,
  }).from(placementBatchLifecycles)
    .where(and(
      eq(placementBatchLifecycles.collegeId, collegeId),
      eq(placementBatchLifecycles.cohortId, enrollment.cohortId),
    )).limit(1);
  const modules = await resolveOptionalModuleAccess(context);
  return getLearnerPlacementAccess({
    collegeModuleEnabled: modules.placements.enabled,
    decision,
    batchFinished: Boolean(batch?.finishedAt),
  });
}
