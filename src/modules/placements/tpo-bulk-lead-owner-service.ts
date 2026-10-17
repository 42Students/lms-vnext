import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  activityEvents,
  collegeMemberships,
  membershipRoles,
  placementTpoLeadActivities,
  placementTpoLeads,
  users,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import {
  confirmedTpoBulkLeadOwnerSchema,
  decideTpoLeadOwnerChange,
  summarizeTpoBulkLeadOwners,
  tpoLeadOwnerAuditNote,
  type TpoBulkOwnerResult,
} from "./tpo-bulk-lead-owner-model";
import { requirePlacementManageScope } from "./scope";

async function requireTpoOwnerScope(context: RequestContext) {
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  const college = await requirePlacementManageScope(context, collegeId);
  return college.id;
}

const placementStaffRoles: Array<"TPO" | "COLLEGE_ADMIN" | "FACULTY"> = [
  "TPO", "COLLEGE_ADMIN", "FACULTY",
];

/** Only explicitly active placement staff in the signed-in college are selectable. */
export async function listTpoLeadOwners(context: RequestContext) {
  const collegeId = await requireTpoOwnerScope(context);
  return getDb().selectDistinct({
    membershipId: collegeMemberships.id,
    displayName: users.displayName,
  })
    .from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, eq(membershipRoles.membershipId, collegeMemberships.id))
    .where(and(
      eq(collegeMemberships.collegeId, collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
      eq(users.platformStatus, "ACTIVE"),
      inArray(membershipRoles.role, placementStaffRoles),
    ))
    .orderBy(asc(users.displayName), asc(collegeMemberships.id))
    .limit(500);
}

/**
 * Every lead and its immutable actor NOTE audit commit or roll back together.
 * Selection is revalidated after a deterministic lead row lock; the target
 * member is checked and SHARE-locked by the registered DB09 owner trigger.
 */
export async function bulkAssignTpoLeadOwner(
  context: RequestContext,
  raw: unknown,
) {
  const collegeId = await requireTpoOwnerScope(context);
  const college = await requirePlacementManageScope(context,collegeId);
  const input = confirmedTpoBulkLeadOwnerSchema.parse(raw);
  const actorUserId = context.user.id;

  const db = getDb();
  return db.transaction(async (tx) => {
    // Do not query through another pool connection inside this transaction.
    const [target] = await tx.select({
      id: collegeMemberships.id,
    }).from(collegeMemberships)
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .innerJoin(membershipRoles, eq(membershipRoles.membershipId, collegeMemberships.id))
      .where(and(
        eq(collegeMemberships.id, input.ownerMembershipId),
        eq(collegeMemberships.collegeId, collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(users.platformStatus, "ACTIVE"),
        inArray(membershipRoles.role, placementStaffRoles),
      ))
      .limit(1);
    if (!target) throw new AuthorizationError("placements.manage");

    const byId = new Map<string, TpoBulkOwnerResult>();
    const ordered = [...input.selections].sort((a, b) => a.id.localeCompare(b.id));
    for (const selected of ordered) {
      const [current] = await tx.select({
        id: placementTpoLeads.id,
        ownerMembershipId: placementTpoLeads.ownerMembershipId,
        recruiterUserId: placementTpoLeads.recruiterUserId,
        unsubscribedAt: placementTpoLeads.unsubscribedAt,
      }).from(placementTpoLeads)
        .where(and(
          eq(placementTpoLeads.id, selected.id),
          eq(placementTpoLeads.collegeId, collegeId),
        ))
        .for("update")
        .limit(1);

      const verdict = decideTpoLeadOwnerChange(
        current ?? null, selected, input.ownerMembershipId,
      );
      if (verdict.status !== "updated") {
        byId.set(selected.id, { leadId: selected.id, ...verdict });
        continue;
      }
      if (!current) throw new Error("TPO_OWNER_UNEXPECTED_NULL");
      const [updated] = await tx.update(placementTpoLeads).set({
        ownerMembershipId: target.id,
        updatedAt: new Date(),
      }).where(and(
        eq(placementTpoLeads.id, selected.id),
        eq(placementTpoLeads.collegeId, collegeId),
      )).returning({ id: placementTpoLeads.id });
      if (!updated) throw new Error("TPO_OWNER_UPDATE_CONFLICT");
      await tx.insert(placementTpoLeadActivities).values({
        leadId: current.id,
        collegeId,
        type: "NOTE",
        isSystem: false,
        outcome: "OWNER_CHANGED",
        note: tpoLeadOwnerAuditNote(current.ownerMembershipId, target.id),
        createdByUserId: actorUserId,
      });
      byId.set(selected.id, { leadId: selected.id, status: "updated", reason: null });
    }
    const results = input.selections.map((selected) => {
      const row = byId.get(selected.id);
      if (!row) throw new Error("TPO_OWNER_RESULT_MISSING");
      return row;
    });
    const counts=summarizeTpoBulkLeadOwners(results);
    await tx.insert(activityEvents).values({
      organizationId:college.organizationId,collegeId,
      actorUserId:context.user.id,actorMembershipId:context.membership!.id,
      module:"PLACEMENTS",eventType:"PLACEMENTS_RECRUITER_BULK_OWNER",
      subjectType:"placement_tpo_lead",subjectId:results[0].leadId,
      summary:"Bulk recruiter lead ownership update",
      metadata:{ownerMembershipId:target.id,leadIds:results.map(r=>r.leadId),counts},
    });
    return { results, counts };
  });
}
