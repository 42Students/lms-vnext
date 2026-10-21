import {
  isRecruiterInviteTokenShape,
  recruiterInviteTokenHash,
  requireRecruiterInviteUsable,
  RecruiterInviteError,
  type RecruiterInviteLeadState,
} from "./tpo-recruiter-invite-policy";

/**
 * W05 invitation acceptance contract. The storage implementation MUST perform
 * token consumption, recruiter identity association and college grant in one
 * database transaction, with a compare-and-swap on the stored token hash.
 * This module deliberately does not expose an HTTP route until W01 identity
 * and DB09 migration dependencies are verified.
 */
export type InviteAcceptanceRecord = RecruiterInviteLeadState & Readonly<{
  id: string;
  collegeId: string;
  companyRelationshipId: string | null;
}>;

export type InviteAcceptanceStore = {
  findByTokenHash(hash: string): Promise<InviteAcceptanceRecord | null>;
  /** One atomic transaction. Return false on stale/rotated/already used token. */
  consumeAndGrant(args: {
    leadId: string;
    collegeId: string;
    expectedTokenHash: string;
    recruiterUserId: string;
    now: Date;
  }): Promise<boolean>;
};

export async function previewRecruiterInvite(
  store: Pick<InviteAcceptanceStore, "findByTokenHash">,
  token: string | null | undefined,
  now = new Date(),
): Promise<Readonly<{ valid: true; collegeId: string }> > {
  if (!isRecruiterInviteTokenShape(token)) {
    throw new RecruiterInviteError("INVITE_INVALID");
  }
  const lead = await store.findByTokenHash(recruiterInviteTokenHash(token));
  requireRecruiterInviteUsable(token, lead, now);
  // Preview must not mutate lead, grant membership, or expose contact PII.
  return { valid: true, collegeId: lead!.collegeId };
}

export async function acceptRecruiterInvite(
  store: InviteAcceptanceStore,
  input: { token: string | null | undefined; recruiterUserId: string },
  now = new Date(),
): Promise<void> {
  if (!isRecruiterInviteTokenShape(input.token) ||
      typeof input.recruiterUserId !== "string" ||
      !input.recruiterUserId.trim() ||
      !(now instanceof Date) ||
      !Number.isFinite(now.getTime())) {
    throw new RecruiterInviteError("INVITE_INVALID");
  }
  const hash = recruiterInviteTokenHash(input.token);
  const lead = await store.findByTokenHash(hash);
  requireRecruiterInviteUsable(input.token, lead, now);
  // A failed CAS must not reveal whether another consumer won the race.
  const won = await store.consumeAndGrant({
    leadId: lead!.id,
    collegeId: lead!.collegeId,
    expectedTokenHash: hash,
    recruiterUserId: input.recruiterUserId,
    now,
  });
  if (!won) throw new RecruiterInviteError("INVITE_INVALID");
}

/** Safe read-only state for an authenticated recruiter's pending invitations.
 * This mapper consumes already-authorized rows; it cannot discover or accept
 * invitations by email and does not expose the bearer token or token hash.
 * The owner must add a scoped query and CAS-backed acceptance endpoint before
 * mounting a consent panel. */
export type RecruiterPendingInviteRow = Readonly<{
 id:string;
 collegeName:string;
 companyName:string;
 invitedAt:Date;
 expiresAt:Date;
 alreadyAccepted:boolean;
}>;
export function projectRecruiterPendingInvites(
 rows:readonly RecruiterPendingInviteRow[],
 now=new Date(),
) {
 return rows.filter(row=>!row.alreadyAccepted &&
   row.expiresAt.getTime()>now.getTime() &&
   row.invitedAt.getTime()<=now.getTime())
  .map(row=>({
   id:row.id,
   collegeName:row.collegeName,
   companyName:row.companyName,
   invitedAt:row.invitedAt.toISOString(),
   expiresAt:row.expiresAt.toISOString(),
   actionLabel:"Review invitation",
  }));
}
