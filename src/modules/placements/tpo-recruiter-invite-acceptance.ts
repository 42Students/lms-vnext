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
