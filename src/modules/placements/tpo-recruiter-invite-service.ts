import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  colleges,
  placementTpoLeadActivities,
  placementTpoLeads,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePlacementManageScope } from "./scope";
import {
  createRecruiterInviteCredential,
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
) {
  const collegeId = tpoCrmCollegeIdSchema.parse(collegeIdInput);
  const leadId = tpoCrmLeadIdSchema.parse(leadIdInput);
  await requirePlacementManageScope(context, collegeId);

  return getDb().transaction(async (tx) => {
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
      type: "SYSTEM",
      note: "Invite link created",
      isSystem: true,
      createdByUserId: context.user.id,
      createdAt: credential.issuedAt,
    });

    return {
      leadId: updated?.id ?? lead.id,
      token: credential.token,
      expiresAt: credential.expiresAt,
      emailAvailable: Boolean(updated?.emailNorm ?? lead.emailNorm),
      emailed: false,
    };
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
    designation: row.lead.designation,
    expiresAt: new Date(
      row.lead.inviteSentAt!.getTime() + 7 * 24 * 60 * 60 * 1000,
    ),
  };
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
