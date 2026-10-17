import { randomUUID } from "node:crypto";
import { formatBatchRegistrationNotice } from "./tpo-batch-notification-model";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  or,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  activityEvents,
  inAppNotifications,
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
  placementApplications,
} from "@/db/schema";
import { placementEligibilityDecisions } from "@/db/schema/placement-access";
import {
  placementBatchLifecycles,
  placementEligibilityEvents,
} from "@/db/schema/placement-batches";
import { placementBatchRegistrations } from "@/db/schema/placement-registration";
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
  expectedVersion: z.string().min(1).max(80).optional(),
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
  changes: z.array(change).min(1).max(5000),
  expectedCohortId: uuid.optional(),
}).strict();
const undoInput = z.object({
  collegeId: uuid,
  actionId: uuid,
}).strict();
const cohortInput = z.object({
  collegeId: uuid,
  cohortId: uuid,
}).strict();
const inviteCohortInput = cohortInput.extend({
  expectedVersion: z.string().min(1).max(80).optional(),
  registrationDeadline: z.coerce.date().optional(),
}).strict();
const batchSettingsInput = cohortInput.extend({
  registrationDeadline: z.coerce.date().nullable(),
  // null means inherit the college's placement rules, never an empty override.
  rulesOverride: z.record(z.string(), z.unknown()).nullable(),
  expectedVersion: z.string().min(1).max(80).optional(),
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
    | "DB08_NO_ELIGIBLE_STUDENTS"
    | "DB08_ACTION_NOT_FOUND"
    | "DB08_ACTION_STALE"
    | "DB08_ACTION_INVALID"
    | "DB08_DUPLICATE_SCOPE"
    | "DB08_ACCESS_DENIED"
    | "DB08_AMBIGUOUS_ENROLLMENT"
    | "DB08_BATCH_FINISHED") {
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
    if (input.expectedCohortId) {
      const [lifecycle] = await tx.select({ finishedAt: placementBatchLifecycles.finishedAt })
        .from(placementBatchLifecycles)
        .where(and(eq(placementBatchLifecycles.collegeId, input.collegeId),
          eq(placementBatchLifecycles.cohortId, input.expectedCohortId)))
        .limit(1);
      if (lifecycle?.finishedAt) throw new PlacementBatchError("DB08_BATCH_FINISHED");
    }
    let changedCount = 0;
    for (const item of changes) {
      await assertTargetCollege(tx, input.collegeId, item);
      if (input.expectedCohortId && item.scopeType === "MEMBERSHIP") {
        const [activeEnrollment] = await tx.select({ id: learnerProgramEnrollments.id })
          .from(learnerProgramEnrollments)
          .where(and(
            eq(learnerProgramEnrollments.membershipId, item.scopeId),
            eq(learnerProgramEnrollments.cohortId, input.expectedCohortId),
            eq(learnerProgramEnrollments.status, "ACTIVE"),
          )).limit(1);
        if (!activeEnrollment) throw new PlacementBatchError("DB08_ACTION_STALE");
      }
      const current = await readDecision(tx, input.collegeId, item);
      const before = {
        status: current?.status ?? null,
        reason: current?.reason ?? null,
        note: current?.note ?? null,
      };
      if (item.expectedVersion !== undefined &&
          (current?.updatedAt.toISOString() ?? "none") !== item.expectedVersion) {
        throw new PlacementBatchError("DB08_ACTION_STALE");
      }
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
    if (input.expectedVersion !== undefined &&
        (current?.updatedAt.toISOString() ?? "none") !== input.expectedVersion)
      throw new PlacementBatchError("DB08_ACTION_STALE");
    const now = new Date();
    const reopenAndTell = Boolean(
      current?.invitedAt && current.registrationDeadline &&
      current.registrationDeadline.getTime() <= now.getTime() &&
      input.registrationDeadline &&
      input.registrationDeadline.getTime() > now.getTime(),
    );

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
    if(JSON.stringify(current?.rulesOverride??{})!==JSON.stringify(input.rulesOverride??{})){
      const [college]=await tx.select({organizationId:colleges.organizationId})
        .from(colleges).where(eq(colleges.id,input.collegeId)).limit(1);
      if(!college)throw new PlacementBatchError("DB08_SCOPE_COLLEGE_MISMATCH");
      await tx.insert(activityEvents).values({
        organizationId:college.organizationId,collegeId:input.collegeId,
        actorUserId:context.user.id,actorMembershipId:context.membership?.id??null,
        module:"PLACEMENTS",eventType:"placements.batch.rules.changed",
        subjectType:"COHORT",subjectId:input.cohortId,
        summary:"TPO updated batch-specific placement rules",
        metadata:{changedKeys:Object.keys(input.rulesOverride??{})},
      });
    }
    if (reopenAndTell) {
      const recipientUserIds = await findUnchosenEligibleBatchStudents(
        tx, input.collegeId, input.cohortId,
      );
      const [college] = await tx.select({ organizationId: colleges.organizationId })
        .from(colleges).where(eq(colleges.id, input.collegeId)).limit(1);
      if (!college) throw new PlacementBatchError("DB08_SCOPE_COLLEGE_MISMATCH");
      const [event] = await tx.insert(activityEvents).values({
        organizationId: college.organizationId,
        collegeId: input.collegeId,
        actorUserId: context.user.id,
        actorMembershipId: context.membership?.id ?? null,
        module: "PLACEMENTS",
        eventType: "BATCH_REGISTRATION_REOPENED",
        subjectType: "COHORT",
        subjectId: input.cohortId,
        summary: "TPO reopened placement registration with a new deadline",
        metadata: {
          registrationDeadline: row.registrationDeadline?.toISOString() ?? null,
          appRecipients: recipientUserIds.length,
        },
      }).returning({ id: activityEvents.id });
      if (!event) throw new PlacementBatchError("DB08_ACTION_INVALID");
      const [cohort] = await tx.select({name:cohorts.name})
        .from(cohorts).where(eq(cohorts.id,input.cohortId)).limit(1);
      if(!cohort)throw new PlacementBatchError("DB08_BATCH_NOT_FOUND");
      const notice = formatBatchRegistrationNotice(cohort.name,row.registrationDeadline!,true);
      for (let offset = 0; offset < recipientUserIds.length; offset += 200) {
        await tx.insert(inAppNotifications).values(
          recipientUserIds.slice(offset, offset + 200).map(userId => ({
            userId, eventId: event.id,
            title: notice.title,
            body: notice.body,
            actionHref: "/learn/my-placements/placement#registration",
          })),
        ).onConflictDoNothing();
      }
    }
    return row;
  });
}


