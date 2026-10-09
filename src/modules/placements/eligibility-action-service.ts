import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  cohorts,
  collegeMemberships,
  departments,
  membershipRoles,
  placementEligibilityActions,
  placementEligibilityDecisions,
  placementEligibilityEvents,
  programs,
  sections,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { PlacementsServiceError } from "./errors";
import {
  normalizePlacementEligibilityBulkAction,
  placementEligibilityUndoSchema,
} from "./eligibility-action-validation";

/**
 * DB08-A staged service. Its tables/last_action_id are not live until the
 * DB03/DB04 migration journal is reconciled and the DB08 migration replays.
 * Do not publish routes for these functions before that migration exists.
 */

export async function applyPlacementEligibilityBulkAction(
  context: RequestContext,
  rawInput: unknown,
) {
  const input = normalizePlacementEligibilityBulkAction(rawInput);
  requirePermission(context, "placements.manage", {
    collegeId: input.collegeId,
  });

  return getDb().transaction(async (tx) => {
    // Lock the action key first, then the college key on both apply and undo.
    // Prevent duplicate keys and serialize overlapping eligibility writes.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${input.actionId}), 7342008)`,
    );
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${input.collegeId}), 7342009)`,
    );

    const [existingAction] = await tx
      .select()
      .from(placementEligibilityActions)
      .where(eq(placementEligibilityActions.id, input.actionId))
      .limit(1);

    if (existingAction) {
      if (
        existingAction.collegeId !== input.collegeId ||
        JSON.stringify(existingAction.requestPayload) !==
          JSON.stringify(input.changes)
      ) {
        throw new PlacementsServiceError(
          "PLACEMENT_ELIGIBILITY_ACTION_CONFLICT",
        );
      }
      return {
        actionId: input.actionId,
        status: existingAction.status,
        affected: input.changes.length,
        replayed: true,
      };
    }

    // Polymorphic scope IDs have no single relational FK. Explicitly resolve
    // every concrete target against its own college before changing anything.
    for (const change of input.changes) {
      let owned: { id: string } | undefined;

      if (change.scopeType === "MEMBERSHIP") {
        [owned] = await tx
          .select({ id: collegeMemberships.id })
          .from(collegeMemberships)
          .innerJoin(
            membershipRoles,
            eq(membershipRoles.membershipId, collegeMemberships.id),
          )
          .where(
            and(
              eq(collegeMemberships.id, change.scopeId),
              eq(collegeMemberships.collegeId, input.collegeId),
              eq(membershipRoles.role, "LEARNER"),
            ),
          )
          .limit(1);
      } else if (change.scopeType === "SECTION") {
        [owned] = await tx
          .select({ id: sections.id })
          .from(sections)
          .innerJoin(cohorts, eq(sections.cohortId, cohorts.id))
          .innerJoin(programs, eq(cohorts.programId, programs.id))
          .innerJoin(
            departments,
            eq(programs.departmentId, departments.id),
          )
          .where(
            and(
              eq(sections.id, change.scopeId),
              eq(departments.collegeId, input.collegeId),
            ),
          )
          .limit(1);
      } else {
        [owned] = await tx
          .select({ id: cohorts.id })
          .from(cohorts)
          .innerJoin(programs, eq(cohorts.programId, programs.id))
          .innerJoin(
            departments,
            eq(programs.departmentId, departments.id),
          )
          .where(
            and(
              eq(cohorts.id, change.scopeId),
              eq(departments.collegeId, input.collegeId),
            ),
          )
          .limit(1);
      }

      if (!owned) {
        throw new PlacementsServiceError(
          "PLACEMENT_ELIGIBILITY_SCOPE_MISMATCH",
        );
      }
    }

    await tx.insert(placementEligibilityActions).values({
      id: input.actionId,
      collegeId: input.collegeId,
      requestedByUserId: context.user.id,
      requestPayload: input.changes,
    });

    const now = new Date();
    for (const change of input.changes) {
      const [previous] = await tx
        .select()
        .from(placementEligibilityDecisions)
        .where(
          and(
            eq(placementEligibilityDecisions.scopeType, change.scopeType),
            eq(placementEligibilityDecisions.scopeId, change.scopeId),
          ),
        )
        .limit(1);

      if (previous && previous.collegeId !== input.collegeId) {
        throw new PlacementsServiceError(
          "PLACEMENT_ELIGIBILITY_SCOPE_MISMATCH",
        );
      }

      if (previous) {
        await tx
          .update(placementEligibilityDecisions)
          .set({
            status: change.status,
            reason: change.reason,
            note: change.note,
            lastActionId: input.actionId,
            decidedByUserId: context.user.id,
            decidedAt: now,
            updatedAt: now,
          })
          .where(eq(placementEligibilityDecisions.id, previous.id));
      } else {
        await tx.insert(placementEligibilityDecisions).values({
          collegeId: input.collegeId,
          scopeType: change.scopeType,
          scopeId: change.scopeId,
          status: change.status,
          reason: change.reason,
          note: change.note,
          lastActionId: input.actionId,
          decidedByUserId: context.user.id,
          decidedAt: now,
        });
      }

      await tx.insert(placementEligibilityEvents).values({
        actionId: input.actionId,
        collegeId: input.collegeId,
        scopeType: change.scopeType,
        scopeId: change.scopeId,
        beforeStatus: previous?.status ?? null,
        beforeReason: previous?.reason ?? null,
        beforeNote: previous?.note ?? null,
        beforeLastActionId: previous?.lastActionId ?? null,
        beforeDecidedByUserId: previous?.decidedByUserId ?? null,
        beforeDecidedAt: previous?.decidedAt ?? null,
        afterStatus: change.status,
        afterReason: change.reason,
        afterNote: change.note,
        actorUserId: context.user.id,
      });
    }

    return {
      actionId: input.actionId,
      status: "APPLIED" as const,
      affected: input.changes.length,
      replayed: false,
    };
  });
}

export async function undoPlacementEligibilityBulkAction(
  context: RequestContext,
  rawInput: unknown,
) {
  const input = placementEligibilityUndoSchema.parse(rawInput);
  requirePermission(context, "placements.manage", {
    collegeId: input.collegeId,
  });

  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${input.actionId}), 7342008)`,
    );
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${input.collegeId}), 7342009)`,
    );

    const [action] = await tx
      .select()
      .from(placementEligibilityActions)
      .where(
        and(
          eq(placementEligibilityActions.id, input.actionId),
          eq(placementEligibilityActions.collegeId, input.collegeId),
        ),
      )
      .limit(1);

    if (!action) {
      throw new PlacementsServiceError(
        "PLACEMENT_ELIGIBILITY_ACTION_NOT_FOUND",
      );
    }
    if (action.status === "UNDONE") {
      return {
        actionId: input.actionId,
        status: "UNDONE" as const,
        replayed: true,
      };
    }

    const events = await tx
      .select()
      .from(placementEligibilityEvents)
      .where(
        and(
          eq(placementEligibilityEvents.actionId, input.actionId),
          eq(placementEligibilityEvents.collegeId, input.collegeId),
        ),
      );

    if (events.length === 0) {
      throw new PlacementsServiceError(
        "PLACEMENT_ELIGIBILITY_STALE_UNDO",
      );
    }

    // Validate *all* current rows before writing one. A subsequent action
    // on any target makes this entire bulk undo fail atomically.
    const snapshots: Array<{
      id: string;
      event: (typeof events)[number];
    }> = [];
    for (const event of events) {
      const [current] = await tx
        .select()
        .from(placementEligibilityDecisions)
        .where(
          and(
            eq(placementEligibilityDecisions.collegeId, input.collegeId),
            eq(placementEligibilityDecisions.scopeType, event.scopeType),
            eq(placementEligibilityDecisions.scopeId, event.scopeId),
          ),
        )
        .limit(1);

      if (
        !current ||
        current.lastActionId !== input.actionId ||
        current.status !== event.afterStatus ||
        current.reason !== event.afterReason ||
        current.note !== event.afterNote
      ) {
        throw new PlacementsServiceError(
          "PLACEMENT_ELIGIBILITY_STALE_UNDO",
        );
      }
      snapshots.push({ id: current.id, event });
    }

    const now = new Date();
    for (const { id, event } of snapshots) {
      if (event.beforeStatus === null) {
        const removed = await tx
          .delete(placementEligibilityDecisions)
          .where(
            and(
              eq(placementEligibilityDecisions.id, id),
              eq(placementEligibilityDecisions.lastActionId, input.actionId),
            ),
          )
          .returning({ id: placementEligibilityDecisions.id });
        if (removed.length !== 1) {
          throw new PlacementsServiceError(
            "PLACEMENT_ELIGIBILITY_STALE_UNDO",
          );
        }
      } else {
        const restored = await tx
          .update(placementEligibilityDecisions)
          .set({
            status: event.beforeStatus,
            reason: event.beforeReason,
            note: event.beforeNote,
            lastActionId: event.beforeLastActionId,
            decidedByUserId: event.beforeDecidedByUserId,
            decidedAt: event.beforeDecidedAt ?? now,
            updatedAt: now,
          })
          .where(
            and(
              eq(placementEligibilityDecisions.id, id),
              eq(placementEligibilityDecisions.lastActionId, input.actionId),
            ),
          )
          .returning({ id: placementEligibilityDecisions.id });
        if (restored.length !== 1) {
          throw new PlacementsServiceError(
            "PLACEMENT_ELIGIBILITY_STALE_UNDO",
          );
        }
      }

      await tx
        .update(placementEligibilityEvents)
        .set({ undoneAt: now })
        .where(eq(placementEligibilityEvents.id, event.id));
    }

    await tx
      .update(placementEligibilityActions)
      .set({
        status: "UNDONE",
        undoneAt: now,
        undoneByUserId: context.user.id,
      })
      .where(eq(placementEligibilityActions.id, input.actionId));

    return {
      actionId: input.actionId,
      status: "UNDONE" as const,
      replayed: false,
    };
  });
}
