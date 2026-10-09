import {
  and,
  asc,
  desc,
  eq,
  isNull,
  lte,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementTpoFollowups,
  placementTpoLeadActivities,
  placementTpoLeads,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePlacementManageScope } from "./scope";
import {
  createTpoFollowupSchema,
  createTpoLeadSchema,
  logTpoLeadActivitySchema,
  markTpoNotNowSchema,
  moveTpoFollowupSchema,
  tpoCrmCollegeIdSchema,
  tpoCrmFollowupIdSchema,
  tpoCrmLeadIdSchema,
  type CreateTpoFollowupInput,
  type CreateTpoLeadInput,
  type LogTpoLeadActivityInput,
  type MarkTpoNotNowInput,
  type MoveTpoFollowupInput,
} from "./tpo-crm-validation";

export type TpoCrmErrorCode =
  | "TPO_CRM_LEAD_NOT_FOUND"
  | "TPO_CRM_LEAD_DUPLICATE"
  | "TPO_CRM_FOLLOWUP_NOT_FOUND"
  | "TPO_CRM_FOLLOWUP_ALREADY_DONE";

export class TpoCrmError extends Error {
  constructor(public readonly code: TpoCrmErrorCode) {
    super(code);
    this.name = "TpoCrmError";
  }
}

