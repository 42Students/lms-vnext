import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * W05 recruiter invitation token/eligibility rules, source-backed by
 * TpoRecruiterLeadService + RecruiterInviteService in legacy prod-2026.
 *
 * PURE POLICY ONLY: no issue/preview/accept route is activated here.
 * The eventual store must consume a live token with an atomic, single-winner
 * UPDATE and grant college-recruiter access in the same transaction. Do not
 * issue tokens in the UI until that full workflow is available.
 */
export const RECRUITER_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Issued credentials remain 32 random bytes / 43 base64url characters.
 // Previously issued persisted legacy tokens may have varied in length.
 // Shape acceptance alone never grants entry: all requests still require a
 // matching stored 256-bit digest and active, unexpired lead.
const TOKEN_SHAPE = /^[a-zA-Z0-9_-]{16,200}$/;

const HASH_SHAPE = /^[a-f0-9]{64}$/;

export type RecruiterInviteLeadState = Readonly<{
  inviteTokenHash: string | null;
  inviteSentAt: Date | null;
  unsubscribedAt: Date | null;
  manualStage: string;
  recruiterUserId: string | null;
}>;

export type RecruiterInviteCredential = Readonly<{
  token: string;
  hash: string;
  issuedAt: Date;
  expiresAt: Date;
}>;

export class RecruiterInviteError extends Error {
  constructor(readonly code: "INVITE_INVALID" | "INVITE_SEND_NOT_ALLOWED") {
    super(code);
    this.name = "RecruiterInviteError";
  }
}

function validDate(value: Date | null): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime());
}

/** Fast public-boundary shape check before touching storage. */
export function isRecruiterInviteTokenShape(
  token: string | null | undefined,
): token is string {
  return typeof token === "string" && TOKEN_SHAPE.test(token);
}

/** Expiry matches legacy LocalDateTime.isBefore: equality is still usable.
 * Absolute UTC milliseconds are used, so seven days do not depend on IST
 * midnight or daylight savings. Future-dated issuedAt is always invalid.
 */
export function recruiterInviteWithinWindow(issuedAt:Date,now:Date){
 return validDate(issuedAt)&&validDate(now)&&now.getTime()>=issuedAt.getTime()&&
  now.getTime()-issuedAt.getTime()<=RECRUITER_INVITE_TTL_MS;
}
/** Hash lookup key. Never persist or log the raw invitation token. */
export function recruiterInviteTokenHash(token: string): string {
  if (!isRecruiterInviteTokenShape(token)) {
    throw new RecruiterInviteError("INVITE_INVALID");
  }
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function canIssueRecruiterInvite(
  lead: RecruiterInviteLeadState,
): boolean {
  return Boolean(
    !lead.recruiterUserId &&
    !lead.unsubscribedAt,
  );
}

export function createRecruiterInviteCredential(
  lead: RecruiterInviteLeadState,
  now = new Date(),
): RecruiterInviteCredential {
  if (!canIssueRecruiterInvite(lead) || !validDate(now)) {
    throw new RecruiterInviteError("INVITE_SEND_NOT_ALLOWED");
  }
  // 32 cryptographically secure bytes exactly matches legacy format.
  // Never put raw token in DB, audit trails, analytics or notification logs.
  const token = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(token, "utf8").digest("hex");
  return {
    token,
    hash,
    issuedAt: new Date(now.getTime()),
    expiresAt: new Date(now.getTime() + RECRUITER_INVITE_TTL_MS),
  };
}

/**
 * Do not distinguish invalid, expired, rotated, already-consumed, joined,
 * unsubscribed or dormant invitations in public error responses.
 * GET preview must NEVER consume the token or grant access.
 */
export function isRecruiterInviteUsable(
  token: string | null | undefined,
  lead: RecruiterInviteLeadState | null,
  now = new Date(),
): boolean {
  if (
    !isRecruiterInviteTokenShape(token) ||
    !lead ||
    !lead.inviteTokenHash ||
    !HASH_SHAPE.test(lead.inviteTokenHash) ||
    !validDate(lead.inviteSentAt) ||
    !validDate(now) ||
    !recruiterInviteWithinWindow(lead.inviteSentAt,now) ||
    !canIssueRecruiterInvite(lead)
  ) {
    return false;
  }

  // Timing-safe comparison helps avoid making the public preview endpoint a
  // hash-prefix oracle. Token *lookup* must still use hash, never raw token.
  const actual = Buffer.from(recruiterInviteTokenHash(token), "hex");
  const expected = Buffer.from(lead.inviteTokenHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Caller maps every failure to the same public error; no lead enumeration. */
export function requireRecruiterInviteUsable(
  token: string | null | undefined,
  lead: RecruiterInviteLeadState | null,
  now = new Date(),
): void {
  if (!isRecruiterInviteUsable(token, lead, now)) {
    throw new RecruiterInviteError("INVITE_INVALID");
  }
}

/**
 * Reminder is due from day 4 until expiration and only if no non-system
 * contact occurred after the send. Reminder rotates the hash/expiry.
 * This rule does not send mail or mutate storage.
 */
export function canRemindRecruiterInvite(
  lead: RecruiterInviteLeadState & Readonly<{
    emailNorm: string | null;
    inviteClickedAt: Date | null;
    inviteReminderSentAt: Date | null;
  }>,
  hasHumanContactSinceSend: boolean,
  now = new Date(),
): boolean {
  if (!validDate(lead.inviteSentAt) || !validDate(now)) return false;
  const age = now.getTime() - lead.inviteSentAt.getTime();
  return Boolean(
    lead.emailNorm &&
    lead.inviteTokenHash &&
    HASH_SHAPE.test(lead.inviteTokenHash) &&
    !lead.inviteClickedAt &&
    !lead.inviteReminderSentAt &&
    !hasHumanContactSinceSend &&
    canIssueRecruiterInvite(lead) &&
    age >= 4 * 24 * 60 * 60 * 1000 &&
    age < RECRUITER_INVITE_TTL_MS,
  );
}

/** Only the first page open is recorded; later opens are idempotent. */
export function isRecruiterInviteFirstOpen(clickedAt: Date | null): boolean {
  return clickedAt === null;
}

/** Reminder rotates only the bearer digest, not the seven-day start time. */
export function recruiterInviteReminderPatch(hash: string, now: Date) {
  if (!/^[a-f0-9]{64}$/.test(hash) || !Number.isFinite(now.getTime())) {
    throw new RecruiterInviteError("INVITE_INVALID");
  }
  return { inviteTokenHash: hash, inviteReminderSentAt: now, updatedAt: now };
}
