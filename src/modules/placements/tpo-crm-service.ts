import {
  and,
  asc,
  desc,
  eq,
  isNull,
  lte,
  sql,
  inArray,
  max,
  min,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementTpoFollowups,
  activityEvents,
  placementTpoLeadActivities,
  placementTpoLeads,
  collegeMemberships,users,identityDeviceSessions,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { can, requirePermission, AuthorizationError } from "@/modules/permissions/policy";
import {
  isSameNotNowDecision,
  leadCreatedAuditNote,
  leadNotNowAuditNote,
} from "./tpo-crm-confirmed-write-model";
import { requirePlacementManageScope } from "./scope";
import { nextDayTpoFollowupAt } from "./tpo-crm-followup-policy";
import {notifyActiveTposOfRecruiterEvent} from "./tpo-recruiter-bell-service";
import { inferLegacyRecruiterCompanyName,deriveTpoRecruiterInviteStatus } from "./tpo-recruiter-lead-policy";
import { recruiterAttentionFromPersistedFacts } from "./tpo-recruiter-attention-model";
import { getTpoRecruiterLeadStages } from "./tpo-company-memory-service";
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
  | "TPO_CRM_FOLLOWUP_ALREADY_DONE"
  | "TPO_CRM_INVALID_DUE_AT";

const TPO_CRM_ERROR_MESSAGES: Partial<Record<TpoCrmErrorCode, string>> = {
  TPO_CRM_LEAD_DUPLICATE: "This recruiter is already in your list. Search for them to open it.",
  TPO_CRM_LEAD_NOT_FOUND: "This recruiter contact is no longer available in this college.",
  TPO_CRM_FOLLOWUP_NOT_FOUND: "This follow-up could not be found. Reload your calendar and try again.",
  TPO_CRM_FOLLOWUP_ALREADY_DONE: "A finished follow-up cannot be moved",
  TPO_CRM_INVALID_DUE_AT: "Choose a future date and time for this follow-up.",
};

export class TpoCrmError extends Error {
  constructor(public readonly code: TpoCrmErrorCode) {
    super(TPO_CRM_ERROR_MESSAGES[code] ?? code);
    this.name = "TpoCrmError";
  }
}


/** Mirrors legacy contact normalization; no raw invitation tokens are stored. */
function normalizePhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function ownerMembership(context: RequestContext, collegeId: string) {
  return context.membership?.collegeId === collegeId &&
    context.membership.status === "ACTIVE"
    ? context.membership.id
    : null;
}

/** Explicit API projection: never expose stored invitation token hashes. */
function tpoLeadView(row: typeof placementTpoLeads.$inferSelect, attention?: ReturnType<typeof recruiterAttentionFromPersistedFacts>, stage?: string) {
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
    stage: stage ?? row.manualStage,
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
    chips: attention?.chips ?? [],
    quietDays: attention?.quietDays ?? 0,
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
  if (rows.length === 0) return [];
  const ids = rows.map(row => row.id);
  const db = getDb();
  const [contacts, followups, stages, activities, owners] = await Promise.all([
    db.select({
      leadId: placementTpoLeadActivities.leadId,
      lastContactAt: max(placementTpoLeadActivities.createdAt),
    }).from(placementTpoLeadActivities).where(and(
      eq(placementTpoLeadActivities.collegeId, collegeId),
      inArray(placementTpoLeadActivities.leadId, ids),
      inArray(placementTpoLeadActivities.type, ["CALL", "WHATSAPP", "EMAIL", "MEETING"]),
    )).groupBy(placementTpoLeadActivities.leadId),
    db.select({
      leadId: placementTpoFollowups.leadId,
      nextFollowupAt: min(placementTpoFollowups.dueAt),
    }).from(placementTpoFollowups).where(and(
      eq(placementTpoFollowups.collegeId, collegeId),
      inArray(placementTpoFollowups.leadId, ids),
      isNull(placementTpoFollowups.doneAt),
    )).groupBy(placementTpoFollowups.leadId),
    getTpoRecruiterLeadStages(context, collegeId),
    db.selectDistinctOn([placementTpoLeadActivities.leadId],{
      leadId:placementTpoLeadActivities.leadId,
      lastActivityAt:placementTpoLeadActivities.createdAt,
      lastActivityType:placementTpoLeadActivities.type,
    }).from(placementTpoLeadActivities).where(and(
      eq(placementTpoLeadActivities.collegeId,collegeId),
      inArray(placementTpoLeadActivities.leadId,ids),
    )).orderBy(placementTpoLeadActivities.leadId,
      desc(placementTpoLeadActivities.createdAt),desc(placementTpoLeadActivities.id)),
    db.select({membershipId:collegeMemberships.id,ownerName:users.displayName})
      .from(collegeMemberships)
      .innerJoin(users,eq(users.id,collegeMemberships.userId))
      .where(and(eq(collegeMemberships.collegeId,collegeId),
        eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"))),
  ]);
  const contactByLead = new Map(contacts.map(row => [row.leadId, row.lastContactAt]));
  const nextByLead = new Map(followups.map(row => [row.leadId, row.nextFollowupAt]));
  const now = new Date();
  const activityByLead=new Map(activities.map(row=>[row.leadId,row]));
  const ownerByMembership=new Map(owners.map(row=>[row.membershipId,row.ownerName]));
  // The old list's Stage board was manual first, last activity next.
  // Today we preserve the latest-contact ordering with ID tie-break while
  // exposing the derived stage and the manual legacy stage separately.
  return rows.map(row => {
    const stage = stages.get(row.id);
    return ({
    ...tpoLeadView(row, recruiterAttentionFromPersistedFacts({
    createdAt: row.createdAt,
    lastContactAt: contactByLead.get(row.id) ? new Date(contactByLead.get(row.id) ?? 0) : null,
    lastActivityAt:activityByLead.get(row.id)?.lastActivityAt??null,
    ...(stage !== undefined ? { stage } : {}),
    nextFollowupAt: nextByLead.get(row.id) ? new Date(nextByLead.get(row.id) ?? 0) : null,
    inviteBouncedAt: row.inviteBouncedAt,
    inviteSentAt: row.inviteSentAt,
    recruiterUserId: row.recruiterUserId,
    manualStage: row.manualStage,
    unsubscribedAt: row.unsubscribedAt,
  }, now), stage),
    ownerName:row.ownerMembershipId?ownerByMembership.get(row.ownerMembershipId)??null:null,
    lastContactAt:contactByLead.get(row.id)?.toISOString()??null,
    lastActivityAt:activityByLead.get(row.id)?.lastActivityAt.toISOString()??null,
    lastActivityType:activityByLead.get(row.id)?.lastActivityType??null,
    nextFollowupAt:nextByLead.get(row.id)?.toISOString()??null,
    inviteStatus:row.recruiterUserId?"JOINED":row.inviteBouncedAt?"BOUNCED":
      row.inviteClickedAt?"OPENED":row.inviteSentAt?"SENT":"NOT_INVITED",
  });
  });
}

/** Database partial uniques make email/phone duplicate prevention race-safe. */
export async function createTpoLead(
  context: RequestContext,
  raw: CreateTpoLeadInput,
) {
  const input = createTpoLeadSchema.parse(raw);
  if (!can(context, "placements.manage", { collegeId: input.collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId: input.collegeId });
  const college=await requirePlacementManageScope(context, input.collegeId);

  // Legacy Engage created a lead then separately scheduled a follow-up.
  // In vNext the optional follow-up, append-only activity, staff audit and
  // recruiter notification share this transaction with the lead. A failed
  // follow-up insertion rolls the whole creation back, so neither the
  // prospect nor its required reminder is silently lost. The client must
  // report a failure without claiming that part of the operation succeeded.
  // DB unique constraints remain the race-safe duplicate authority, not
  // the optional preflight duplicate check in the UI.
  try {
    const lead = await getDb().transaction(async (tx) => {
    const [created] = await tx
      .insert(placementTpoLeads)
      .values({
        collegeId: input.collegeId,
        name: input.name,
        emailNorm: input.email ?? null,
        phoneNorm: normalizePhone(input.phone),
        designation: input.designation ?? null,
        companyName: input.companyName ?? inferLegacyRecruiterCompanyName(input.email),
        source: input.source ?? "MANUAL",
        ownerMembershipId: ownerMembership(context, input.collegeId),
      })
      .onConflictDoNothing()
      .returning();
    if (!created) throw new TpoCrmError("TPO_CRM_LEAD_DUPLICATE");
    await tx.insert(placementTpoLeadActivities).values({
      collegeId: input.collegeId,
      leadId: created.id,
      type: "NOTE",
      isSystem: false,
      note: leadCreatedAuditNote(),
      createdByUserId: context.user.id,
    });
    // Initial follow-up belongs to the same transaction: never create a
    // lead without the requested reminder after a partial network failure.
    if(input.followup){
      await tx.insert(placementTpoFollowups).values({
        collegeId:input.collegeId,leadId:created.id,
        dueAt:new Date(input.followup.dueAt),
        note:input.followup.note??null,
        ownerMembershipId:ownerMembership(context,input.collegeId),
      });
    }
    const [event]=await tx.insert(activityEvents).values({
      organizationId:college.organizationId,collegeId:input.collegeId,
      actorUserId:context.user.id,actorMembershipId:context.membership?.id??null,
      module:"PLACEMENTS",eventType:"RECRUITER_LEADS_CREATED",
      subjectType:"placement_tpo_lead",subjectId:created.id,
      summary:"Recruiter lead added",metadata:{source:created.source,hasFollowup:Boolean(input.followup)},
    }).returning({id:activityEvents.id});
    if(event)await notifyActiveTposOfRecruiterEvent(tx,{
     collegeId:college.id,eventId:event.id,leadId:created.id,
     title:"Recruiter lead added",body:"A recruiter contact was added to Engage.",
    });
    return created;
  });
    return tpoLeadView(lead);
  } catch (error) {
    // Convert only the known contact-constraint violation to a safe client
    // validation error; never turn arbitrary database errors into success.
    for (let cause: unknown = error, depth = 0;
      depth < 4 && cause && typeof cause === "object"; depth++) {
      const pgError = cause as { code?: unknown; constraint?: unknown; cause?: unknown };
      if (pgError.code === "23514" && (
        pgError.constraint === "placement_tpo_leads_contact_ck" ||
        pgError.constraint === "placement_tpo_leads_phone_digits_ck"
      )) throw new TpoCrmError("TPO_CRM_CONTACT_REQUIRED");
      cause = pgError.cause;
    }
    throw error;
  }
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
    .orderBy(desc(placementTpoLeadActivities.createdAt), desc(placementTpoLeadActivities.id))
    .limit(200);
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
  expectedCompanyRelationshipId?: string,
) {
  const leadId = tpoCrmLeadIdSchema.parse(rawLeadId);
  const input = logTpoLeadActivitySchema.parse(raw);
  const college=await requirePlacementManageScope(context, input.collegeId);

  return getDb().transaction(async (tx) => {
    const [lead] = await tx
      .select({
        id: placementTpoLeads.id,
        manualStage: placementTpoLeads.manualStage,
        companyRelationshipId: placementTpoLeads.companyRelationshipId,
      })
      .from(placementTpoLeads)
      .where(and(
        eq(placementTpoLeads.collegeId, input.collegeId),
        eq(placementTpoLeads.id, leadId),
      ))
      .for("update")
      .limit(1);
    if (!lead || (
      expectedCompanyRelationshipId &&
      lead.companyRelationshipId !== expectedCompanyRelationshipId
    )) {
      throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");
    }

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

    // Call outcomes are business decisions, not display-only notes. Keep both
    // the timeline event and its state/follow-up side effect in this transaction.
    if (input.type === "CALL" && input.outcome === "Not interested") {
      await tx.update(placementTpoLeads)
        .set({ manualStage: "NOT_NOW", notNowReason: "Not interested",
          notNowUntil: null, updatedAt: new Date() })
        .where(and(eq(placementTpoLeads.id, leadId),
          eq(placementTpoLeads.collegeId, input.collegeId)));
    } else if (lead.manualStage === "NEW") {
      await tx.update(placementTpoLeads)
        .set({ manualStage: "CONTACTED", updatedAt: new Date() })
        .where(and(
          eq(placementTpoLeads.id, leadId),
          eq(placementTpoLeads.collegeId, input.collegeId),
        ));
    }
    if (input.type === "CALL" && input.outcome === "No answer" &&
      lead.manualStage !== "NOT_NOW") {
      const [existing] = await tx.select({id:placementTpoFollowups.id})
        .from(placementTpoFollowups)
        .where(and(eq(placementTpoFollowups.collegeId,input.collegeId),
          eq(placementTpoFollowups.leadId,leadId),
          isNull(placementTpoFollowups.doneAt)))
        .limit(1);
      if(!existing) {
        await tx.insert(placementTpoFollowups).values({
          collegeId:input.collegeId,leadId,
          dueAt:nextDayTpoFollowupAt(new Date()),
          note:"Call again — no answer",
          ownerMembershipId:ownerMembership(context,input.collegeId),
        });
      }
    }
    const nextStage=input.type==="CALL"&&input.outcome==="Not interested"?
      "NOT_NOW":lead.manualStage==="NEW"?"CONTACTED":lead.manualStage;
    if(nextStage!==lead.manualStage){
      const [event]=await tx.insert(activityEvents).values({
        organizationId:college.organizationId,collegeId:input.collegeId,
        actorUserId:context.user.id,actorMembershipId:context.membership?.id??null,
        module:"PLACEMENTS",eventType:"RECRUITER_LEADS_STAGE_SET",
        subjectType:"placement_tpo_lead",subjectId:leadId,
        summary:"Recruiter stage changed after contact",
        metadata:{beforeStage:lead.manualStage,afterStage:nextStage,activityType:input.type},
      }).returning({id:activityEvents.id});
      if(event)await notifyActiveTposOfRecruiterEvent(tx,{
       collegeId:college.id,eventId:event.id,leadId,
       title:"Recruiter stage changed",body:"A recruiter outreach outcome updated the lead stage.",
      });
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
  const college = await requirePlacementManageScope(context, input.collegeId);
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
    if(followup)await tx.insert(activityEvents).values({
      organizationId:college.organizationId,collegeId:input.collegeId,
      actorUserId:context.user.id,actorMembershipId:ownerMembership(context,input.collegeId),
      module:"PLACEMENTS",eventType:"placements.tpo_followup.created",
      subjectType:"placement_tpo_followup",subjectId:followup.id,
      subjectLabel:"Recruiter follow-up",summary:"TPO scheduled recruiter follow-up",
      metadata:{leadId,followupId:followup.id,dueAt:followup.dueAt.toISOString()},
    });
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
    .orderBy(asc(placementTpoFollowups.dueAt),
      asc(placementTpoFollowups.id));
}

export async function moveTpoFollowup(
  context: RequestContext,
  rawFollowupId: string,
  raw: MoveTpoFollowupInput,
) {
 const followupId=tpoCrmFollowupIdSchema.parse(rawFollowupId);
 const input=moveTpoFollowupSchema.parse(raw);
 const college=await requirePlacementManageScope(context,input.collegeId);
 const followup=await getDb().transaction(async tx=>{
  const [prior]=await tx.select()
   .from(placementTpoFollowups)
   .where(and(eq(placementTpoFollowups.id,followupId),
    eq(placementTpoFollowups.collegeId,input.collegeId)))
   .for("update").limit(1);
  if(!prior||prior.doneAt)return null;
  // Re-submitted identical dates must not generate duplicate activity.
  if(prior.dueAt.getTime()===new Date(input.dueAt).getTime())return prior;
  const [changed]=await tx.update(placementTpoFollowups)
   .set({dueAt:new Date(input.dueAt)})
   .where(and(eq(placementTpoFollowups.id,followupId),
    eq(placementTpoFollowups.collegeId,input.collegeId),
    isNull(placementTpoFollowups.doneAt)))
   .returning();
  if(!changed)return null;
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:input.collegeId,
   actorUserId:context.user.id,actorMembershipId:ownerMembership(context,input.collegeId),
   module:"PLACEMENTS",eventType:"placements.tpo_followup.moved",
   subjectType:"placement_tpo_followup",subjectId:changed.id,
   subjectLabel:"Recruiter follow-up",summary:"TPO rescheduled recruiter follow-up",
   metadata:{followupId:changed.id,leadId:changed.leadId,dueAt:changed.dueAt.toISOString()},
  });
  return changed;
 });
 if(followup)return followup;
 const [existing]=await getDb().select({doneAt:placementTpoFollowups.doneAt})
  .from(placementTpoFollowups).where(and(eq(placementTpoFollowups.id,followupId),
   eq(placementTpoFollowups.collegeId,input.collegeId))).limit(1);
 throw new TpoCrmError(existing?"TPO_CRM_FOLLOWUP_ALREADY_DONE":"TPO_CRM_FOLLOWUP_NOT_FOUND");
}
export async function finishTpoFollowup(
  context: RequestContext,
  rawCollegeId: string,
  rawFollowupId: string,
) {
  const collegeId = tpoCrmCollegeIdSchema.parse(rawCollegeId);
  const followupId = tpoCrmFollowupIdSchema.parse(rawFollowupId);
  const college=await requirePlacementManageScope(context, collegeId);
  return getDb().transaction(async (tx) => {
    const [existing] = await tx.select()
      .from(placementTpoFollowups)
      .where(and(
        eq(placementTpoFollowups.collegeId, collegeId),
        eq(placementTpoFollowups.id, followupId),
      ))
      .for("update").limit(1);
    if (!existing) throw new TpoCrmError("TPO_CRM_FOLLOWUP_NOT_FOUND");
    // A repeat Done returns the original row without changing its timestamp.
    if (existing.doneAt) return existing;
    const [updated] = await tx.update(placementTpoFollowups)
      .set({ doneAt: new Date() })
      .where(and(
        eq(placementTpoFollowups.id, existing.id),
        isNull(placementTpoFollowups.doneAt),
      )).returning();
    if(updated)await tx.insert(activityEvents).values({
      organizationId:college.organizationId,collegeId,
      actorUserId:context.user.id,
      actorMembershipId:ownerMembership(context,collegeId),
      module:"PLACEMENTS",eventType:"placements.tpo_followup.finished",
      subjectType:"placement_tpo_followup",subjectId:updated.id,
      subjectLabel:"Recruiter follow-up",summary:"TPO completed a recruiter follow-up",
      metadata:{followupId:updated.id,leadId:updated.leadId,
        completedAt:updated.doneAt?.toISOString()??null},
    });
    return updated ?? existing;
  });
}

export async function markTpoLeadNotNow(
  context: RequestContext,
  rawLeadId: string,
  raw: MarkTpoNotNowInput,
) {
  const leadId = tpoCrmLeadIdSchema.parse(rawLeadId);
  const input = markTpoNotNowSchema.parse(raw);
  if (!can(context, "placements.manage", { collegeId: input.collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId: input.collegeId });
  const college=await requirePlacementManageScope(context, input.collegeId);

  return getDb().transaction(async (tx) => {
    const [current] = await tx.select()
      .from(placementTpoLeads)
      .where(and(
        eq(placementTpoLeads.id, leadId),
        eq(placementTpoLeads.collegeId, input.collegeId),
      ))
      .for("update")
      .limit(1);
    if (!current) throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");
    if (isSameNotNowDecision(current, {
       ...(input.reason !== undefined ? { reason: input.reason } : {}),
       ...(input.revisitDate !== undefined ? { revisitDate: input.revisitDate } : {}),
     })) return tpoLeadView(current);

    const [updated] = await tx.update(placementTpoLeads)
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
    if (!updated) throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");

    await tx.insert(placementTpoLeadActivities).values({
      collegeId: input.collegeId,
      leadId,
      type: "NOTE",
      isSystem: false,
      note: leadNotNowAuditNote(current.manualStage),
      createdByUserId: context.user.id,
    });
    const [event]=await tx.insert(activityEvents).values({
      organizationId:college.organizationId,collegeId:input.collegeId,
      actorUserId:context.user.id,actorMembershipId:context.membership?.id??null,
      module:"PLACEMENTS",eventType:"RECRUITER_LEADS_STAGE_SET",
      subjectType:"placement_tpo_lead",subjectId:leadId,
      summary:"Recruiter lead marked Not now",
      metadata:{beforeStage:current.manualStage,afterStage:"NOT_NOW",
       hasRevisitDate:Boolean(input.revisitDate)},
    }).returning({id:activityEvents.id});
    if(event)await notifyActiveTposOfRecruiterEvent(tx,{
     collegeId:college.id,eventId:event.id,leadId,
     title:"Recruiter marked Not now",body:"A recruiter lead is not ready for placement contact.",
    });
    return tpoLeadView(updated);
  });
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
  if (!normalized) return null;
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
  const college=await requirePlacementManageScope(context, input.collegeId);

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
      await tx.insert(activityEvents).values({
        organizationId:college.organizationId,collegeId:input.collegeId,
        actorUserId:context.user.id,actorMembershipId:context.membership?.id??null,
        module:"PLACEMENTS",eventType:"RECRUITER_LEADS_CONTACT_UPDATED",
        subjectType:"placement_tpo_lead",subjectId:leadId,
        summary:"Recruiter contact details updated",
        metadata:{updatedFields:Object.keys(input).filter(key=>key!=="collegeId")},
      });
      return tpoLeadView(updated);
    });
  } catch (error) {
    // Convert only the two known college-scoped contact uniqueness races.
    // Never claim a random constraint failure is a duplicate lead.
    // Drizzle wraps node-postgres errors in DrizzleQueryError.cause.
    // Check only real SQLSTATE+constraint, not error messages or arbitrary
    // unique conflicts, and bound traversal of driver exception wrappers.
    let cause: unknown = error;
    for (let depth = 0; depth < 4 && cause && typeof cause === "object"; depth++) {
      const pgError = cause as {
        code?: unknown; constraint?: unknown; cause?: unknown;
      };
      if (pgError.code === "23514" && (
        pgError.constraint === "placement_tpo_leads_contact_ck" ||
        pgError.constraint === "placement_tpo_leads_phone_digits_ck"
      )) {
        throw new TpoCrmError("TPO_CRM_CONTACT_REQUIRED");
      }
      if (pgError.code === "23505" && (
        pgError.constraint === "placement_tpo_leads_college_email_uq" ||
        pgError.constraint === "placement_tpo_leads_college_phone_uq"
      )) {
        throw new TpoCrmError("TPO_CRM_LEAD_DUPLICATE");
      }
      cause = pgError.cause;
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
  const [stages, owner, lastLogin]=await Promise.all([
    getTpoRecruiterLeadStages(context,collegeId),
    lead.ownerMembershipId
      ?getDb().select({name:users.displayName}).from(collegeMemberships)
       .innerJoin(users,eq(users.id,collegeMemberships.userId)).where(and(
        eq(collegeMemberships.id,lead.ownerMembershipId),
        eq(collegeMemberships.collegeId,collegeId),
       )).limit(1).then(rows=>rows[0]??null)
      :Promise.resolve(null),
    lead.recruiterUserId
      ?getDb().select({latest:max(identityDeviceSessions.createdAt)})
        .from(identityDeviceSessions).where(eq(identityDeviceSessions.userId,lead.recruiterUserId))
        .then(rows=>rows[0]?.latest??null)
      :Promise.resolve(null),
  ]);
  return {
    ...tpoLeadView(lead,undefined,stages.get(lead.id)),
    ownerName:owner?.name??null,
    recruiterLastLoginAt:lastLogin?.toISOString()??null,
    inviteStatus:deriveTpoRecruiterInviteStatus(lead),
  };
}

/** Full follow-up list for a recruiter lead detail page (not only overdue). */
export async function listTpoLeadFollowups(
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
    .from(placementTpoFollowups)
    .where(and(
      eq(placementTpoFollowups.collegeId, collegeId),
      eq(placementTpoFollowups.leadId, leadId),
    ))
    .orderBy(
      asc(sql`${placementTpoFollowups.doneAt} is not null`),
      asc(placementTpoFollowups.dueAt),
      asc(placementTpoFollowups.id),
    );
}

/**
 * Legacy hand-set "Contacted" status. Only manual statuses can be written:
 * NEVER allow a client to claim Invited/Joined/Recruited/Drive Planned.
 * A row lock and one append-only system event give an idempotent history.
 */
export async function markTpoLeadContacted(
  context: RequestContext,
  rawCollegeId: string,
  rawLeadId: string,
) {
  const collegeId = tpoCrmCollegeIdSchema.parse(rawCollegeId);
  const leadId = tpoCrmLeadIdSchema.parse(rawLeadId);
  const college=await requirePlacementManageScope(context, collegeId);
  return getDb().transaction(async tx => {
    const [current] = await tx
      .select()
      .from(placementTpoLeads)
      .where(and(
        eq(placementTpoLeads.collegeId, collegeId),
        eq(placementTpoLeads.id, leadId),
      ))
      .for("update")
      .limit(1);
    if (!current) throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");
    if (current.manualStage === "CONTACTED") return tpoLeadView(current);

    const [updated] = await tx
      .update(placementTpoLeads)
      .set({
        manualStage: "CONTACTED",
        notNowReason: null,
        notNowUntil: null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(placementTpoLeads.collegeId, collegeId),
        eq(placementTpoLeads.id, leadId),
      ))
      .returning();
    if (!updated) throw new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND");
    await tx.insert(placementTpoLeadActivities).values({
      collegeId,
      leadId,
      // A staff member initiated this transition. Keep the verified user
      // actor on an immutable user-authored NOTE; reserved SYSTEM events
      // must never forge a user actor under registered DB09 constraints.
      type: "NOTE",
      isSystem: false,
      note: "Manual stage changed to Contacted",
      createdByUserId: context.user.id,
    });
    const [event]=await tx.insert(activityEvents).values({
      organizationId:college.organizationId,collegeId,
      actorUserId:context.user.id,actorMembershipId:context.membership?.id??null,
      module:"PLACEMENTS",eventType:"RECRUITER_LEADS_STAGE_SET",
      subjectType:"placement_tpo_lead",subjectId:leadId,
      summary:"Recruiter lead marked Contacted",
      metadata:{beforeStage:current.manualStage,afterStage:"CONTACTED"},
    }).returning({id:activityEvents.id});
    if(event)await notifyActiveTposOfRecruiterEvent(tx,{
     collegeId,eventId:event.id,leadId,title:"Recruiter marked Contacted",
     body:"Recruiter outreach has been recorded.",
    });
    return tpoLeadView(updated);
  });
}
