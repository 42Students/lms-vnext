import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  activityEvents, collegeMemberships, inAppNotifications, membershipRoles, users,
  colleges,
  placementTpoLeadActivities,
  placementTpoLeads,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePlacementManageScope } from "./scope";
import {
  createRecruiterInviteCredential,
  canRemindRecruiterInvite,
  recruiterInviteReminderPatch,
  isRecruiterInviteFirstOpen,
  isRecruiterInviteTokenShape,
  recruiterInviteTokenHash,
  requireRecruiterInviteUsable,
  type RecruiterInviteLeadState,
} from "./tpo-recruiter-invite-policy";
import {
  tpoCrmCollegeIdSchema,
  tpoCrmLeadIdSchema,
} from "./tpo-crm-validation";

export type TpoRecruiterInviteServiceErrorCode =
  | "TPO_RECRUITER_INVITE_NOT_FOUND"
  | "TPO_RECRUITER_INVITE_NOT_ALLOWED";

export class TpoRecruiterInviteServiceError extends Error {
  constructor(readonly code: TpoRecruiterInviteServiceErrorCode) {
    super(code);
    this.name = "TpoRecruiterInviteServiceError";
  }
}

function policyState(
  lead: Pick<
    typeof placementTpoLeads.$inferSelect,
    | "inviteTokenHash"
    | "inviteSentAt"
    | "unsubscribedAt"
    | "manualStage"
    | "recruiterUserId"
  >,
): RecruiterInviteLeadState {
  return {
    inviteTokenHash: lead.inviteTokenHash,
    inviteSentAt: lead.inviteSentAt,
    unsubscribedAt: lead.unsubscribedAt,
    manualStage: lead.manualStage,
    recruiterUserId: lead.recruiterUserId,
  };
}

function invalidPublicInvite(): never {
  throw new TpoRecruiterInviteServiceError("TPO_RECRUITER_INVITE_NOT_FOUND");
}

/** Display the original LocalDateTime semantics in Asia/Kolkata, never browser-local. */
export function legacyRecruiterInviteIstLocalTime(value: Date): string {
  const fields = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(value);
  const get = (type: Intl.DateTimeFormatPartTypes) => fields.find(x=>x.type===type)?.value ?? "00";
  return get("year")+"-"+get("month")+"-"+get("day")+"T"+
    get("hour")+":"+get("minute")+":"+get("second");
}

function indiaDateSixMonthsAfter(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const year = value("year");
  const month = value("month");
  const day = value("day");
  const targetMonthIndex = month - 1 + 6;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const targetMonth = targetMonthIndex % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return [
    String(targetYear).padStart(4, "0"),
    String(targetMonth + 1).padStart(2, "0"),
    String(Math.min(day, lastDay)).padStart(2, "0"),
  ].join("-");
}

