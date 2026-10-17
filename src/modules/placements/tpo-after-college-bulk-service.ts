import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  activityEvents, collegeMemberships, colleges, membershipRoles, users,
} from "@/db/schema";
import { placementTpoAfterCollege } from "@/db/schema/tpo-configuration";
import type { RequestContext } from "@/modules/identity/context";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { requireTpoBatchActor } from "./tpo-batch-workspace-read-service";
import { placementTableExists } from "./staged-tables";
import { afterCollegeManualSchema } from "./tpo-after-college-model";
const version = z.union([z.literal("none"), z.string().datetime({ offset: true })]);
const inputSchema = z.object({
  changes: z.array(z.object({
    membershipId: z.string().uuid(),
    outcome: afterCollegeManualSchema,
    expectedVersion: version,
  }).strict()).min(1).max(200),
}).strict();

export class BulkAfterCollegeError extends Error {
  constructor(readonly code: string) { super(code); this.name = "BulkAfterCollegeError"; }
}

/** Verify all selected learner IDs and optimistic versions before writing.
 * Either the whole batch is saved and audited or nothing changes. */
export async function bulkUpdateTpoAfterCollege(
  context: RequestContext, raw: unknown,
) {
  const input = inputSchema.parse(raw);
  const ids = input.changes.map(row => row.membershipId);
  if (new Set(ids).size !== ids.length) throw new BulkAfterCollegeError("AFTER_COLLEGE_DUPLICATE");
  const collegeId = await requireTpoBatchActor(context);
  if (!await placementTableExists("placement_tpo_after_college"))
    throw new BulkAfterCollegeError("AFTER_COLLEGE_PENDING");
  return getDb().transaction(async tx => {
    const [college] = await tx.select({
      id: colleges.id, organizationId: colleges.organizationId,
    }).from(colleges).where(and(eq(colleges.id, collegeId), eq(colleges.status, "ACTIVE")))
      .for("update").limit(1);
    if (!college) throw new BulkAfterCollegeError("AFTER_COLLEGE_NOT_FOUND");
    await assertPersistedPlatformPermission(tx, context, "placements.manage", {
      collegeId, organizationId: college.organizationId,
    });
    const learners = await tx.select({ id: collegeMemberships.id })
      .from(collegeMemberships)
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .innerJoin(membershipRoles, and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "LEARNER")))
      .where(and(eq(collegeMemberships.collegeId, collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(users.platformStatus, "ACTIVE"),
        inArray(collegeMemberships.id, ids)))
      .for("share");
    if (learners.length !== ids.length)
      throw new BulkAfterCollegeError("AFTER_COLLEGE_NOT_FOUND");
    const existing = await tx.select({
      membershipId: placementTpoAfterCollege.learnerMembershipId,
      outcome: placementTpoAfterCollege.outcome,
      updatedAt: placementTpoAfterCollege.updatedAt,
    }).from(placementTpoAfterCollege).where(and(
      eq(placementTpoAfterCollege.collegeId, collegeId),
      inArray(placementTpoAfterCollege.learnerMembershipId, ids)))
      .for("update");
    const current = new Map(existing.map(row => [row.membershipId, row]));
    for (const row of input.changes) {
      if ((current.get(row.membershipId)?.updatedAt.toISOString() ?? "none") !== row.expectedVersion)
        throw new BulkAfterCollegeError("AFTER_COLLEGE_STALE");
    }
    const results = [];
    for (const row of input.changes) {
      const previous = current.get(row.membershipId);
      if (previous?.outcome === row.outcome) {
        results.push({ membershipId: row.membershipId,
          outcome: row.outcome, previousOutcome: previous.outcome,
          version: previous.updatedAt.toISOString(), changed: false });
        continue;
      }
      const now = new Date(Math.max(Date.now(), (previous?.updatedAt.getTime() ?? 0) + 1));
      await tx.insert(placementTpoAfterCollege).values({
        learnerMembershipId: row.membershipId, collegeId, outcome: row.outcome,
        updatedAt: now,
      }).onConflictDoUpdate({
        target: placementTpoAfterCollege.learnerMembershipId,
        set: { outcome: row.outcome, updatedAt: now },
      });
      await tx.insert(activityEvents).values({
        organizationId: college.organizationId, collegeId,
        actorUserId: context.user.id, actorMembershipId: context.membership!.id,
        module: "PLACEMENTS", eventType: "placements.student.after_college_updated",
        subjectType: "COLLEGE_MEMBERSHIP", subjectId: row.membershipId,
        summary: "TPO updated a learner after-college destination",
        metadata: { before: previous?.outcome ?? "NOT_DECIDED", after: row.outcome,
          mode: "BULK" },
      });
      results.push({ membershipId: row.membershipId, outcome: row.outcome,
        previousOutcome: previous?.outcome ?? "NOT_DECIDED",
        version: now.toISOString(), changed: true });
    }
    return { updated: results.filter(row => row.changed).length, results };
  });
}
