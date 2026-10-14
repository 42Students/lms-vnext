import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementCompanyRelationships,
  placementTpoLeadActivities,
  placementTpoLeads,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import {
  confirmedTpoCompanyInteractionSchema,
  tpoCompanyInteractionCompanyIdSchema,
} from "./tpo-company-interaction-model";
import { TpoCrmError } from "./tpo-crm-service";

export class TpoCompanyInteractionConflict extends Error {
  constructor() {
    super("TPO_COMPANY_INTERACTION_STALE");
    this.name = "TpoCompanyInteractionConflict";
  }
}

/**
 * Company contact interactions are append-only DB09 lead activities.
 * Each activity is the immutable, actor-attributed audit row itself.
 * No staged CRM table, system-event impersonation, outbound delivery
 * or invented contact-stage transition is involved.
 */
export async function createConfirmedTpoCompanyInteraction(
  context: RequestContext,
  rawCompanyId: unknown,
  raw: unknown,
) {
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  const companyId = tpoCompanyInteractionCompanyIdSchema.parse(rawCompanyId);
  const input = confirmedTpoCompanyInteractionSchema.parse(raw);
  await requirePlacementManageScope(context, collegeId);
  const actorUserId = context.user.id;

  return getDb().transaction(async (tx) => {
    const [relationship] = await tx.select({
      id: placementCompanyRelationships.id,
    }).from(placementCompanyRelationships).where(and(
      eq(placementCompanyRelationships.collegeId, collegeId),
      eq(placementCompanyRelationships.companyId, companyId),
      eq(placementCompanyRelationships.status, "ACTIVE"),
    )).for("share").limit(1);
    if (!relationship) throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");

    const [lead] = await tx.select({
      id: placementTpoLeads.id,
      updatedAt: placementTpoLeads.updatedAt,
      unsubscribedAt: placementTpoLeads.unsubscribedAt,
    }).from(placementTpoLeads).where(and(
      eq(placementTpoLeads.id, input.leadId),
      eq(placementTpoLeads.collegeId, collegeId),
      eq(placementTpoLeads.companyRelationshipId, relationship.id),
    )).for("update").limit(1);
    if (!lead || lead.unsubscribedAt) {
      throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");
    }
    if (lead.updatedAt.toISOString() !==
      new Date(input.expectedLeadUpdatedAt).toISOString()) {
      throw new TpoCompanyInteractionConflict();
    }

    // Advance the row version while holding the same lead lock so a
    // repeated POST after a lost response cannot insert the same event again.
    // This does not alter manualStage or claim any outbound delivery.
    const nextUpdatedAt = new Date(Math.max(
      Date.now(),
      lead.updatedAt.getTime() + 1,
    ));
    await tx.update(placementTpoLeads).set({
      updatedAt: nextUpdatedAt,
    }).where(and(
      eq(placementTpoLeads.id, lead.id),
      eq(placementTpoLeads.collegeId, collegeId),
    ));

    const [created] = await tx.insert(placementTpoLeadActivities).values({
      collegeId,
      leadId: lead.id,
      type: input.type,
      outcome: input.outcome ?? null,
      note: input.note,
      isSystem: false,
      createdByUserId: actorUserId,
    }).returning({
      id: placementTpoLeadActivities.id,
      createdAt: placementTpoLeadActivities.createdAt,
    });
    if (!created) throw new Error("TPO_COMPANY_INTERACTION_INSERT_FAILED");
    return {
      id: created.id,
      leadId: lead.id,
      type: input.type,
      occurredAt: created.createdAt.toISOString(),
      leadUpdatedAt: nextUpdatedAt.toISOString(),
    };
  });
}