export async function issueTpoRecruiterInvite(
  context: RequestContext,
  collegeIdInput: string,
  leadIdInput: string,
  now = new Date(),
  delivery?: { sendEmail: boolean; deliver: (collegeId: string, leadId: string, token: string) => Promise<boolean> },
) {
  const collegeId = tpoCrmCollegeIdSchema.parse(collegeIdInput);
  const leadId = tpoCrmLeadIdSchema.parse(leadIdInput);
  const college=await requirePlacementManageScope(context, collegeId);

  const issued = await getDb().transaction(async (tx) => {
    const [lead] = await tx
      .select()
      .from(placementTpoLeads)
      .where(
        and(
          eq(placementTpoLeads.id, leadId),
          eq(placementTpoLeads.collegeId, collegeId),
        ),
      )
      .for("update")
      .limit(1);

    if (!lead) {
      throw new TpoRecruiterInviteServiceError(
        "TPO_RECRUITER_INVITE_NOT_FOUND",
      );
    }
    // A public invite must have a verifiable mailbox and a real company link.
    // Otherwise issuance succeeds but OTP acceptance is structurally impossible.
    if(!lead.emailNorm||!lead.companyRelationshipId){
      throw new TpoRecruiterInviteServiceError("TPO_RECRUITER_INVITE_NOT_ALLOWED");
    }

    let credential;
    try {
      credential = createRecruiterInviteCredential(policyState(lead), now);
    } catch {
      throw new TpoRecruiterInviteServiceError(
        "TPO_RECRUITER_INVITE_NOT_ALLOWED",
      );
    }

    const [updated] = await tx
      .update(placementTpoLeads)
      .set({
        inviteTokenHash: credential.hash,
        inviteSentAt: credential.issuedAt,
        inviteClickedAt: null,
        inviteReminderSentAt: null,
        inviteBouncedAt: null,
        updatedAt: credential.issuedAt,
      })
      .where(
        and(
          eq(placementTpoLeads.id, lead.id),
          eq(placementTpoLeads.collegeId, collegeId),
        ),
      )
      .returning({
        id: placementTpoLeads.id,
        emailNorm: placementTpoLeads.emailNorm,
      });

    await tx.insert(placementTpoLeadActivities).values({
      collegeId,
      leadId,
      // A TPO explicitly issued this link: record the real staff actor as
      // user activity. Public token responses remain SYSTEM with null actor.
      type: "NOTE",
      note: "Invite link created",
      isSystem: false,
      createdByUserId: context.user.id,
      createdAt: credential.issuedAt,
    });
    await tx.insert(activityEvents).values({
      organizationId:college.organizationId,collegeId,
      actorUserId:context.user.id,actorMembershipId:context.membership?.id??null,
      module:"PLACEMENTS",eventType:"RECRUITER_LEADS_INVITE_LINK_CREATED",
      subjectType:"placement_tpo_lead",subjectId:leadId,
      summary:"Recruiter invite link created",
      // A generated link is not an emailed invitation; never claim delivery.
      metadata:{delivery:"NOT_SENT",hasVerifiedEmail:Boolean(updated?.emailNorm??lead.emailNorm)},
    });

    return {
      leadId: updated?.id ?? lead.id,
      token: credential.token,
      expiresAt: credential.expiresAt,
      emailAvailable: Boolean(updated?.emailNorm ?? lead.emailNorm),
      emailed: false,
    };
  });
  if (!delivery?.sendEmail) return issued;
  if (!issued.emailAvailable) return { ...issued, emailed: false };
  // This call is after commit: provider failure must never claim delivery.
  // A retried email may use the still-valid issued credential, not an invented one.
  let accepted = false;
  try { accepted = await delivery.deliver(collegeId, issued.leadId, issued.token); }
  catch { accepted = false; }
  let deliveryAuditRecorded = !accepted;
  if (accepted) {
    try {
      await getDb().insert(placementTpoLeadActivities).values({
        collegeId, leadId: issued.leadId, type: "SYSTEM", isSystem: true,
        note: "Invite email accepted by provider", createdAt: new Date(),
      });
      deliveryAuditRecorded = true;
    } catch {
      // The provider already accepted this message; never imply it was not sent.
      deliveryAuditRecorded = false;
    }
  }
  return { ...issued, emailed: accepted, deliveryAuditRecorded };
}

/**
 * T-S2-03 staged reminder delivery. The caller supplies an approved
 * delivery adapter; there is no public endpoint or scheduled sender until
 * delivery and retry/audit acceptance have been verified.
 */
export async function remindTpoRecruiterInvite(
  context: RequestContext, collegeIdInput: string, leadIdInput: string,
  deliver: (email: string, token: string, expiresAt: Date) => Promise<boolean>,
  now = new Date(),
): Promise<{ reminded: true }> {
  if (process.env.TPO_RECRUITER_REMINDER_READY !== "VERIFIED") {
    throw new TpoRecruiterInviteServiceError("TPO_RECRUITER_INVITE_NOT_ALLOWED");
  }
  const collegeId = tpoCrmCollegeIdSchema.parse(collegeIdInput);
  const leadId = tpoCrmLeadIdSchema.parse(leadIdInput);
  await requirePlacementManageScope(context, collegeId);
  return getDb().transaction(async tx => {
    const [lead] = await tx.select().from(placementTpoLeads)
      .where(and(eq(placementTpoLeads.collegeId, collegeId),
        eq(placementTpoLeads.id, leadId))).for("update").limit(1);
    if (!lead || !lead.inviteSentAt || !lead.emailNorm || !lead.inviteTokenHash) {
      throw new TpoRecruiterInviteServiceError("TPO_RECRUITER_INVITE_NOT_ALLOWED");
    }
    const [contact] = await tx.select({ id: placementTpoLeadActivities.id })
      .from(placementTpoLeadActivities).where(and(
        eq(placementTpoLeadActivities.collegeId, collegeId),
        eq(placementTpoLeadActivities.leadId, leadId),
        eq(placementTpoLeadActivities.isSystem, false),
        gt(placementTpoLeadActivities.createdAt, lead.inviteSentAt),
      )).limit(1);
    if (!canRemindRecruiterInvite({
      ...policyState(lead),
      emailNorm: lead.emailNorm,
      inviteClickedAt: lead.inviteClickedAt,
      inviteReminderSentAt: lead.inviteReminderSentAt,
    }, Boolean(contact), now)) {
      throw new TpoRecruiterInviteServiceError("TPO_RECRUITER_INVITE_NOT_ALLOWED");
    }
    const issued = createRecruiterInviteCredential(policyState(lead), now);
    const originalExpiry = new Date(lead.inviteSentAt.getTime() + 7*24*60*60*1000);
    if (!await deliver(lead.emailNorm, issued.token, originalExpiry)) {
      throw new TpoRecruiterInviteServiceError("TPO_RECRUITER_INVITE_NOT_ALLOWED");
    }
    const [updated] = await tx.update(placementTpoLeads)
      .set(recruiterInviteReminderPatch(issued.hash, now))
      .where(and(
        eq(placementTpoLeads.id, lead.id),
        eq(placementTpoLeads.collegeId, collegeId),
        eq(placementTpoLeads.inviteTokenHash, lead.inviteTokenHash),
        isNull(placementTpoLeads.inviteReminderSentAt),
        isNull(placementTpoLeads.inviteClickedAt),
      )).returning({ id: placementTpoLeads.id });
    if (!updated) throw new TpoRecruiterInviteServiceError("TPO_RECRUITER_INVITE_NOT_ALLOWED");
    await tx.insert(placementTpoLeadActivities).values({
      collegeId, leadId, type: "SYSTEM", isSystem: true,
      note: "Invite reminder sent", createdAt: now,
    });
    return { reminded: true };
  });
}

