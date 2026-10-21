import "server-only";

import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { activityEvents, collegeMemberships, colleges, membershipRoles, moduleAccessRules, users } from "@/db/schema";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RequestContext } from "@/modules/identity/context";
import { isSuperAdmin } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import type { ModuleAccessScope } from "./service";
import { getSuperAdminLearnerAccessTrace } from "./admin-trace-service";
import { hasPersistedAncestorLock, isStudentRuleNoop, studentRuleMatches } from "./admin-student-rule-model";
import { StudentRuleConflict } from "./admin-student-rule-write";

/** No placement overrides: placement decisions ignore membership rules.
 * Remain bounded to 25 IDs until a bulk 1000-learner SQL preflight exists. */
const inputSchema = z.strictObject({
  membershipIds: z.preprocess(
    (value) => Array.isArray(value) ? [...new Set(value)] : value,
    z.array(z.uuid()).min(1).max(25),
  ),
  module: z.enum(["projects", "electives"]),
  action: z.enum(["ENABLE", "DISABLE", "INHERIT"]),
  confirmed: z.literal(true),
});
class BulkRuleRejected extends Error {
  constructor(
    readonly membershipId: string,
    readonly code: "LEARNER_NOT_FOUND" | "MODULE_NOT_SUPPORTED",
  ) {
    super(code);
    this.name = "BulkRuleRejected";
  }
}
function failureMessage(error: unknown): string {
  if (error instanceof AuthorizationError) return "Not allowed to edit this learner.";
  if (error instanceof StudentRuleConflict && error.code === "STALE_RULE")
    return "The rule changed. Refresh and try again.";
  if (error instanceof StudentRuleConflict && error.code === "ANCESTOR_LOCKED")
    return "A higher-level locked rule prevents this change.";
  if (error instanceof BulkRuleRejected && error.code === "LEARNER_NOT_FOUND")
    return "Learner unavailable in this college.";
  if (error instanceof BulkRuleRejected && error.code === "MODULE_NOT_SUPPORTED")
    return "This module cannot be edited for the selected learner.";
  return "Could not update the selected learners. No changes were saved.";
}