/**
 * Only eligible, active learners who have neither made an outcome choice nor
 * applied to a drive receive the first invite. The college row lock used by
 * DB08 decisions/registrations is already held by the caller.
 */
export async function findUnchosenEligibleBatchStudents(
  tx: Tx, collegeId: string, cohortId: string, includeChosen = false,
) {
  const roster = await tx.select({
    membershipId: collegeMemberships.id,
    enrollmentId: learnerProgramEnrollments.id,
    userId: users.id,
  }).from(learnerProgramEnrollments)
    .innerJoin(collegeMemberships, eq(collegeMemberships.id, learnerProgramEnrollments.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(and(
      eq(learnerProgramEnrollments.cohortId, cohortId),
      eq(learnerProgramEnrollments.status, "ACTIVE"),
      eq(collegeMemberships.collegeId, collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
      eq(users.platformStatus, "ACTIVE"),
    ));
  if (roster.length === 0) return [];
  const memberIds = roster.map(row => row.membershipId);
  const enrollmentIds = roster.map(row => row.enrollmentId);
  const sectionRows = await tx.select({
    enrollmentId: sectionEnrollments.learnerEnrollmentId,
    sectionId: sections.id,
  }).from(sectionEnrollments)
    .innerJoin(sections, and(
      eq(sections.id, sectionEnrollments.sectionId),
      eq(sections.cohortId, cohortId),
      eq(sections.status, "ACTIVE"),
    ))
    .where(and(eq(sectionEnrollments.status, "ACTIVE"),
      inArray(sectionEnrollments.learnerEnrollmentId, enrollmentIds)));
  const sectionIds = sectionRows.map(row => row.sectionId);
  const decisions = await tx.select().from(placementEligibilityDecisions).where(and(
    eq(placementEligibilityDecisions.collegeId, collegeId),
    inArray(placementEligibilityDecisions.scopeId, [cohortId, ...memberIds, ...sectionIds]),
  ));
  const registrations = await tx.select({ membershipId: placementBatchRegistrations.membershipId })
    .from(placementBatchRegistrations)
    .where(and(eq(placementBatchRegistrations.collegeId, collegeId),
      eq(placementBatchRegistrations.cohortId, cohortId),
      inArray(placementBatchRegistrations.membershipId, memberIds)));
  const applications = await tx.select({ membershipId: placementApplications.membershipId })
    .from(placementApplications)
    .where(inArray(placementApplications.membershipId, memberIds));
  const alreadyChosen = new Set([
    ...registrations.map(row => row.membershipId),
    ...applications.map(row => row.membershipId),
  ]);
  const decisionsByScope = new Map(
    decisions.map(row => [row.scopeType + ":" + row.scopeId, row] as const),
  );
  const sectionsByEnrollment = new Map<string, string[]>();
  for (const row of sectionRows) {
    sectionsByEnrollment.set(row.enrollmentId,
      [...(sectionsByEnrollment.get(row.enrollmentId) ?? []), row.sectionId]);
  }
  const decisionFor = (scopeType: string, scopeId: string | null) => {
    const row = scopeId ? decisionsByScope.get(scopeType + ":" + scopeId) : undefined;
    return decisionView(row);
  };
  return roster.flatMap(row => {
    if (!includeChosen && alreadyChosen.has(row.membershipId)) return [];
    const activeSections = sectionsByEnrollment.get(row.enrollmentId) ?? [];
    if (activeSections.length > 1) return [];
    const resolved = resolvePlacementParticipation({
      learner: decisionFor("MEMBERSHIP", row.membershipId),
      section: decisionFor("SECTION", activeSections[0] ?? null),
      cohort: decisionFor("COHORT", cohortId),
    });
    return resolved.status === "ELIGIBLE" ? [row.userId] : [];
  });
}

export async function markPlacementBatchInvited(
  context: RequestContext,
  raw: unknown,
) {
  const input = inviteCohortInput.parse(raw);
  await requirePlacementManageScope(context, input.collegeId);
  return getDb().transaction(async (tx) => {
    await lockCollege(tx, input.collegeId);
    await assertCohortCollege(tx, input.collegeId, input.cohortId);
    const [current] = await tx.select().from(placementBatchLifecycles)
      .where(and(eq(placementBatchLifecycles.cohortId, input.cohortId),
        eq(placementBatchLifecycles.collegeId, input.collegeId))).limit(1);
    if (input.expectedVersion !== undefined &&
        (current?.updatedAt.toISOString() ?? "none") !== input.expectedVersion)
      throw new PlacementBatchError("DB08_ACTION_STALE");
    if (current?.finishedAt) throw new PlacementBatchError("DB08_ACTION_INVALID");
    if (current?.invitedAt) return { ...current, notifiedCount: 0 };
    const deadline = input.registrationDeadline ?? current?.registrationDeadline ?? null;
    if (!deadline || deadline.getTime() <= Date.now())
      throw new PlacementBatchError("DB08_ACTION_INVALID");

    // Legacy allows opening the registration window when every eligible learner
    // has already chosen. It refuses only when nobody is eligible at all.
    const eligible = await findUnchosenEligibleBatchStudents(
      tx, input.collegeId, input.cohortId, true,
    );
    if (eligible.length === 0)
      throw new PlacementBatchError("DB08_NO_ELIGIBLE_STUDENTS");
    const recipientUserIds = await findUnchosenEligibleBatchStudents(
      tx, input.collegeId, input.cohortId,
    );
    const now = new Date();
    const [updated] = current
      ? await tx.update(placementBatchLifecycles).set({
          registrationDeadline: deadline, invitedAt: now,
          updatedByUserId: context.user.id, updatedAt: now,
        }).where(and(eq(placementBatchLifecycles.cohortId, input.cohortId),
          eq(placementBatchLifecycles.collegeId, input.collegeId))).returning()
      : await tx.insert(placementBatchLifecycles).values({
          cohortId: input.cohortId, collegeId: input.collegeId,
          registrationDeadline: deadline, invitedAt: now,
          rulesOverride: null,
          createdByUserId: context.user.id, updatedByUserId: context.user.id,
        }).returning();
    if (!updated) throw new PlacementBatchError("DB08_BATCH_NOT_FOUND");
    const [college] = await tx.select({ organizationId: colleges.organizationId })
      .from(colleges).where(eq(colleges.id, input.collegeId)).limit(1);
    if (!college) throw new PlacementBatchError("DB08_SCOPE_COLLEGE_MISMATCH");
    const [invitationEvent] = await tx.insert(activityEvents).values({
      organizationId: college.organizationId,
      collegeId: input.collegeId,
      actorUserId: context.user.id,
      actorMembershipId: context.membership?.id ?? null,
      module: "PLACEMENTS", eventType: "BATCH_INVITED",
      subjectType: "COHORT", subjectId: input.cohortId,
      summary: "TPO opened placement registration for a batch",
      metadata: {
        registrationDeadline: updated.registrationDeadline?.toISOString() ?? null,
        appRecipients: recipientUserIds.length,
      },
    }).returning({ id: activityEvents.id });
    if (!invitationEvent) throw new PlacementBatchError("DB08_ACTION_INVALID");
    const [cohort] = await tx.select({name:cohorts.name})
      .from(cohorts).where(eq(cohorts.id,input.cohortId)).limit(1);
    if(!cohort)throw new PlacementBatchError("DB08_BATCH_NOT_FOUND");
    const notice = formatBatchRegistrationNotice(cohort.name,deadline,false);
    for (let offset = 0; offset < recipientUserIds.length; offset += 200) {
      await tx.insert(inAppNotifications).values(
        recipientUserIds.slice(offset, offset + 200).map(userId => ({
          userId, eventId: invitationEvent.id,
          title: notice.title,
          body: notice.body,
          actionHref: "/learn/my-placements/placement#registration",
        })),
      ).onConflictDoNothing();
    }
    return { ...updated, notifiedCount: recipientUserIds.length };
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