async function loadPublicInvite(
  token: string,
  now: Date,
) {
  if (!isRecruiterInviteTokenShape(token)) {
    return invalidPublicInvite();
  }

  const hash = recruiterInviteTokenHash(token);
  const [row] = await getDb()
    .select({
      lead: placementTpoLeads,
      collegeName: colleges.name,
    })
    .from(placementTpoLeads)
    .innerJoin(colleges, eq(colleges.id, placementTpoLeads.collegeId))
    .where(eq(placementTpoLeads.inviteTokenHash, hash))
    .limit(1);

  if (!row) return invalidPublicInvite();

  try {
    requireRecruiterInviteUsable(token, policyState(row.lead), now);
  } catch {
    return invalidPublicInvite();
  }

  return row;
}

export async function previewRecruiterInvite(
  token: string,
  now = new Date(),
) {
  const row = await loadPublicInvite(token, now);
  return {
    collegeName: row.collegeName,
    companyName: row.lead.companyName,
    contactName: row.lead.name,
    contactEmail: row.lead.emailNorm,
    // Legacy recruiter-invite consumers read "email" rather than contactEmail.
    email: row.lead.emailNorm,
    // No verified review-drive link exists on the lead; do not invent one.
    reviewDrive: null as string | null,
    designation: row.lead.designation,
    expiresAt: new Date(
      row.lead.inviteSentAt!.getTime() + 7 * 24 * 60 * 60 * 1000,
    ),
  };
}

/**
 * T-S2-03: first actual browser open is a separate, same-origin POST.
 * GET preview stays read-only; retries or React StrictMode cannot double-log.
 * Never consume the invite token or expose its hash in the response.
 */
export async function recordRecruiterInviteFirstOpen(
  token: string, now: Date = new Date(),
): Promise<{ recorded: boolean }> {
  if (!isRecruiterInviteTokenShape(token)) return invalidPublicInvite();
  const hash = recruiterInviteTokenHash(token);
  return getDb().transaction(async (tx) => {
    const [lead] = await tx.select().from(placementTpoLeads)
      .where(eq(placementTpoLeads.inviteTokenHash, hash))
      .for("update").limit(1);
    if (!lead) return invalidPublicInvite();
    try {
      requireRecruiterInviteUsable(token, policyState(lead), now);
    } catch {
      return invalidPublicInvite();
    }
    if (!isRecruiterInviteFirstOpen(lead.inviteClickedAt)) {
      return { recorded: false };
    }
    const [changed] = await tx.update(placementTpoLeads).set({
      inviteClickedAt: now,
      updatedAt: now,
    }).where(and(
      eq(placementTpoLeads.id, lead.id),
      eq(placementTpoLeads.inviteTokenHash, hash),
      isNull(placementTpoLeads.inviteClickedAt),
    )).returning({ id: placementTpoLeads.id });
    if (!changed) return { recorded: false };
    await tx.insert(placementTpoLeadActivities).values({
      collegeId: lead.collegeId,
      leadId: lead.id,
      type: "SYSTEM", isSystem: true,
      note: "Invite link opened",
      createdAt: now,
    });
    return { recorded: true };
  });
}

type InviteTx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
/** PUB-auth-public-49: one bell per explicit recruiter response, atomically with
 * the irrevocable token consumption. GET previews never create TPO notices. */