export async function updateSuperAdminStudentRulesInBulk(
  context: RequestContext,
  raw: unknown,
) {
  if (!isSuperAdmin(context)) throw new AuthorizationError("college.manage");
  const acting = await resolveActingCollege(context, "college.manage");
  const input = inputSchema.parse(raw);
  let currentId = input.membershipIds[0]!;

  try {
    // Preflight all IDs first, then re-check under one transaction's locks.
    const prepared: Array<{
      membershipId: string;
      expected: { enabled: boolean; locked: boolean } | null;
      ancestors: ModuleAccessScope[];
    }> = [];
    for (const membershipId of [...input.membershipIds].sort()) {
      currentId = membershipId;
      const trace = await getSuperAdminLearnerAccessTrace(
        context, acting.collegeId, { membershipId },
      );
      if (!trace?.selected) {
        throw new BulkRuleRejected(membershipId, "LEARNER_NOT_FOUND");
      }
      const moduleTrace = trace.selected.modules.find(
        (entry) => entry.module === input.module,
      );
      if (!moduleTrace) {
        throw new BulkRuleRejected(membershipId, "MODULE_NOT_SUPPORTED");
      }
      const stored = moduleTrace.steps.find(
        (step) => step.level === "MEMBERSHIP",
      );
      const expected = stored?.source === "PERSISTED" && stored.value !== null
        ? { enabled: stored.value, locked: stored.locked }
        : null;
      prepared.push({
        membershipId,
        expected,
        ancestors: trace.selected.chain.filter(
          (scope) => scope.scopeType !== "MEMBERSHIP",
        ),
      });
    }

    const applied = await getDb().transaction(async (tx) => {
      const [college] = await tx.select({
        id: colleges.id,
        organizationId: colleges.organizationId,
        status: colleges.status,
      }).from(colleges)
        .where(eq(colleges.id, acting.collegeId))
        .for("update").limit(1);
      if (!college || college.status !== "ACTIVE") {
        throw new AuthorizationError("college.manage");
      }
      requirePermission(context, "college.manage", {
        collegeId: college.id, organizationId: college.organizationId,
      });
      await assertPersistedPlatformPermission(
        tx, context, "college.manage",
        { collegeId: college.id, organizationId: college.organizationId },
      );

      // Stable lock order, including every active student membership.
      const ids = prepared.map((entry) => entry.membershipId);
      const members = await tx.select({
        id: collegeMemberships.id,
        status: collegeMemberships.status,
        userStatus: users.platformStatus,
      }).from(collegeMemberships)
        .innerJoin(users, eq(users.id, collegeMemberships.userId))
        .where(and(
          eq(collegeMemberships.collegeId, college.id),
          inArray(collegeMemberships.id, ids),
        ))
        .orderBy(asc(collegeMemberships.id))
        .for("update", { of: collegeMemberships });
      const activeIds = new Set(members.filter(
        (entry) => entry.status === "ACTIVE" && entry.userStatus === "ACTIVE",
      ).map((entry) => entry.id));
      const roles = await tx.select({
        membershipId: membershipRoles.membershipId,
      }).from(membershipRoles)
        .where(and(
          inArray(membershipRoles.membershipId, ids),
          eq(membershipRoles.role, "LEARNER"),
        ))
        .for("share");
      const learnerIds = new Set(roles.map((entry) => entry.membershipId));

      for (const item of prepared) {
        currentId = item.membershipId;
        if (!activeIds.has(item.membershipId) || !learnerIds.has(item.membershipId)) {
          throw new BulkRuleRejected(item.membershipId, "LEARNER_NOT_FOUND");
        }

        if (input.action !== "INHERIT" && item.ancestors.length > 0) {
          const parentConditions = item.ancestors.map((scope) => {
            const scopeIdMatch = scope.scopeId === null
              ? isNull(moduleAccessRules.scopeId)
              : eq(moduleAccessRules.scopeId, scope.scopeId);
            return and(
              eq(moduleAccessRules.scopeType, scope.scopeType),
              scopeIdMatch,
            );
          });
          const parents = await tx.select({
            locked: moduleAccessRules.locked,
          }).from(moduleAccessRules)
            .where(and(
              eq(moduleAccessRules.module, input.module),
              or(...parentConditions),
            ))
            .for("share");
          if (hasPersistedAncestorLock(parents)) {
            throw new StudentRuleConflict("ANCESTOR_LOCKED");
          }
        }

        const predicate = and(
          eq(moduleAccessRules.scopeType, "MEMBERSHIP"),
          eq(moduleAccessRules.scopeId, item.membershipId),
          eq(moduleAccessRules.module, input.module),
        );
        const [previous] = await tx.select({
          id: moduleAccessRules.id,
          enabled: moduleAccessRules.enabled,
          locked: moduleAccessRules.locked,
        }).from(moduleAccessRules).where(predicate)
          .for("update").limit(1);
        const before = previous
          ? { enabled: previous.enabled, locked: previous.locked }
          : null;
        if (!studentRuleMatches(item.expected, before)) {
          throw new StudentRuleConflict("STALE_RULE");
        }
        const action = input.action === "INHERIT"
          ? { action: "INHERIT" as const }
          : { action: "SET" as const, enabled: input.action === "ENABLE", locked: false };
        if (isStudentRuleNoop(before, action)) continue;

        if (action.action === "INHERIT") {
          if (previous) {
            await tx.delete(moduleAccessRules)
              .where(eq(moduleAccessRules.id, previous.id));
          }
        } else if (previous) {
          await tx.update(moduleAccessRules).set({
            enabled: action.enabled,
            locked: action.locked,
            updatedByUserId: context.user.id,
            updatedAt: new Date(),
          }).where(eq(moduleAccessRules.id, previous.id));
        } else {
          await tx.insert(moduleAccessRules).values({
            scopeType: "MEMBERSHIP",
            scopeId: item.membershipId,
            module: input.module,
            enabled: action.enabled,
            locked: action.locked,
            updatedByUserId: context.user.id,
          });
        }
        await tx.insert(activityEvents).values({
          collegeId: college.id,
          organizationId: college.organizationId,
          actorUserId: context.user.id,
          module: "PLATFORM",
          eventType: ACTIVITY_EVENT_TYPES.PLATFORM_STUDENT_MODULE_RULE_CHANGED,
          importance: "HIGH",
          subjectType: "MEMBERSHIP",
          subjectId: item.membershipId,
          summary: "Super Admin updated a learner module override",
          metadata: {
            module: input.module,
            before,
            after: action.action === "INHERIT"
              ? null
              : { enabled: action.enabled, locked: action.locked },
          },
        });
      }

      // A failed summary also rolls back all learner mutations and audits.
      await tx.insert(activityEvents).values({
        collegeId: college.id,
        organizationId: college.organizationId,
        actorUserId: context.user.id,
        module: "PLATFORM",
        eventType: "MODULE_ACCESS_BULK_SET",
        importance: "HIGH",
        subjectType: "COLLEGE",
        subjectId: college.id,
        summary: "Super Admin applied a bulk learner module rule",
        metadata: {
          module: input.module,
          action: input.action,
          studentCount: prepared.length,
          requestedCount: prepared.length,
          failedCount: 0,
        },
      });
      return prepared.length;
    });
    return {
      requested: input.membershipIds.length,
      applied,
      failures: [] as Array<{ id: string; error: string }>,
      auditRecorded: true,
    };
  } catch (error) {
    // Rollback is all-or-nothing; database and provider errors stay private.
    return {
      requested: input.membershipIds.length,
      applied: 0,
      failures: [{
        id: error instanceof BulkRuleRejected ? error.membershipId : currentId,
        error: failureMessage(error),
      }],
      auditRecorded: false,
      auditWarning: "The bulk update was not saved.",
    };
  }
}
