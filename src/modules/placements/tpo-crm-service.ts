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
  checkTpoLeadContactSchema,
  createTpoFollowupSchema,
  createTpoLeadSchema,
  logTpoLeadActivitySchema,
  markTpoNotNowSchema,
  moveTpoFollowupSchema,
  tpoCrmCollegeIdSchema,
  tpoCrmFollowupIdSchema,
  tpoCrmLeadIdSchema,
  updateTpoLeadSchema,
  type CheckTpoLeadContactInput,
  type CreateTpoFollowupInput,
  type CreateTpoLeadInput,
  type LogTpoLeadActivityInput,
  type MarkTpoNotNowInput,
  type MoveTpoFollowupInput,
  type UpdateTpoLeadInput,
} from "./tpo-crm-validation";

export type TpoCrmErrorCode =
  | "TPO_CRM_LEAD_NOT_FOUND"
  | "TPO_CRM_LEAD_DUPLICATE"
  | "TPO_CRM_CONTACT_REQUIRED"
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

/** Explicit API projection: never expose stored invitation token hashes. */
function tpoLeadView(row: typeof placementTpoLeads.$inferSelect) {
  return {
    id: row.id,
    collegeId: row.collegeId,
    companyRelationshipId: row.companyRelationshipId,
    name: row.name,
    designation: row.designation,
    emailNorm: row.emailNorm,
    phoneNorm: row.phoneNorm,
    companyName: row.companyName,
    companyLogoObjectPath: row.companyLogoObjectPath,
    ownerMembershipId: row.ownerMembershipId,
    manualStage: row.manualStage,
    notNowReason: row.notNowReason,
    notNowUntil: row.notNowUntil,
    source: row.source,
    inviteSentAt: row.inviteSentAt,
    inviteClickedAt: row.inviteClickedAt,
    inviteReminderSentAt: row.inviteReminderSentAt,
    inviteBouncedAt: row.inviteBouncedAt,
    unsubscribedAt: row.unsubscribedAt,
    recruiterUserId: row.recruiterUserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listTpoLeads(
  context: RequestContext,
  rawCollegeId: string,
) {
  const collegeId = tpoCrmCollegeIdSchema.parse(rawCollegeId);
  await requirePlacementManageScope(context, collegeId);
  const rows = await getDb()
    .select()
    .from(placementTpoLeads)
    .where(eq(placementTpoLeads.collegeId, collegeId))
    .orderBy(desc(placementTpoLeads.updatedAt), desc(placementTpoLeads.id));
  return rows.map(tpoLeadView);
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
      source: input.source ?? "MANUAL",
      ownerMembershipId: ownerMembership(context, input.collegeId),
    })
    .onConflictDoNothing()
    .returning();

  if (!lead) throw new TpoCrmError("TPO_CRM_LEAD_DUPLICATE");
  return tpoLeadView(lead);
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
  return tpoLeadView(lead);
}

/**
 * Legacy /recruiter-leads/check: query in the authenticated college only.
 * Return a safe projection (never expose invite token hash).
 * Run the same normalization as create/update so UI duplicate checks agree.
 */
export async function checkTpoLeadContact(
  context: RequestContext,
  raw: CheckTpoLeadContactInput,
) {
  const input = checkTpoLeadContactSchema.parse(raw);
  await requirePlacementManageScope(context, input.collegeId);
  const isEmail = input.contact.includes("@");
  const normalized = isEmail
    ? input.contact.toLowerCase()
    : normalizePhone(input.contact);
  const [existing] = await getDb()
    .select()
    .from(placementTpoLeads)
    .where(and(
      eq(placementTpoLeads.collegeId, input.collegeId),
      isEmail
        ? eq(placementTpoLeads.emailNorm, normalized!)
        : eq(placementTpoLeads.phoneNorm, normalized!),
    ))
    .limit(1);
  return existing ? tpoLeadView(existing) : null;
}

/**
 * Legacy edit action, intentionally safer on PATCH: omitted contacts are
 * preserved, explicit null clears them. The locked row validates the
 * effective email/phone pair before either contact can be deleted.
 * Unique indexes are the authoritative concurrency-safe duplicate guard.
 */
export async function updateTpoLead(
  context: RequestContext,
  rawLeadId: string,
  raw: UpdateTpoLeadInput,
) {
  const leadId = tpoCrmLeadIdSchema.parse(rawLeadId);
  const input = updateTpoLeadSchema.parse(raw);
  await requirePlacementManageScope(context, input.collegeId);

  try {
    return await getDb().transaction(async tx => {
      const [current] = await tx
        .select()
        .from(placementTpoLeads)
        .where(and(
          eq(placementTpoLeads.collegeId, input.collegeId),
          eq(placementTpoLeads.id, leadId),
        ))
        .for("update")
        .limit(1);
      if (!current) throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");

      const emailNorm = input.email === undefined
        ? current.emailNorm
        : input.email;
      const phoneNorm = input.phone === undefined
        ? current.phoneNorm
        : normalizePhone(input.phone ?? undefined);
      if (!emailNorm && !phoneNorm) {
        throw new TpoCrmError("TPO_CRM_CONTACT_REQUIRED");
      }
      const source = input.source === undefined
        ? current.source
        : input.source ?? (current.source === "IMPORT" ? "IMPORT" : "MANUAL");
      const [updated] = await tx.update(placementTpoLeads)
        .set({
          name: input.name ?? current.name,
          designation: input.designation === undefined
            ? current.designation
            : input.designation,
          emailNorm,
          phoneNorm,
          companyName: input.companyName ?? current.companyName,
          source,
          updatedAt: new Date(),
        })
        .where(and(
          eq(placementTpoLeads.collegeId, input.collegeId),
          eq(placementTpoLeads.id, leadId),
        ))
        .returning();
      if (!updated) throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");
      return tpoLeadView(updated);
    });
  } catch (error) {
    // Convert only the two known college-scoped contact uniqueness races.
    // Never claim a random constraint failure is a duplicate lead.
    const pgError = error as { code?: string; constraint?: string };
    if (pgError.code === "23505" && (
      pgError.constraint === "placement_tpo_leads_college_email_uq" ||
      pgError.constraint === "placement_tpo_leads_college_phone_uq"
    )) {
      throw new TpoCrmError("TPO_CRM_LEAD_DUPLICATE");
    }
    throw error;
  }
}

/** Safe detail read, including hard tenant isolation and no invite secrets. */
export async function getTpoLead(
  context: RequestContext,
  rawCollegeId: string,
  rawLeadId: string,
) {
  const collegeId = tpoCrmCollegeIdSchema.parse(rawCollegeId);
  const leadId = tpoCrmLeadIdSchema.parse(rawLeadId);
  await requirePlacementManageScope(context, collegeId);
  const [lead] = await getDb()
    .select()
    .from(placementTpoLeads)
    .where(and(
      eq(placementTpoLeads.collegeId, collegeId),
      eq(placementTpoLeads.id, leadId),
    ))
    .limit(1);
  if (!lead) throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");
  return tpoLeadView(lead);
}