async function recordPublicRecruiterDecision(tx:InviteTx,lead:typeof placementTpoLeads.$inferSelect,
 action:"NOT_HIRING"|"UNSUBSCRIBE",now:Date){
 const [college]=await tx.select({organizationId:colleges.organizationId}).from(colleges)
  .where(eq(colleges.id,lead.collegeId)).limit(1);
 if(!college)throw new TpoRecruiterInviteServiceError("TPO_RECRUITER_INVITE_NOT_FOUND");
 const title=action==="NOT_HIRING"?"Recruiter not hiring this season":"Recruiter unsubscribed";
 const [event]=await tx.insert(activityEvents).values({
  organizationId:college.organizationId,collegeId:lead.collegeId,
  module:"PLACEMENTS",eventType:action==="NOT_HIRING"?"PLACEMENTS_RECRUITER_NOT_HIRING":"PLACEMENTS_RECRUITER_UNSUBSCRIBED",
  subjectType:"placement_tpo_lead",subjectId:lead.id,subjectLabel:lead.companyName??"Recruiter",
  summary:title,occurredAt:now,
 }).returning({id:activityEvents.id});
 if(!event)throw new TpoRecruiterInviteServiceError("TPO_RECRUITER_INVITE_NOT_FOUND");
 const officers=await tx.selectDistinct({userId:collegeMemberships.userId})
  .from(collegeMemberships).innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"TPO")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .where(and(eq(collegeMemberships.collegeId,lead.collegeId),eq(collegeMemberships.status,"ACTIVE")));
 if(officers.length)await tx.insert(inAppNotifications).values(officers.map(o=>({
  userId:o.userId,eventId:event.id,title,
  body:action==="NOT_HIRING"?"Moved to Not now. Revisit in six months.":"This recruiter asked to stop receiving invitations.",
  actionHref:"/tpo/recruiters",
 }))).onConflictDoNothing();
}

async function mutatePublicInvite(
  token: string,
  now: Date,
  action: "NOT_HIRING" | "UNSUBSCRIBE",
) {
  if (!isRecruiterInviteTokenShape(token)) {
    return invalidPublicInvite();
  }
  const hash = recruiterInviteTokenHash(token);

  return getDb().transaction(async (tx) => {
    const [lead] = await tx
      .select()
      .from(placementTpoLeads)
      .where(eq(placementTpoLeads.inviteTokenHash, hash))
      .for("update")
      .limit(1);
    if (!lead) return invalidPublicInvite();

    try {
      requireRecruiterInviteUsable(token, policyState(lead), now);
    } catch {
      return invalidPublicInvite();
    }

    if (action === "NOT_HIRING") {
      await tx
        .update(placementTpoLeads)
        .set({
          manualStage: "NOT_NOW",
          notNowReason:
            "Said they are not hiring from this college this season",
          notNowUntil: indiaDateSixMonthsAfter(now),
          inviteTokenHash: null,
          updatedAt: now,
        })
        .where(
          and(
            eq(placementTpoLeads.id, lead.id),
            eq(placementTpoLeads.inviteTokenHash, hash),
          ),
        );
      await tx.insert(placementTpoLeadActivities).values({
        collegeId: lead.collegeId,
        leadId: lead.id,
        type: "SYSTEM",
        note: "Replied: not hiring this season",
        isSystem: true,
        createdAt: now,
      });
      await recordPublicRecruiterDecision(tx,lead,"NOT_HIRING",now);
      return { status: "NOT_HIRING" as const };
    }

    await tx
      .update(placementTpoLeads)
      .set({
        unsubscribedAt: now,
        inviteTokenHash: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(placementTpoLeads.id, lead.id),
          eq(placementTpoLeads.inviteTokenHash, hash),
        ),
      );
    await tx.insert(placementTpoLeadActivities).values({
      collegeId: lead.collegeId,
      leadId: lead.id,
      type: "SYSTEM",
      note: "Unsubscribed from invitations",
      isSystem: true,
      createdAt: now,
    });
    await recordPublicRecruiterDecision(tx,lead,"UNSUBSCRIBE",now);
    return { status: "UNSUBSCRIBED" as const };
  });
}

export function markRecruiterInviteNotHiring(
  token: string,
  now = new Date(),
) {
  return mutatePublicInvite(token, now, "NOT_HIRING");
}

export function unsubscribeRecruiterInvite(
  token: string,
  now = new Date(),
) {
  return mutatePublicInvite(token, now, "UNSUBSCRIBE");
}

/** Reminder dates are based on a single original issuance, not a new rolling
 * seven-day window; a browser's POST /opened stays the trusted open signal.
 * Do not make public GET mutate a lead: email scanners prefetch invite URLs.
 */
export const RECRUITER_INVITE_REMINDER_DAY = 4;
