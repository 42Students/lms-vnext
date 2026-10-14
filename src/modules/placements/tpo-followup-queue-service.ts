import "server-only";

import { and, asc, desc, eq, gte, isNull, lte } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementTpoFollowups,
  placementTpoLeadActivities,
  placementTpoLeads,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import {
  confirmedTpoFollowupCreateSchema,
  confirmedTpoFollowupDoneSchema,
  projectTpoFollowupQueue,
  tpoFollowupQueueQuerySchema,
  tpoFollowupCreatedAudit,
  tpoFollowupDoneAudit,
  tpoFollowupIdSchema,
} from "./tpo-followup-queue-model";
import { TpoCrmError } from "./tpo-crm-service";

async function requireTpo(context: RequestContext) {
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  await requirePlacementManageScope(context, collegeId);
  return { collegeId, ownerMembershipId: membership.id };
}

/** Paginated by a hard cap; never treat unavailable or truncated data as zero. */
export async function getTpoDueFollowupQueue(
  context: RequestContext,
  now = new Date(),
  rawQuery: unknown = {},
) {
  const { collegeId, ownerMembershipId } = await requireTpo(context);
  const query=tpoFollowupQueueQuerySchema.parse(rawQuery);
  const db = getDb();
  const weekEnd=new Date(now.getTime()+7*86400000);
  const timeConditions=query.window==="DUE"?[lte(placementTpoFollowups.dueAt,now)]:
    [gte(placementTpoFollowups.dueAt,now),lte(placementTpoFollowups.dueAt,weekEnd)];
  const facts = await db.select({
    id: placementTpoFollowups.id,
    leadId: placementTpoFollowups.leadId,
    leadName: placementTpoLeads.name,
    companyName: placementTpoLeads.companyName,
    dueAt: placementTpoFollowups.dueAt,
    note: placementTpoFollowups.note,
  }).from(placementTpoFollowups)
    .innerJoin(placementTpoLeads, and(
      eq(placementTpoFollowups.leadId, placementTpoLeads.id),
      eq(placementTpoFollowups.collegeId, placementTpoLeads.collegeId),
    ))
    .where(and(
      eq(placementTpoFollowups.collegeId, collegeId),
      eq(placementTpoLeads.collegeId, collegeId),
      isNull(placementTpoFollowups.doneAt),
      ...timeConditions,
      ...(query.scope==="MINE"?[eq(placementTpoFollowups.ownerMembershipId,ownerMembershipId)]:[]),
    ))
    .orderBy(asc(placementTpoFollowups.dueAt), asc(placementTpoFollowups.id))
    .limit(201);

  const leads = await db.select({
    id: placementTpoLeads.id,
    name: placementTpoLeads.name,
    companyName: placementTpoLeads.companyName,
  }).from(placementTpoLeads)
    .where(and(
      eq(placementTpoLeads.collegeId, collegeId),
      isNull(placementTpoLeads.unsubscribedAt),
      isNull(placementTpoLeads.recruiterUserId),
    ))
    .orderBy(desc(placementTpoLeads.updatedAt), asc(placementTpoLeads.id))
    .limit(201);

  return {
    ...projectTpoFollowupQueue(facts.slice(0, 200), now),
    hasMoreDue: facts.length > 200,
    scope: query.scope,
    window: query.window,
    leads: leads.slice(0, 200),
    hasMoreLeads: leads.length > 200,
  };
}

/** Both the due-row and immutable, actor-attributed activity commit atomically. */
export async function createConfirmedTpoFollowup(
  context: RequestContext,
  raw: unknown,
) {
  const scope = await requireTpo(context);
  const input = confirmedTpoFollowupCreateSchema.parse(raw);
  const dueAt = new Date(input.dueAt);
  const actorUserId = context.user.id;
  return getDb().transaction(async (tx) => {
    const [lead] = await tx.select({
      id: placementTpoLeads.id,
      unsubscribedAt: placementTpoLeads.unsubscribedAt,
      recruiterUserId: placementTpoLeads.recruiterUserId,
    }).from(placementTpoLeads).where(and(
      eq(placementTpoLeads.collegeId, scope.collegeId),
      eq(placementTpoLeads.id, input.leadId),
    )).for("update").limit(1);
    if (!lead || lead.unsubscribedAt || lead.recruiterUserId) {
      throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");
    }

    const [created] = await tx.insert(placementTpoFollowups).values({
      collegeId: scope.collegeId,
      leadId: lead.id,
      dueAt,
      ownerMembershipId: scope.ownerMembershipId,
      note: input.note ?? null,
    }).returning();
    if (!created) throw new Error("TPO_FOLLOWUP_CREATE_FAILED");

    await tx.insert(placementTpoLeadActivities).values({
      collegeId: scope.collegeId,
      leadId: lead.id,
      type: "NOTE",
      isSystem: false,
      outcome: "FOLLOWUP_CREATED",
      note: tpoFollowupCreatedAudit(dueAt),
      createdByUserId: actorUserId,
    });
    return { id: created.id, leadId: created.leadId, dueAt: created.dueAt.toISOString() };
  });
}

/** Compares expected due time under row lock: stale and repeated Done are rejected. */
export async function completeConfirmedTpoFollowup(
  context: RequestContext,
  rawFollowupId: unknown,
  raw: unknown,
) {
  const scope = await requireTpo(context);
  const id = tpoFollowupIdSchema.parse(rawFollowupId);
  const input = confirmedTpoFollowupDoneSchema.parse(raw);
  const actorUserId = context.user.id;
  return getDb().transaction(async (tx) => {
    const [current] = await tx.select({
      id: placementTpoFollowups.id,
      leadId: placementTpoFollowups.leadId,
      dueAt: placementTpoFollowups.dueAt,
      doneAt: placementTpoFollowups.doneAt,
    }).from(placementTpoFollowups)
      .innerJoin(placementTpoLeads, and(
        eq(placementTpoLeads.collegeId, placementTpoFollowups.collegeId),
        eq(placementTpoLeads.id, placementTpoFollowups.leadId),
      ))
      .where(and(
        eq(placementTpoFollowups.collegeId, scope.collegeId),
        eq(placementTpoLeads.collegeId, scope.collegeId),
        eq(placementTpoFollowups.id, id),
      )).for("update", { of: placementTpoFollowups }).limit(1);

    if (!current) throw new TpoCrmError("TPO_CRM_FOLLOWUP_NOT_FOUND");
    if (current.doneAt !== null) throw new TpoCrmError("TPO_CRM_FOLLOWUP_ALREADY_DONE");
    if (current.dueAt.toISOString() !== new Date(input.expectedDueAt).toISOString()) {
      throw new TpoCrmError("TPO_CRM_FOLLOWUP_ALREADY_DONE");
    }

    const [done] = await tx.update(placementTpoFollowups)
      .set({ doneAt: new Date() })
      .where(and(
        eq(placementTpoFollowups.id, id),
        eq(placementTpoFollowups.collegeId, scope.collegeId),
        isNull(placementTpoFollowups.doneAt),
      )).returning({ id: placementTpoFollowups.id });
    if (!done) throw new TpoCrmError("TPO_CRM_FOLLOWUP_ALREADY_DONE");
    await tx.insert(placementTpoLeadActivities).values({
      collegeId: scope.collegeId,
      leadId: current.leadId,
      type: "NOTE",
      isSystem: false,
      outcome: "FOLLOWUP_DONE",
      note: tpoFollowupDoneAudit(input.outcome, input.note),
      createdByUserId: actorUserId,
    });
    return { id: done.id, done: true as const };
  });
}