/** Mirrors legacy contact normalization; no raw invitation tokens are stored. */
function normalizePhone(value: string | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function ownerMembership(context: RequestContext, collegeId: string) {
  return context.membership?.collegeId === collegeId &&
    context.membership.status === "ACTIVE"
    ? context.membership.id
    : null;
}

export async function listTpoLeads(
  context: RequestContext,
  rawCollegeId: string,
) {
  const collegeId = tpoCrmCollegeIdSchema.parse(rawCollegeId);
  await requirePlacementManageScope(context, collegeId);
  return getDb()
    .select()
    .from(placementTpoLeads)
    .where(eq(placementTpoLeads.collegeId, collegeId))
    .orderBy(desc(placementTpoLeads.updatedAt), desc(placementTpoLeads.id));
}

/** Database partial uniques make email/phone duplicate prevention race-safe. */
export async function createTpoLead(
  context: RequestContext,
  raw: CreateTpoLeadInput,
) {
  const input = createTpoLeadSchema.parse(raw);
  await requirePlacementManageScope(context, input.collegeId);
  const [lead] = await getDb()
    .insert(placementTpoLeads)
    .values({
      collegeId: input.collegeId,
      name: input.name,
      emailNorm: input.email ?? null,
      phoneNorm: normalizePhone(input.phone),
      designation: input.designation ?? null,
      companyName: input.companyName ?? null,
      source: input.source ?? "ADDED_BY_HAND",
      ownerMembershipId: ownerMembership(context, input.collegeId),
    })
    .onConflictDoNothing()
    .returning();

  if (!lead) throw new TpoCrmError("TPO_CRM_LEAD_DUPLICATE");
  return lead;
}

export async function listTpoLeadActivities(
  context: RequestContext,
  rawCollegeId: string,
  rawLeadId: string,
) {
  const collegeId = tpoCrmCollegeIdSchema.parse(rawCollegeId);
  const leadId = tpoCrmLeadIdSchema.parse(rawLeadId);
  await requirePlacementManageScope(context, collegeId);
  const [lead] = await getDb()
    .select({ id: placementTpoLeads.id })
    .from(placementTpoLeads)
    .where(and(
      eq(placementTpoLeads.collegeId, collegeId),
      eq(placementTpoLeads.id, leadId),
    ))
    .limit(1);
  if (!lead) throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");
  return getDb()
    .select()
    .from(placementTpoLeadActivities)
    .where(and(
      eq(placementTpoLeadActivities.collegeId, collegeId),
      eq(placementTpoLeadActivities.leadId, leadId),
    ))
    .orderBy(asc(placementTpoLeadActivities.createdAt));
}

/**
 * Contacting a NEW lead moves the manual stage to CONTACTED in the
 * same transaction as the append-only activity insertion. NOT_NOW
 * is intentionally retained until an explicit stage decision.
 */
export async function logTpoLeadActivity(
  context: RequestContext,
  rawLeadId: string,
  raw: LogTpoLeadActivityInput,
) {
  const leadId = tpoCrmLeadIdSchema.parse(rawLeadId);
  const input = logTpoLeadActivitySchema.parse(raw);
  await requirePlacementManageScope(context, input.collegeId);

  return getDb().transaction(async (tx) => {
    const [lead] = await tx
      .select({
        id: placementTpoLeads.id,
        manualStage: placementTpoLeads.manualStage,
      })
      .from(placementTpoLeads)
      .where(and(
        eq(placementTpoLeads.collegeId, input.collegeId),
        eq(placementTpoLeads.id, leadId),
      ))
      .for("update")
      .limit(1);
    if (!lead) throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");

    const [activity] = await tx
      .insert(placementTpoLeadActivities)
      .values({
        collegeId: input.collegeId,
        leadId,
        type: input.type,
        outcome: input.outcome ?? null,
        note: input.note ?? null,
        isSystem: false,
        createdByUserId: context.user.id,
      })
      .returning();

    if (lead.manualStage === "NEW") {
      await tx.update(placementTpoLeads)
        .set({ manualStage: "CONTACTED", updatedAt: new Date() })
        .where(and(
          eq(placementTpoLeads.id, leadId),
          eq(placementTpoLeads.collegeId, input.collegeId),
        ));
    }
    return activity;
  });
}

export async function addTpoFollowup(
  context: RequestContext,
  rawLeadId: string,
  raw: CreateTpoFollowupInput,
) {
  const leadId = tpoCrmLeadIdSchema.parse(rawLeadId);
  const input = createTpoFollowupSchema.parse(raw);
  await requirePlacementManageScope(context, input.collegeId);
  return getDb().transaction(async (tx) => {
    const [lead] = await tx
      .select({ id: placementTpoLeads.id })
      .from(placementTpoLeads)
      .where(and(
        eq(placementTpoLeads.id, leadId),
        eq(placementTpoLeads.collegeId, input.collegeId),
      ))
      .limit(1);
    if (!lead) throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");

    const [followup] = await tx
      .insert(placementTpoFollowups)
      .values({
        collegeId: input.collegeId,
        leadId,
        dueAt: new Date(input.dueAt),
        note: input.note ?? null,
        ownerMembershipId: ownerMembership(context, input.collegeId),
      })
      .returning();
    return followup;
  });
}

export async function listDueTpoFollowups(
  context: RequestContext,
  rawCollegeId: string,
  now = new Date(),
) {
  const collegeId = tpoCrmCollegeIdSchema.parse(rawCollegeId);
  await requirePlacementManageScope(context, collegeId);
  return getDb()
    .select()
    .from(placementTpoFollowups)
    .where(and(
      eq(placementTpoFollowups.collegeId, collegeId),
      isNull(placementTpoFollowups.doneAt),
      lte(placementTpoFollowups.dueAt, now),
    ))
    .orderBy(asc(placementTpoFollowups.dueAt));
}

export async function moveTpoFollowup(
  context: RequestContext,
  rawFollowupId: string,
  raw: MoveTpoFollowupInput,
) {
  const followupId = tpoCrmFollowupIdSchema.parse(rawFollowupId);
  const input = moveTpoFollowupSchema.parse(raw);
  await requirePlacementManageScope(context, input.collegeId);
  const [followup] = await getDb()
    .update(placementTpoFollowups)
    .set({ dueAt: new Date(input.dueAt) })
    .where(and(
      eq(placementTpoFollowups.id, followupId),
      eq(placementTpoFollowups.collegeId, input.collegeId),
      isNull(placementTpoFollowups.doneAt),
    ))
    .returning();
  if (followup) return followup;

  const [existing] = await getDb()
    .select({ doneAt: placementTpoFollowups.doneAt })
    .from(placementTpoFollowups)
    .where(and(
      eq(placementTpoFollowups.id, followupId),
      eq(placementTpoFollowups.collegeId, input.collegeId),
    ))
    .limit(1);
  throw new TpoCrmError(existing
    ? "TPO_CRM_FOLLOWUP_ALREADY_DONE"
    : "TPO_CRM_FOLLOWUP_NOT_FOUND");
}

export async function finishTpoFollowup(
  context: RequestContext,
  rawCollegeId: string,
  rawFollowupId: string,
) {
  const collegeId = tpoCrmCollegeIdSchema.parse(rawCollegeId);
  const followupId = tpoCrmFollowupIdSchema.parse(rawFollowupId);
  await requirePlacementManageScope(context, collegeId);
  const [followup] = await getDb()
    .update(placementTpoFollowups)
    .set({ doneAt: new Date() })
    .where(and(
      eq(placementTpoFollowups.collegeId, collegeId),
      eq(placementTpoFollowups.id, followupId),
      isNull(placementTpoFollowups.doneAt),
    ))
    .returning();
  if (!followup) throw new TpoCrmError("TPO_CRM_FOLLOWUP_NOT_FOUND");
  return followup;
}

export async function markTpoLeadNotNow(
  context: RequestContext,
  rawLeadId: string,
  raw: MarkTpoNotNowInput,
) {
  const leadId = tpoCrmLeadIdSchema.parse(rawLeadId);
  const input = markTpoNotNowSchema.parse(raw);
  await requirePlacementManageScope(context, input.collegeId);
  const [lead] = await getDb()
    .update(placementTpoLeads)
    .set({
      manualStage: "NOT_NOW",
      notNowReason: input.reason ?? null,
      notNowUntil: input.revisitDate ?? null,
      updatedAt: new Date(),
    })
    .where(and(
      eq(placementTpoLeads.id, leadId),
      eq(placementTpoLeads.collegeId, input.collegeId),
    ))
    .returning();
  if (!lead) throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");
  return lead;
}
